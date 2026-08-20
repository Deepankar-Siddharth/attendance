import { ATTENDANCE_TARGET } from "./config";
import { Student, SubjectRecord } from "../types";

export interface TargetGap {
  pct: number | null;
  gap: number; // target - pct (positive means below target)
  below: boolean;
  classesToReach: number | null; // consecutive attended classes to hit target
  alreadyMet: boolean;
  impossible: boolean;
}

/**
 * Number of consecutive attended classes required to reach the target,
 * assuming each future class is also a conducted class:
 *   (attended + n) / (conducted + n) >= target/100
 *   => n >= (target*conducted - 100*attended) / (100 - target)
 */
export function classesToReachTarget(
  attended: number,
  conducted: number,
  target = ATTENDANCE_TARGET
): number | null {
  if (conducted <= 0) return null;
  const current = attended / conducted;
  if (current >= target / 100) return 0;
  const numerator = target * conducted - 100 * attended;
  const denominator = 100 - target;
  if (denominator <= 0) return null; // target >= 100 → unreachable
  const n = Math.ceil(numerator / denominator);
  return Math.max(0, n);
}

export function targetGap(
  pct: number | null,
  attended: number,
  conducted: number
): TargetGap {
  const alreadyMet = pct !== null && pct >= ATTENDANCE_TARGET;
  const classes = alreadyMet ? 0 : classesToReachTarget(attended, conducted);
  const below = pct !== null && pct < ATTENDANCE_TARGET;
  const gap = pct === null ? 0 : ATTENDANCE_TARGET - pct;
  return {
    pct,
    gap,
    below,
    classesToReach: classes,
    alreadyMet,
    impossible: classes === null,
  };
}

export interface SubjectSummary {
  subject: string;
  record: SubjectRecord;
  pct: number | null;
  status: "met" | "below";
}

export function subjectSummaries(student: Student): SubjectSummary[] {
  return Object.values(student.subjects).map((record) => ({
    subject: record.subject,
    record,
    pct: record.total.percentage,
    status:
      record.total.percentage !== null && record.total.percentage >= ATTENDANCE_TARGET
        ? "met"
        : "below",
  }));
}

export function bestSubject(student: Student): SubjectSummary | null {
  const list = subjectSummaries(student).filter((s) => s.pct !== null);
  if (list.length === 0) return null;
  return list.reduce((a, b) => (a.pct! > b.pct! ? a : b));
}

export function weakestSubject(student: Student): SubjectSummary | null {
  const list = subjectSummaries(student).filter((s) => s.pct !== null);
  if (list.length === 0) return null;
  return list.reduce((a, b) => (a.pct! < b.pct! ? a : b));
}

export function subjectsBelowTarget(student: Student): SubjectSummary[] {
  return subjectSummaries(student)
    .filter((s) => s.status === "below" && s.pct !== null)
    .sort((a, b) => a.pct! - b.pct!);
}

export interface TrendPoint {
  month: string;
  pct: number | null;
  excluded: boolean;
  issueIds: string[];
}

/** Monthly combined attendance for a student (overall or a single subject). */
export function monthlyTrend(student: Student, subject: string | null): TrendPoint[] {
  if (subject) {
    const rec = student.subjects[subject];
    if (!rec) return [];
    return rec.monthly.map((m) => ({
      month: m.month,
      pct: m.percentage,
      excluded: m.excluded,
      issueIds: m.issueIds,
    }));
  }
  // Overall: sum all subjects per month index.
  const months = Object.values(student.subjects)[0]?.monthly.map((m) => m.month) ?? [];
  const subjectList = Object.values(student.subjects);
  return months.map((month, idx) => {
    let taken = 0;
    let attended = 0;
    const issueIds: string[] = [];
    let excluded = false;
    for (const subj of subjectList) {
      const m = subj.monthly[idx];
      if (!m) continue;
      const vLt = m.lecture.excluded ? 0 : m.lecture.taken;
      const vLa = m.lecture.excluded ? 0 : m.lecture.attended;
      const vPt = m.practical.excluded ? 0 : m.practical.taken;
      const vPa = m.practical.excluded ? 0 : m.practical.attended;
      taken += vLt + vPt;
      attended += vLa + vPa;
      if (m.excluded) {
        excluded = true;
        issueIds.push(...m.issueIds);
      }
    }
    return {
      month,
      pct: taken > 0 ? (attended / taken) * 100 : null,
      excluded,
      issueIds: [...new Set(issueIds)],
    };
  });
}

export interface Insight {
  icon: "strength" | "weakness" | "trend" | "missed" | "target" | "attention";
  text: string;
}

export function generateInsights(student: Student): Insight[] {
  const insights: Insight[] = [];
  const best = bestSubject(student);
  const weakest = weakestSubject(student);
  const below = subjectsBelowTarget(student);

  if (best && best.pct !== null) {
    insights.push({
      icon: "strength",
      text: `${best.subject} is your strongest subject at ${best.pct.toFixed(1)}%.`,
    });
  }
  if (weakest && weakest.pct !== null) {
    insights.push({
      icon: "weakness",
      text: `${weakest.subject} is currently your weakest subject at ${weakest.pct.toFixed(1)}%.`,
    });
  }

  const trend = monthlyTrend(student, null);
  const valid = trend.filter((t) => t.pct !== null);
  if (valid.length >= 2) {
    const first = valid[0];
    const last = valid[valid.length - 1];
    const delta = last.pct! - first.pct!;
    if (delta >= 5) {
      insights.push({
        icon: "trend",
        text: `Your attendance improved by ${delta.toFixed(1)} points between ${first.month} and ${last.month}.`,
      });
    } else if (delta <= -5) {
      insights.push({
        icon: "trend",
        text: `Your attendance declined by ${Math.abs(delta).toFixed(1)} points between ${first.month} and ${last.month}.`,
      });
    } else {
      insights.push({
        icon: "trend",
        text: `Your overall attendance has been fairly steady (${first.month}: ${first.pct!.toFixed(0)}% → ${last.month}: ${last.pct!.toFixed(0)}%).`,
      });
    }
  }

  if (student.overall.missedClasses > 0) {
    insights.push({
      icon: "missed",
      text: `You have missed ${student.overall.missedClasses} classes overall.`,
    });
  }

  const o = student.overall.percentage;
  if (o !== null) {
    if (o < ATTENDANCE_TARGET) {
      insights.push({
        icon: "target",
        text: `You are ${(ATTENDANCE_TARGET - o).toFixed(1)} percentage points below the ${ATTENDANCE_TARGET}% target.`,
      });
    } else {
      insights.push({
        icon: "target",
        text: `You are above the ${ATTENDANCE_TARGET}% target — keep it up!`,
      });
    }
  }

  if (below.length > 0) {
    insights.push({
      icon: "attention",
      text: `${below.length} subject${below.length > 1 ? "s" : ""} currently ${below.length > 1 ? "require" : "requires"} attention (below ${ATTENDANCE_TARGET}%).`,
    });
  }

  return insights;
}