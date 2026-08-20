import { useState } from "react";
import { ChevronDown, TriangleAlert } from "lucide-react";
import type { Student } from "../types";
import { subjectSummaries } from "../utils/calculations";
import { shortSubject } from "../utils/formatters";
import { issueById } from "../data";
import { formatPct } from "../utils/formatters";
import { StatusBadge } from "./ui";

export function SubjectDetailCards({ student }: { student: Student }) {
  const summaries = subjectSummaries(student);
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {summaries.map((s) => {
        const isOpen = open === s.subject;
        const rec = s.record;
        const affected = rec.issues.length > 0;
        return (
          <div key={s.subject} className="card overflow-hidden">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : s.subject)}
              aria-expanded={isOpen}
              className="flex w-full items-center gap-3 p-4 text-left"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate font-semibold text-ink">
                    {shortSubject(s.subject)}
                  </h3>
                  {affected && (
                    <TriangleAlert size={14} className="shrink-0 text-warning" aria-label="Data issue" />
                  )}
                </div>
                <p className="mt-0.5 text-xs text-inkfaint">
                  {rec.total.attended}/{rec.total.taken} classes
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-extrabold tabular-nums text-ink">
                  {formatPct(s.pct, 1)}
                </p>
                <StatusBadge pct={s.pct} />
              </div>
              <ChevronDown
                size={18}
                className={`text-inkfaint transition-transform ${isOpen ? "rotate-180" : ""}`}
                aria-hidden
              />
            </button>

            {isOpen && (
              <div className="animate-fade-in border-t border-border px-4 py-4">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-bg p-3">
                    <p className="text-xs font-medium text-inkfaint">Lectures</p>
                    <p className="mt-1 text-lg font-bold tabular-nums text-ink">
                      {rec.lecture.attended} / {rec.lecture.taken}
                    </p>
                    <p className="text-xs tabular-nums text-ink-soft">
                      {formatPct(rec.lecture.percentage)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-bg p-3">
                    <p className="text-xs font-medium text-inkfaint">Practicals</p>
                    <p className="mt-1 text-lg font-bold tabular-nums text-ink">
                      {rec.practical.attended} / {rec.practical.taken}
                    </p>
                    <p className="text-xs tabular-nums text-ink-soft">
                      {formatPct(rec.practical.percentage)}
                    </p>
                  </div>
                  <div className="col-span-2 rounded-xl bg-bg p-3 sm:col-span-1">
                    <p className="text-xs font-medium text-inkfaint">Total</p>
                    <p className="mt-1 text-lg font-bold tabular-nums text-ink">
                      {rec.total.attended} / {rec.total.taken}
                    </p>
                    <p className="text-xs tabular-nums text-ink-soft">
                      {formatPct(rec.total.percentage)}
                    </p>
                  </div>
                </div>

                {affected && (
                  <div className="mt-3 space-y-2 rounded-xl bg-warning/10 p-3 text-xs text-warning">
                    <p className="font-semibold">⚠ Source-data issue</p>
                    {rec.issues.map((id) => {
                      const issue = issueById.get(id);
                      if (!issue) return null;
                      return (
                        <p key={id} className="leading-relaxed">
                          {issue.month} {issue.session === "lecture" ? "Lecture" : "Practical"}: Excel
                          shows {issue.attended}/{issue.conducted}. {issue.message}
                        </p>
                      );
                    })}
                  </div>
                )}

                {rec.total.excluded.length > 0 && (
                  <div className="mt-3 rounded-xl bg-bg p-3 text-xs text-ink-soft">
                    <p className="font-medium text-ink">
                      Calculated from {rec.total.validMonths} valid month
                      {rec.total.validMonths === 1 ? "" : "s"}.
                    </p>
                    <p className="mt-1">
                      Excluded:
                      {rec.total.excluded.map((e, i) => (
                        <span key={i}>
                          {" "}
                          {e.month} {e.session === "lecture" ? "Lecture" : "Practical"} — invalid
                          source record
                          {i < rec.total.excluded.length - 1 ? "," : ""}
                        </span>
                      ))}
                    </p>
                  </div>
                )}

                {!affected && rec.total.excluded.length === 0 && (
                  <p className="mt-3 text-xs text-inkfaint">
                    Calculated from {rec.total.validMonths} valid month
                    {rec.total.validMonths === 1 ? "" : "s"}. No exclusions.
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}