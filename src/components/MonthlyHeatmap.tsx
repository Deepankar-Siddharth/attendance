import { useState } from "react";
import { TriangleAlert } from "lucide-react";
import type { Student } from "../types";
import { useChartTheme } from "../utils/chartTheme";
import { issueById } from "../data";
import { shortSubject } from "../utils/formatters";

function cellColor(pct: number | null): string {
  if (pct === null) return "transparent";
  if (pct >= 75) return "var(--success)";
  if (pct >= 50) return "var(--warning)";
  return "var(--danger)";
}

export function MonthlyHeatmap({ student }: { student: Student }) {
  const chart = useChartTheme();
  const months = student ? Object.values(student.subjects)[0]?.monthly.map((m) => m.month) ?? [] : [];
  const subjectList = Object.values(student.subjects);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    subject: string;
    month: string;
    pct: number | null;
    excluded: boolean;
    issueText: string;
  } | null>(null);

  return (
    <div>
      <div className="overflow-x-auto pb-1">
        <table className="w-full min-w-[480px] border-separate border-spacing-1 text-center">
          <thead>
            <tr>
              <th className="w-32 pr-2 text-left text-xs font-medium text-inkfaint">
                Subject
              </th>
              {months.map((m) => (
                <th key={m} className="pb-1 text-xs font-medium text-ink-soft">
                  {m.slice(0, 3)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {subjectList.map((s) => (
              <tr key={s.subject}>
                <td className="pr-2 text-left text-xs font-medium text-ink-soft">
                  {shortSubject(s.subject)}
                </td>
                {s.monthly.map((m, idx) => {
                  const pct = m.percentage;
                  const bg = cellColor(pct);
                  return (
                    <td key={idx} className="p-0.5">
                      <button
                        type="button"
                        aria-label={`${shortSubject(s.subject)} ${m.month}: ${
                          pct === null ? "no classes" : `${pct.toFixed(0)}%`
                        }`}
                        onMouseEnter={(e) =>
                          setTooltip({
                            x: e.currentTarget.getBoundingClientRect().left + window.scrollX,
                            y: e.currentTarget.getBoundingClientRect().top + window.scrollY + 30,
                            subject: s.subject,
                            month: m.month,
                            pct,
                            excluded: m.excluded,
                            issueText: m.issueIds
                              .map((id) => issueById.get(id)?.message)
                              .filter(Boolean)
                              .join(" · "),
                          })
                        }
                        onMouseLeave={() => setTooltip(null)}
                        onFocus={(e) =>
                          setTooltip({
                            x: e.currentTarget.getBoundingClientRect().left + window.scrollX,
                            y: e.currentTarget.getBoundingClientRect().top + window.scrollY + 30,
                            subject: s.subject,
                            month: m.month,
                            pct,
                            excluded: m.excluded,
                            issueText: m.issueIds
                              .map((id) => issueById.get(id)?.message)
                              .filter(Boolean)
                              .join(" · "),
                          })
                        }
                        onBlur={() => setTooltip(null)}
                        className="relative h-9 w-full rounded-md border transition-transform hover:scale-105"
                        style={{
                          background: bg === "transparent" ? chart.isDark ? "#1e293b" : "#eef2f7" : bg,
                          opacity: m.excluded ? 0.55 : 1,
                        }}
                      >
                        {m.excluded && (
                          <TriangleAlert
                            size={12}
                            className="absolute right-0.5 top-0.5 text-warning"
                            aria-label="Excluded source-data issue"
                          />
                        )}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {tooltip && (
        <div
          className="chart-tooltip pointer-events-none fixed z-50"
          style={{ left: Math.min(tooltip.x, window.innerWidth - 240), top: tooltip.y }}
        >
          <p className="font-semibold">
            {shortSubject(tooltip.subject)} · {tooltip.month}
          </p>
          <p className="tabular-nums">
            {tooltip.pct === null ? "No classes recorded" : `${tooltip.pct.toFixed(1)}%`}
          </p>
          {tooltip.excluded && (
            <p className="mt-1 max-w-[220px] text-xs text-warning">
              ⚠ Source-data issue{tooltip.issueText ? ` — ${tooltip.issueText}` : ""}. Excluded from
              calculations.
            </p>
          )}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-inkfaint">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded" style={{ background: "var(--success)" }} /> ≥75%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded" style={{ background: "var(--warning)" }} /> 50–74%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded" style={{ background: "var(--danger)" }} /> &lt;50%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded border border-border" style={{ background: chart.isDark ? "#1e293b" : "#eef2f7" }} /> No classes
        </span>
      </div>
    </div>
  );
}