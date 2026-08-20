import { Link } from "react-router-dom";
import { CircleAlert, ShieldCheck } from "lucide-react";
import type { Student } from "../types";
import { issuesForStudent } from "../data";

export function IssueBanner({ student }: { student: Student }) {
  const issues = issuesForStudent(student).filter((i) => i.affectsCalculations);
  if (issues.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm font-medium text-success">
        <ShieldCheck size={16} aria-hidden /> No data issues affecting this report.
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-warning/30 bg-warning/10 p-4">
      <p className="flex items-center gap-2 text-sm font-bold text-warning">
        <CircleAlert size={16} aria-hidden />
        {issues.length} data issue{issues.length > 1 ? "s" : ""} affect{issues.length > 1 ? "" : "s"} this
        report
      </p>
      <div className="mt-2 space-y-1.5">
        {issues.map((issue) => (
          <p key={issue.id} className="text-xs leading-relaxed text-ink-soft">
            {issue.month} • {issue.subject} •{" "}
            {issue.session === "lecture" ? "Lecture" : "Practical"} — Excel contains{" "}
            <span className="font-semibold">
              {issue.attended} attended / {issue.conducted} conducted
            </span>
            . {issue.message} This record is excluded from your calculated attendance.
          </p>
        ))}
      </div>
      <Link
        to={`/issues?student=${encodeURIComponent(student.rollNo)}`}
        className="mt-2 inline-block text-xs font-semibold text-primary hover:underline"
      >
        View issue details →
      </Link>
    </div>
  );
}