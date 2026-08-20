import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, ShieldCheck, X } from "lucide-react";
import { attendanceData, issuesData, validationData } from "../data";
import type { Issue } from "../types";
import { IssueIcon, IssueSeverityChip, EmptyState } from "../components/ui";
import { formatDate, formatDateTime, shortSubject } from "../utils/formatters";

type Category = "all" | "student" | "subject" | "class" | "calculation";
type Severity = "all" | Issue["severity"];

const CATEGORY_LABELS: Record<Category, string> = {
  all: "All Issues",
  student: "Student Issues",
  subject: "Subject Issues",
  class: "Class Issues",
  calculation: "Calculation Issues",
};

function matchesCategory(issue: Issue, category: Category): boolean {
  switch (category) {
    case "student":
      return issue.scope === "student" || Boolean(issue.studentRoll);
    case "subject":
      return ["identical_sheets", "conducted_variance", "consolidated_difference", "missing_subject_sheet"].includes(
        issue.type
      );
    case "class":
      return issue.scope === "class";
    case "calculation":
      return issue.affectsCalculations === true;
    default:
      return true;
  }
}

export function IssuesPage() {
  const [params] = useSearchParams();
  const presetStudent = params.get("student") || "";
  const [category, setCategory] = useState<Category>("all");
  const [severity, setSeverity] = useState<Severity>("all");
  const [query, setQuery] = useState("");

  const studentParam = presetStudent || "";

  const filtered = useMemo(() => {
    let list = issuesData.issues;
    if (studentParam) {
      const student = attendanceData.students.find((s) => s.rollNo === studentParam);
      if (student) {
        list = list.filter((i) => i.studentRoll === student.rollNo);
      }
    }
    list = list.filter(
      (i) => matchesCategory(i, category) && (severity === "all" || i.severity === severity)
    );
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((i) =>
        [
          i.studentName,
          i.studentRoll,
          i.subject,
          i.month,
          i.session,
          i.message,
          i.id,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }
    return list;
  }, [studentParam, category, severity, query]);

  const selectedStudentName = studentParam
    ? attendanceData.students.find((s) => s.rollNo === studentParam)?.name
    : null;

  return (
    <div className="animate-fade-in space-y-8">
      <header>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">
          Data Quality
        </h1>
        <p className="mt-1 text-sm text-inkfaint">
          Every anomaly detected in the Excel source is preserved and listed here —
          never silently corrected.
        </p>
      </header>

      {/* Summary */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="card p-4">
          <p className="text-xs font-medium text-inkfaint">Students</p>
          <p className="mt-1 text-2xl font-extrabold tabular-nums text-ink">
            {validationData.studentCount}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-medium text-inkfaint">Subjects</p>
          <p className="mt-1 text-2xl font-extrabold tabular-nums text-ink">
            {validationData.subjectCount}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-medium text-inkfaint">Records</p>
          <p className="mt-1 text-2xl font-extrabold tabular-nums text-ink">
            {validationData.recordCount}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-medium text-inkfaint">Valid records</p>
          <p className="mt-1 text-2xl font-extrabold tabular-nums text-success">
            {validationData.validRecordCount}
          </p>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="card flex items-center justify-between p-4">
          <span className="text-sm font-medium text-ink">Errors</span>
          <span className="rounded-full bg-danger/10 px-3 py-1 text-lg font-extrabold tabular-nums text-danger">
            {validationData.errorCount}
          </span>
        </div>
        <div className="card flex items-center justify-between p-4">
          <span className="text-sm font-medium text-ink">Warnings</span>
          <span className="rounded-full bg-warning/10 px-3 py-1 text-lg font-extrabold tabular-nums text-warning">
            {validationData.warningCount}
          </span>
        </div>
        <div className="card flex items-center justify-between p-4">
          <span className="text-sm font-medium text-ink">Information</span>
          <span className="rounded-full bg-info/10 px-3 py-1 text-lg font-extrabold tabular-nums text-info">
            {validationData.infoCount}
          </span>
        </div>
      </section>

      <section className="grid gap-3 text-sm sm:grid-cols-2">
        <div className="card p-4">
          <p className="text-xs font-medium text-inkfaint">Last Excel Update</p>
          <p className="mt-1 font-semibold text-ink">
            {formatDate(attendanceData.meta.lastUpdated)}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-medium text-inkfaint">Last Processed</p>
          <p className="mt-1 font-semibold text-ink">
            {formatDateTime(issuesData.meta.generatedAt)}
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(CATEGORY_LABELS) as Category[]).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`inline-flex min-h-10 items-center rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                category === c
                  ? "bg-primary text-white"
                  : "border border-border bg-card text-ink-soft hover:text-ink"
              }`}
            >
              {CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(["error", "warning", "info"] as Severity[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSeverity(severity === s ? "all" : s)}
              className={`inline-flex min-h-10 items-center rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition-colors ${
                severity === s
                  ? "bg-ink text-bg"
                  : "border border-border bg-card text-ink-soft hover:text-ink"
              }`}
            >
              {s}
            </button>
          ))}
          <div className="relative ml-auto w-full sm:w-64">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-inkfaint"
              aria-hidden
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, roll, subject, message…"
              className="input py-2 pl-9 pr-8 text-sm"
              aria-label="Search issues"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-inkfaint hover:text-ink"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {selectedStudentName && (
          <div className="flex items-center justify-between rounded-xl bg-primary/10 px-4 py-2 text-sm">
            <span className="font-medium text-primary">
              Showing issues for {selectedStudentName} ({studentParam})
            </span>
            <a href="#/issues" className="text-xs font-semibold text-primary hover:underline">
              Clear
            </a>
          </div>
        )}

        <p className="text-xs text-inkfaint">
          {filtered.length} of {issuesData.issues.length} issues shown
        </p>
      </section>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck size={40} className="text-success" />}
          title="No data issues found"
          subtitle="Nothing matches the current filters. Adjust the filters or search terms to see more."
        />
      ) : (
        <section className="space-y-3">
          {filtered.map((issue) => (
            <IssueCard key={issue.id} issue={issue} />
          ))}
        </section>
      )}
    </div>
  );
}

function IssueCard({ issue }: { issue: Issue }) {
  const subject = issue.subject ? shortSubject(issue.subject) : null;
  return (
    <article className="card animate-fade-up p-5">
      <div className="flex flex-wrap items-center gap-2">
        <IssueIcon severity={issue.severity} />
        <h3 className="font-bold text-ink">{issueTypeLabel(issue.type)}</h3>
        <IssueSeverityChip severity={issue.severity} />
        <span className="ml-auto font-mono text-xs text-inkfaint">{issue.id}</span>
      </div>

      {issue.studentName && (
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
          <p className="font-semibold text-ink">{issue.studentName}</p>
          <p className="font-mono text-sm text-inkfaint">{issue.studentRoll}</p>
        </div>
      )}

      {(subject || issue.month || issue.session) && (
        <p className="mt-1 text-sm text-ink-soft">
          {[subject, issue.month, issue.session ? cap(issue.session) : null]
            .filter(Boolean)
            .join(" · ")}
        </p>
      )}

      {(issue.attended !== null || issue.conducted !== null) && (
        <div className="mt-3 grid max-w-md grid-cols-3 gap-2">
          <div className="rounded-lg bg-bg p-2.5 text-center">
            <p className="text-[11px] text-inkfaint">Attended</p>
            <p className="text-lg font-extrabold tabular-nums text-ink">{issue.attended}</p>
          </div>
          <div className="rounded-lg bg-bg p-2.5 text-center">
            <p className="text-[11px] text-inkfaint">Conducted</p>
            <p className="text-lg font-extrabold tabular-nums text-ink">{issue.conducted}</p>
          </div>
          <div className="rounded-lg bg-bg p-2.5 text-center">
            <p className="text-[11px] text-inkfaint">Calculated</p>
            <p className="text-lg font-extrabold tabular-nums text-danger">
              {issue.percentage !== null ? `${issue.percentage.toFixed(0)}%` : "—"}
            </p>
          </div>
        </div>
      )}

      <p className="mt-3 text-sm leading-relaxed text-ink-soft">
        ⚠ {issue.message}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-inkfaint">
        {issue.affectsCalculations
          ? "This record is preserved from the Excel source and excluded from calculations where necessary."
          : "This issue does not alter any student's calculated attendance."}
      </p>
    </article>
  );
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function issueTypeLabel(type: string): string {
  return type
    .split("_")
    .map((w) => (w === "conducted" ? "Conducted count" : cap(w)))
    .join(" ");
}