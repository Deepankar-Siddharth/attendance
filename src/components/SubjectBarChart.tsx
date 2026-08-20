import { useState } from "react";
import { TriangleAlert } from "lucide-react";
import type { Student } from "../types";
import { subjectSummaries } from "../utils/calculations";
import { ATTENDANCE_TARGET } from "../utils/config";
import { shortSubject } from "../utils/formatters";
import { issueById } from "../data";

export function SubjectBarChart({
  student,
  order,
}: {
  student: Student;
  order: string[];
}) {
  const summaries = subjectSummaries(student).filter((s) => s.pct !== null);
  const ordered = order
    .map((name) => summaries.find((s) => s.subject === name))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));
  const maxPct = Math.max(ATTENDANCE_TARGET, ...ordered.map((s) => s.pct ?? 0));
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="space-y-2.5">
      {ordered.map((s) => {
        const pct = s.pct!;
        const width = Math.max(2, (pct / maxPct) * 100);
        const affected = s.record.issues.length > 0;
        const open = selected === s.subject;
        return (
          <div key={s.subject} className="group relative">
            <button
              type="button"
              onClick={() => setSelected(open ? null : s.subject)}
              aria-expanded={open}
              className="flex min-h-11 w-full items-center gap-3 py-1.5 text-left"
              title={`${shortSubject(s.subject)}: ${pct.toFixed(1)}% — tap for details`}
            >
              <span className="w-28 shrink-0 truncate text-sm font-medium text-ink-soft sm:w-36">
                {shortSubject(s.subject)}
                {affected && (
                  <TriangleAlert
                    size={14}
                    className="ml-1 inline text-warning"
                    aria-label="Data issue"
                  />
                )}
              </span>
              <span className="relative h-6 flex-1 overflow-hidden rounded-md bg-bg-soft">
                <span
                  className="absolute inset-y-0 left-0 rounded-md transition-all duration-700 ease-out"
                  style={{
                    width: `${width}%`,
                    background:
                      pct >= ATTENDANCE_TARGET
                        ? "var(--success)"
                        : pct >= 65
                        ? "var(--warning)"
                        : "var(--danger)",
                  }}
                />
                <span
                  className="absolute inset-y-0 rounded-r"
                  style={{
                    left: `${(ATTENDANCE_TARGET / maxPct) * 100}%`,
                    width: 2,
                    background: "var(--ink)",
                    opacity: 0.55,
                  }}
                  aria-hidden
                />
              </span>
              <span className="w-14 shrink-0 text-right text-sm font-bold tabular-nums text-ink">
                {pct.toFixed(1)}
              </span>
            </button>

            {open && (
              <div className="animate-fade-in mt-2 rounded-xl border border-border bg-bg p-3 text-sm">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xs text-inkfaint">Attended</p>
                    <p className="font-bold text-ink">{s.record.total.attended}</p>
                  </div>
                  <div>
                    <p className="text-xs text-inkfaint">Conducted</p>
                    <p className="font-bold text-ink">{s.record.total.taken}</p>
                  </div>
                  <div>
                    <p className="text-xs text-inkfaint">Missed</p>
                    <p className="font-bold text-danger">{s.record.total.missed}</p>
                  </div>
                </div>
                {affected && (
                  <div className="mt-2 rounded-lg bg-warning/10 p-2 text-xs text-warning">
                    ⚠ Source-data issue:{" "}
                    {s.record.issues
                      .map((id) => issueById.get(id)?.message)
                      .filter(Boolean)
                      .join(" ")}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}