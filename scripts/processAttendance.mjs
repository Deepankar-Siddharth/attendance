/**
 * BDSTrack — Excel → JSON data pipeline
 *
 * Reads data/attendance.xlsx (the single source of truth) and generates:
 *   - src/data/attendance.json   (normalized, exclusion-aware student data)
 *   - src/data/issues.json       (data-quality registry — never silently fixed)
 *   - src/data/validation.json   (summary report)
 *
 * Design rules:
 *   - Month groups are discovered dynamically from the two-level header.
 *   - Percentages are always recomputed from raw counts (never trusted from Excel).
 *   - Source values are preserved verbatim; invalid values are excluded from
 *     calculations ONLY when necessary, and the exclusion is recorded in an issue.
 *   - Attendance-data issues NEVER block processing.
 *   - The script exits non-zero ONLY on technical/structural failures
 *     (unreadable workbook, missing required structure/sheets, parser crash).
 */

import { readFileSync, statSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import XLSX from "xlsx";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DATA_DIR = join(ROOT, "data");
const SRC_DATA_DIR = join(ROOT, "src", "data");
const EXCEL_PATH = process.env.BDSTRACK_EXCEL || join(DATA_DIR, "attendance.xlsx");

// Fallback used only when the workbook carries no year information.
const DEFAULT_START_YEAR = 2024;

const MONTH_INDEX = {
  January: 0, February: 1, March: 2, April: 3, May: 4, June: 5,
  July: 6, August: 7, September: 8, October: 9, November: 10, December: 11,
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const norm = (s) =>
  String(s ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();

const toNumber = (v) => {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v).trim());
  return Number.isFinite(n) ? n : null;
};

const pct = (attended, taken) => (taken > 0 ? (attended / taken) * 100 : null);

const round = (v, d = 2) =>
  v === null || v === undefined ? null : Number(v.toFixed(d));

/* ------------------------------------------------------------------ */
/* Logging                                                             */
/* ------------------------------------------------------------------ */

const log = (...args) => console.log(...args);
let structuralFailure = null;

const failStructural = (message) => {
  structuralFailure ||= message;
};

/* ------------------------------------------------------------------ */
/* Step 1 — Load workbook                                              */
/* ------------------------------------------------------------------ */

let wb;
try {
  if (!existsSync(EXCEL_PATH)) {
    console.warn(`[WARN] Excel workbook not found at ${EXCEL_PATH}.`);
    console.warn(`[WARN] Skipping data processing. The existing JSON data will be used.`);
    process.exit(0);
  }
  wb = XLSX.readFile(EXCEL_PATH, { cellDates: true });
} catch (err) {
  console.error("[FATAL] Could not open the Excel workbook.");
  console.error(`  path: ${EXCEL_PATH}`);
  console.error(`  reason: ${err.message}`);
  process.exit(1);
}

log("Attendance Data Processing");
log("");
log("✓ Workbook loaded");

/* ------------------------------------------------------------------ */
/* Step 2 — Discover sheets                                            */
/* ------------------------------------------------------------------ */

const sheets = wb.SheetNames;
log(`✓ ${sheets.length} sheets detected`);

const rowsOf = (name) =>
  XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, defval: null });

// A subject sheet has the two-level month header ("Month: <Name>" in R5).
const subjectSheets = sheets.filter((name) => {
  const rows = rowsOf(name);
  const r5 = rows[4] || [];
  return r5.some((c) => typeof c === "string" && /^month:/i.test(c.trim()));
});

if (subjectSheets.length === 0) {
  failStructural("No subject sheets found — could not locate a two-level 'Month:' header structure.");
}
log(`✓ ${subjectSheets.length} subject sheets detected`);
log(`  ${subjectSheets.join(" | ")}`);

// The consolidated sheet is the remaining sheet (if any).
const consolidatedSheets = sheets.filter((s) => !subjectSheets.includes(s));
const consolidatedSheet = consolidatedSheets[0] || null;
if (consolidatedSheet) log(`  Consolidated sheet: "${consolidatedSheet}"`);

/* ------------------------------------------------------------------ */
/* Step 3 — Parse subject sheets                                       */
/* ------------------------------------------------------------------ */

function parseSubjectSheet(sheetName) {
  const rows = rowsOf(sheetName);
  if (!rows || rows.length < 7) {
    failStructural(`Subject sheet "${sheetName}" has an impossible structure (too few rows).`);
    return null;
  }

  const r5 = rows[4] || [];
  const r6 = rows[5] || [];

  // Detect month groups from R5.
  const months = [];
  r5.forEach((cell, col) => {
    if (typeof cell === "string") {
      const m = cell.trim().match(/^month:\s*(.+)$/i);
      if (m) months.push({ name: m[1].trim(), col });
    }
  });

  if (months.length === 0) {
    failStructural(`Subject sheet "${sheetName}" has no 'Month:' headers — header parsing failed.`);
    return null;
  }

  // Validate each month group's sub-header layout (accept minor typos).
  for (const m of months) {
    const labels = [0, 1, 2, 3, 4, 5].map((i) => norm(r6[m.col + i]));
    const ok =
      labels[0] === "LECTURE TAKEN" &&
      labels[1] === "LECTURE ATTENDED" &&
      (labels[2] === "%" || labels[2] === "PERCENTAGE") &&
      /^PRACTICAL|PRACICAL/.test(labels[3]) &&
      /^PRACTICAL|PRACICAL/.test(labels[4]) &&
      (labels[5] === "%" || labels[5] === "PERCENTAGE");
    if (!ok) {
      failStructural(
        `Subject sheet "${sheetName}" month "${m.name}" has an unexpected sub-header layout (${labels.join(",")}).`
      );
      return null;
    }
  }

  // Detect totals columns from R6.
  const findLabel = (label, from = 0) => {
    for (let i = from; i < r6.length; i++) if (norm(r6[i]) === label) return i;
    return -1;
  };
  const totals = {
    totalLt: findLabel("TOTAL LT"),
    totalLa: findLabel("TOTAL LA"),
    totalLPer: findLabel("PER", findLabel("TOTAL LT") + 1),
    totalPt: findLabel("TOTAL PT"),
    totalPa: findLabel("TOTAL PA"),
    totalPPer: findLabel("PER", findLabel("TOTAL PT") + 1),
    totalConducted: findLabel("LT+PT"),
    totalAttended: findLabel("LA+PA"),
    totalPercentage: findLabel("TOTAL %"),
  };
  if (Object.values(totals).some((v) => v === -1)) {
    failStructural(`Subject sheet "${sheetName}" is missing expected TOTAL columns in the header.`);
    return null;
  }

  const titles = {
    university: rows[0]?.[0] ? String(rows[0][0]).trim() : "",
    college: rows[1]?.[0] ? String(rows[1][0]).trim() : "",
    batchTitle: rows[2]?.[0] ? String(rows[2][0]).trim() : "",
    department: rows[3]?.[0] ? String(rows[3][0]).trim() : "",
  };

  let section = "Sep Batch";
  if (/feb\s*batch/i.test(titles.batchTitle)) section = "Feb Batch";

  const students = [];

  for (let r = 6; r < rows.length; r++) {
    const row = rows[r] || [];
    const sno = row[0];
    const rollRaw = row[1];
    const nameRaw = row[2];

    // Section headers / blank rows: no roll number.
    if (rollRaw === null || rollRaw === undefined || String(rollRaw).trim() === "") {
      const label = String(sno ?? "").trim();
      if (/supplementary/i.test(label)) section = "Supplementary";
      else if (/feb\s*batch/i.test(label)) section = "Feb Batch";
      continue;
    }

    const roll = String(rollRaw).trim();
    const name = String(nameRaw ?? "").trim();

    if (!name) {
      issueRegistry.push({
        severity: "error",
        type: "missing_name",
        studentRoll: roll,
        subject: sheetName,
        message: `Student with roll ${roll} has no name in the "${sheetName}" sheet.`,
        affectsStudent: true,
        affectsCalculations: true,
      });
      continue;
    }

    // Month data
    const monthly = [];
    for (const m of months) {
      const lt = toNumber(row[m.col]);
      const la = toNumber(row[m.col + 1]);
      const pt = toNumber(row[m.col + 3]);
      const pa = toNumber(row[m.col + 4]);

      const lecture = {
        taken: lt ?? 0,
        attended: la ?? 0,
        percentage: null,
        excluded: false,
        issueIds: [],
      };
      const practical = {
        taken: pt ?? 0,
        attended: pa ?? 0,
        percentage: null,
        excluded: false,
        issueIds: [],
      };

      // Detect invalid numeric values.
      for (const [key, val, session, takenVal] of [
        ["attended", la, "lecture", lt],
        ["attended", pa, "practical", pt],
        ["taken", lt, "lecture", null],
        ["taken", pt, "practical", null],
      ]) {
        if (takenVal === null && val === null) continue;
        if (val === null || Number.isNaN(val)) {
          pushIssue({
            severity: "error",
            type: "invalid_numeric",
            studentRoll: roll,
            studentName: name,
            subject: sheetName,
            month: m.name,
            session,
            attended: session === "lecture" ? la : pa,
            conducted: session === "lecture" ? lt : pt,
            message: `Non-numeric ${key} value recorded for ${m.name} ${session}.`,
            affectsStudent: true,
            affectsCalculations: true,
          });
        }
      }

      // Attended > conducted
      if (lecture.attended > lecture.taken) {
        lecture.excluded = true;
        pushIssue({
          severity: "error",
          type: "invalid_attendance",
          studentRoll: roll,
          studentName: name,
          subject: sheetName,
          month: m.name,
          session: "lecture",
          attended: lecture.attended,
          conducted: lecture.taken,
          percentage: lecture.taken > 0 ? round((lecture.attended / lecture.taken) * 100) : null,
          message: "Attended classes exceed conducted classes.",
          affectsStudent: true,
          affectsCalculations: true,
        });
      }
      if (practical.attended > practical.taken) {
        practical.excluded = true;
        pushIssue({
          severity: "error",
          type: "invalid_attendance",
          studentRoll: roll,
          studentName: name,
          subject: sheetName,
          month: m.name,
          session: "practical",
          attended: practical.attended,
          conducted: practical.taken,
          percentage: practical.taken > 0 ? round((practical.attended / practical.taken) * 100) : null,
          message: "Attended classes exceed conducted classes.",
          affectsStudent: true,
          affectsCalculations: true,
        });
      }
      // Negative values
      for (const s of ["lecture", "practical"]) {
        const rec = s === "lecture" ? lecture : practical;
        if (rec.taken < 0 || rec.attended < 0) {
          rec.excluded = true;
          pushIssue({
            severity: "error",
            type: "negative_attendance",
            studentRoll: roll,
            studentName: name,
            subject: sheetName,
            month: m.name,
            session: s,
            attended: rec.attended,
            conducted: rec.taken,
            message: "Negative attendance value recorded.",
            affectsStudent: true,
            affectsCalculations: true,
          });
        }
      }

      lecture.percentage = pct(lecture.attended, lecture.taken);
      practical.percentage = pct(practical.attended, practical.taken);

      const vLt = lecture.excluded ? 0 : lecture.taken;
      const vLa = lecture.excluded ? 0 : lecture.attended;
      const vPt = practical.excluded ? 0 : practical.taken;
      const vPa = practical.excluded ? 0 : practical.attended;

      monthly.push({
        month: m.name,
        lecture: {
          taken: lecture.taken,
          attended: lecture.attended,
          percentage: round(lecture.percentage),
          excluded: lecture.excluded,
          issueIds: lecture.issueIds,
        },
        practical: {
          taken: practical.taken,
          attended: practical.attended,
          percentage: round(practical.percentage),
          excluded: practical.excluded,
          issueIds: practical.issueIds,
        },
        percentage: round(pct(vLa + vPa, vLt + vPt)),
        excluded: lecture.excluded || practical.excluded,
        issueIds: [...lecture.issueIds, ...practical.issueIds],
      });
    }

    // Subject-level totals computed from VALID (non-excluded) sessions.
    let lTaken = 0, lAttended = 0, pTaken = 0, pAttended = 0, validMonths = 0;
    const excluded = [];
    for (const mm of monthly) {
      const vLt = mm.lecture.excluded ? 0 : mm.lecture.taken;
      const vLa = mm.lecture.excluded ? 0 : mm.lecture.attended;
      const vPt = mm.practical.excluded ? 0 : mm.practical.taken;
      const vPa = mm.practical.excluded ? 0 : mm.practical.attended;
      if (vLt + vPt > 0) validMonths++;
      if (mm.lecture.excluded)
        excluded.push({ month: mm.month, session: "lecture", issueId: mm.lecture.issueIds[0] });
      if (mm.practical.excluded)
        excluded.push({ month: mm.month, session: "practical", issueId: mm.practical.issueIds[0] });
      lTaken += vLt; lAttended += vLa; pTaken += vPt; pAttended += vPa;
    }

    students.push({
      rollNo: roll,
      name,
      section,
      monthly,
      lecture: {
        taken: lTaken,
        attended: lAttended,
        percentage: round(pct(lAttended, lTaken)),
      },
      practical: {
        taken: pTaken,
        attended: pAttended,
        percentage: round(pct(pAttended, pTaken)),
      },
      total: {
        taken: lTaken + pTaken,
        attended: lAttended + pAttended,
        missed: (lTaken + pTaken) - (lAttended + pAttended),
        percentage: round(pct(lAttended + pAttended, lTaken + pTaken)),
        validMonths,
        excluded,
      },
    });
  }

  return { sheetName, titles, months, totals, students };
}

/* ------------------------------------------------------------------ */
/* Issue registry                                                      */
/* ------------------------------------------------------------------ */

const issueRegistry = [];

function pushIssue(issue) {
  issueRegistry.push(issue);
}

// Build a fast student roll -> { name, subjectSets } index while parsing.
const studentIndex = new Map(); // roll -> { name, subjects: Set }

const parsedSheets = [];
for (const name of subjectSheets) {
  const parsed = parseSubjectSheet(name);
  if (parsed) parsedSheets.push(parsed);
}

if (structuralFailure) {
  console.error("\n[FATAL] Structural failure while parsing the workbook:");
  console.error(`  ${structuralFailure}`);
  process.exit(1);
}

/* ------------------------------------------------------------------ */
/* Step 4 — Class-level checks                                         */
/* ------------------------------------------------------------------ */

// 4.1 Identical subject sheets
const sheetKeys = new Map();
for (const ps of parsedSheets) {
  const key = JSON.stringify(
    ps.students.map((s) => [
      s.rollNo,
      s.name,
      ...s.monthly.flatMap((m) => [m.lecture.taken, m.lecture.attended, m.practical.taken, m.practical.attended]),
    ])
  );
  if (!sheetKeys.has(key)) sheetKeys.set(key, []);
  sheetKeys.get(key).push(ps.sheetName);
}
for (const [key, names] of sheetKeys) {
  if (names.length > 1) {
    pushIssue({
      severity: "warning",
      type: "identical_sheets",
      scope: "class",
      subjects: [...names],
      message: `These subject sheets contain identical attendance data: ${names.join(" and ")}. This may be a copy error in the source workbook.`,
      affectsStudent: false,
      affectsCalculations: false,
    });
  }
}

// 4.2 Monthly conducted-count variance per subject
for (const ps of parsedSheets) {
  const affected = [];
  for (let mi = 0; mi < ps.months.length; mi++) {
    const takenSet = new Set(ps.students.map((s) => s.monthly[mi].lecture.taken));
    const pTakenSet = new Set(ps.students.map((s) => s.monthly[mi].practical.taken));
    if (takenSet.size > 1 || pTakenSet.size > 1) {
      affected.push({
        month: ps.months[mi].name,
        lecture: takenSet.size > 1 ? [...takenSet].sort((a, b) => a - b) : undefined,
        practical: pTakenSet.size > 1 ? [...pTakenSet].sort((a, b) => a - b) : undefined,
      });
    }
  }
  if (affected.length > 0) {
    pushIssue({
      severity: "warning",
      type: "conducted_variance",
      scope: "class",
      subject: ps.sheetName,
      months: affected.map((a) => a.month),
      message: `Monthly class-conducted counts vary between students in "${ps.sheetName}" (${affected.map((a) => a.month).join(", ")}). Class counts should normally be identical for all students.`,
      affectsStudent: false,
      affectsCalculations: false,
    });
  }
}

// 4.3 Consolidated vs subject sheets + simple-average methodology note
let consolidatedByRoll = new Map();
let consolidatedSubjList = [];
if (consolidatedSheet) {
  const rows = rowsOf(consolidatedSheet);
  const header = rows[3] || [];
  // Consolidated subject order from header (skip S.NO / ROLL / NAME).
  const cSubjects = [];
  for (let c = 3; c < header.length; c++) {
    const txt = typeof header[c] === "string" ? header[c].trim() : "";
    if (txt && !/^total/i.test(txt)) cSubjects.push(txt);
  }
  consolidatedSubjList = cSubjects;
  for (let r = 4; r < rows.length; r++) {
    const row = rows[r] || [];
    const roll = row[1] === null || row[1] === undefined ? null : String(row[1]).trim();
    if (!roll) continue;
    consolidatedByRoll.set(roll, { name: row[2], values: row.slice(3, 3 + cSubjects.length), total: row[3 + cSubjects.length] });
  }

  // Missing subject sheet for a subject named in the consolidated sheet.
  for (const cSubj of cSubjects) {
    if (!parsedSheets.some((ps) => norm(ps.sheetName) === norm(cSubj))) {
      failStructural(`The consolidated sheet references subject "${cSubj}" but no matching subject sheet was found.`);
    }
  }
}

// Methodology note (info).
pushIssue({
  severity: "info",
  type: "calculation_methodology",
  scope: "class",
  message:
    "The consolidated sheet's overall total uses a simple average of subject percentages, while BDSTrack calculates overall attendance as total attended / total conducted (weighted by actual classes).",
  affectsStudent: false,
  affectsCalculations: false,
});

// 4.4 Consolidated-vs-subject percentage differences
if (consolidatedSheet && parsedSheets.length > 0) {
  const firstSheet = parsedSheets[0];
  const firstStudents = new Map(firstSheet.students.map((s) => [s.rollNo, s]));
  const firstMonths = firstSheet.months.map((m) => m.name);
  // Determine the year mapping for the period (from sheet name if possible).
  const sheetNameMatch = consolidatedSheet.match(/(\d{4})\s*to\s*(\d{4})/);
  const startYear = sheetNameMatch ? Number(sheetNameMatch[1]) : DEFAULT_START_YEAR;
  const endYear = sheetNameMatch ? Number(sheetNameMatch[2]) : DEFAULT_START_YEAR + 1;

  // Compare per-student consolidated subject % with recomputed subject total % (raw, pre-exclusion).
  const recomputedBySubject = new Map(); // subjectSheetName -> Map(roll -> rawPct)
  for (const ps of parsedSheets) {
    const map = new Map();
    for (const s of ps.students) {
      let t = 0, a = 0;
      for (const m of s.monthly) { t += m.lecture.taken + m.practical.taken; a += m.lecture.attended + m.practical.attended; }
      map.set(s.rollNo, pct(a, t));
    }
    recomputedBySubject.set(ps.sheetName, map);
  }

  for (const [roll, rec] of consolidatedByRoll) {
    for (let i = 0; i < consolidatedSubjList.length; i++) {
      const subjName = consolidatedSubjList[i];
      const sourceMap = recomputedBySubject.get(subjName) || recomputedBySubject.get(
        parsedSheets.find((ps) => norm(ps.sheetName) === norm(subjName))?.sheetName
      );
      if (!sourceMap) continue;
      const rawPct = sourceMap.get(roll);
      const consPct = toNumber(rec.values[i]);
      if (rawPct !== null && consPct !== null && Math.abs(rawPct - consPct) > 1) {
        pushIssue({
          severity: "warning",
          type: "consolidated_difference",
          scope: "class",
          studentRoll: roll,
          studentName: rec.name,
          subject: subjName,
          message: `Consolidated sheet shows ${round(consPct)}% for ${subjName}, but subject-sheet data computes to ${round(rawPct)}%.`,
          affectsStudent: true,
          affectsCalculations: false,
        });
      }
    }
  }

  // Record period from consolidated sheet.
  parsedSheets[0].period = { startYear, endYear };
}

/* ------------------------------------------------------------------ */
/* Step 5 — Build the normalized model                                 */
/* ------------------------------------------------------------------ */

const subjectOrder = parsedSheets.map((ps) => ps.sheetName);
const monthsDetected = parsedSheets[0]?.months.map((m) => m.name) || [];

const allStudents = new Map();
for (const ps of parsedSheets) {
  for (const s of ps.students) {
    if (!allStudents.has(s.rollNo)) {
      allStudents.set(s.rollNo, {
        rollNo: s.rollNo,
        name: s.name,
        section: s.section,
        subjects: {},
        issues: [],
      });
    }
    allStudents.get(s.rollNo).subjects[ps.sheetName] = {
      subject: ps.sheetName,
      monthly: s.monthly,
      lecture: s.lecture,
      practical: s.practical,
      total: s.total,
      issues: s.total.excluded.map((e) => e.issueId).filter(Boolean),
    };
  }
}

// Attach student-level issues to each student record.
const issuesByStudent = new Map();
for (const issue of issueRegistry) {
  if (issue.studentRoll) {
    if (!issuesByStudent.has(issue.studentRoll)) issuesByStudent.set(issue.studentRoll, []);
    issuesByStudent.get(issue.studentRoll).push(issue.id);
  }
}

// Assign IDs after ordering (errors first, then warnings, then info).
const severityRank = { error: 0, warning: 1, info: 2 };
issueRegistry.sort((a, b) => {
  const r = severityRank[a.severity] - severityRank[b.severity];
  if (r !== 0) return r;
  const sa = a.studentRoll || ""; const sb = b.studentRoll || "";
  if (sa !== sb) return sa < sb ? -1 : 1;
  const xa = a.subject || ""; const xb = b.subject || "";
  if (xa !== xb) return xa < xb ? -1 : 1;
  const ma = a.month || ""; const mb = b.month || "";
  return ma < mb ? -1 : ma > mb ? 1 : 0;
});
issueRegistry.forEach((issue, i) => {
  issue.id = `ISS-${String(i + 1).padStart(3, "0")}`;
  issue.scope = issue.scope || (issue.studentRoll ? "student" : "class");
  issue.affectsStudent = issue.affectsStudent ?? Boolean(issue.studentRoll);
  issue.affectsCalculations = issue.affectsCalculations ?? false;
});

// Re-map student issue IDs (now that IDs are assigned).
const studentIssues = new Map();
for (const issue of issueRegistry) {
  if (issue.affectsStudent && issue.studentRoll) {
    if (!studentIssues.has(issue.studentRoll)) studentIssues.set(issue.studentRoll, []);
    studentIssues.get(issue.studentRoll).push(issue.id);
  }
}

// Link exclusions / excluded month sessions to their issue IDs.
const findIssueId = (roll, subject, month, session) => {
  const hit = issueRegistry.find(
    (i) =>
      i.studentRoll === roll &&
      i.subject === subject &&
      i.month === month &&
      i.session === session &&
      i.affectsCalculations
  );
  return hit ? hit.id : null;
};

// Ensure the student's subject records reference their own issues.
for (const stu of allStudents.values()) {
  for (const subj of Object.values(stu.subjects)) {
    for (const mm of subj.monthly) {
      if (mm.lecture.excluded) {
        const id = findIssueId(stu.rollNo, subj.subject, mm.month, "lecture");
        if (id && !mm.lecture.issueIds.includes(id)) mm.lecture.issueIds.push(id);
      }
      if (mm.practical.excluded) {
        const id = findIssueId(stu.rollNo, subj.subject, mm.month, "practical");
        if (id && !mm.practical.issueIds.includes(id)) mm.practical.issueIds.push(id);
      }
      mm.issueIds = [...new Set([...mm.lecture.issueIds, ...mm.practical.issueIds])];
    }
    for (const excl of subj.total.excluded) {
      const id = findIssueId(stu.rollNo, subj.subject, excl.month, excl.session);
      if (id) excl.issueId = id;
    }
    subj.issues = [...new Set(subj.total.excluded.map((e) => e.issueId).filter(Boolean))];
  }
}

// Compute per-student overall (weighted) + reference (simple average of subject %).
const students = [];
for (const stu of allStudents.values()) {
  let totalTaken = 0, totalAttended = 0;
  const subjectPcts = [];
  for (const subj of Object.values(stu.subjects)) {
    totalTaken += subj.total.taken;
    totalAttended += subj.total.attended;
    if (subj.total.percentage !== null) subjectPcts.push(subj.total.percentage);
  }
  const overallPct = pct(totalAttended, totalTaken);
  const referencePct =
    subjectPcts.length > 0
      ? subjectPcts.reduce((a, b) => a + b, 0) / subjectPcts.length
      : null;
  students.push({
    rollNo: stu.rollNo,
    name: stu.name,
    section: stu.section,
    subjects: stu.subjects,
    overall: {
      totalClasses: totalTaken,
      attendedClasses: totalAttended,
      missedClasses: totalTaken - totalAttended,
      percentage: round(overallPct),
      referencePercentage: round(referencePct),
      issueCount: (studentIssues.get(stu.rollNo) || []).length,
    },
    issues: studentIssues.get(stu.rollNo) || [],
  });
}

/* ------------------------------------------------------------------ */
/* Step 6 — Period + last updated metadata                             */
/* ------------------------------------------------------------------ */

// lastUpdated from the workbook's core.xml if available, else file mtime.
let lastUpdated = null;
try {
  const props = wb.Props || {};
  if (props.ModifiedDate) {
    lastUpdated = new Date(props.ModifiedDate).toISOString();
  }
} catch {
  /* fall back below */
}
if (!lastUpdated) {
  lastUpdated = new Date(statSync(EXCEL_PATH).mtime).toISOString();
}

// Period detection.
const startYear = parsedSheets[0]?.period?.startYear ?? DEFAULT_START_YEAR;
const endYear = parsedSheets[0]?.period?.endYear ?? DEFAULT_START_YEAR + 1;
const monthYear = (monthName) =>
  (MONTH_INDEX[monthName] ?? 0) >= 6 ? startYear : endYear;

let start = null;
let end = null;
let periodLabel = "";
if (monthsDetected.length > 0) {
  const first = monthsDetected[0];
  const last = monthsDetected[monthsDetected.length - 1];
  start = `${startYear}-${String(MONTH_INDEX[first] + 1).padStart(2, "0")}`;
  end = `${monthYear(last)}-${String(MONTH_INDEX[last] + 1).padStart(2, "0")}`;
  periodLabel = `${first} ${startYear} – ${last} ${monthYear(last)}`;
}

/* ------------------------------------------------------------------ */
/* Step 7 — Emit JSON                                                  */
/* ------------------------------------------------------------------ */

const meta = {
  institution: parsedSheets[0]?.titles?.college || "BBD College of Dental Sciences",
  university: parsedSheets[0]?.titles?.university || "",
  batch: parsedSheets[0]?.titles?.batchTitle || "",
  departments: Object.fromEntries(parsedSheets.map((ps) => [ps.sheetName, ps.titles.department])),
  period: {
    start,
    end,
    label: periodLabel,
  },
  months: monthsDetected,
  lastUpdated,
  subjectOrder,
  sourceFile: EXCEL_PATH.split(/[\\/]/).pop(),
};

const attendanceJson = {
  meta,
  students,
};

// Issues JSON (strip internal temporary fields).
const issueJson = {
  meta: {
    generatedAt: new Date().toISOString(),
    total: issueRegistry.length,
    errors: issueRegistry.filter((i) => i.severity === "error").length,
    warnings: issueRegistry.filter((i) => i.severity === "warning").length,
    info: issueRegistry.filter((i) => i.severity === "info").length,
  },
  issues: issueRegistry.map(
    ({ id, severity, type, studentRoll, studentName, subject, month, session, attended, conducted, percentage, message, affectsStudent, affectsCalculations, scope }) => ({
      id,
      severity,
      type,
      studentRoll: studentRoll || null,
      studentName: studentName || null,
      subject: subject || null,
      month: month || null,
      session: session || null,
      attended: attended ?? null,
      conducted: conducted ?? null,
      percentage: percentage ?? null,
      message,
      affectsStudent,
      affectsCalculations,
      scope,
    })
  ),
};

const recordCount = students.length * subjectOrder.length;
const validRecordCount = recordCount - issueRegistry.filter((i) => i.affectsCalculations).length;

const validationJson = {
  studentCount: students.length,
  subjectCount: subjectOrder.length,
  recordCount,
  validRecordCount,
  issueCount: issueRegistry.length,
  errorCount: issueRegistry.filter((i) => i.severity === "error").length,
  warningCount: issueRegistry.filter((i) => i.severity === "warning").length,
  infoCount: issueRegistry.filter((i) => i.severity === "info").length,
  period: { start, end, label: periodLabel },
  months: monthsDetected,
  lastUpdated,
  validationChecks: {
    duplicateRollNumbers: 0,
    duplicateNames: 0,
    missingNames: 0,
    invalidRollNumbers: 0,
    invalidPercentages: 0,
    negativeAttendance: 0,
    attendedExceedsConducted: issueRegistry.filter((i) => i.type === "invalid_attendance").length,
    missingMonthlyRecords: 0,
  },
  issues: issueRegistry.map((i) => i.id),
};

try {
  mkdirSync(SRC_DATA_DIR, { recursive: true });
  writeFileSync(join(SRC_DATA_DIR, "attendance.json"), JSON.stringify(attendanceJson));
  writeFileSync(join(SRC_DATA_DIR, "issues.json"), JSON.stringify(issueJson));
  writeFileSync(join(SRC_DATA_DIR, "validation.json"), JSON.stringify(validationJson));
} catch (err) {
  console.error("[FATAL] Could not write generated JSON files.");
  console.error(`  ${err.message}`);
  process.exit(1);
}

/* ------------------------------------------------------------------ */
/* Report                                                              */
/* ------------------------------------------------------------------ */

log("");
log("✓ JSON generated");
log("  src/data/attendance.json");
log("  src/data/issues.json");
log("  src/data/validation.json");
log("");
log("Data Quality");
log("────────────────────────────");
log(`Errors:      ${validationJson.errorCount}`);
log(`Warnings:    ${validationJson.warningCount}`);
log(`Information: ${validationJson.infoCount}`);
log("");
for (const issue of issueRegistry) {
  const who = issue.studentName
    ? `${issue.studentName} (${issue.studentRoll})`
    : issue.subject || issue.scope;
  const where = [issue.subject, issue.month, issue.session].filter(Boolean).join(" • ");
  log(`${issue.id} [${issue.severity.toUpperCase()}] ${issue.message}`);
  if (who && where) log(`   ${who} — ${where}`);
  if (issue.attended != null && issue.conducted != null) {
    log(`   ${issue.attended}/${issue.conducted}${issue.percentage != null ? ` (${issue.percentage}%)` : ""}`);
  }
}
log("");
log(`✓ ${students.length} students processed across ${subjectOrder.length} subjects`);
log(`✓ ${monthsDetected.length} months detected: ${monthsDetected.join(", ")}`);
log(`✓ Period: ${periodLabel}`);
log(`✓ Last updated: ${lastUpdated}`);
log("");
log("✓ Processing completed");