import { TrendingDown, TrendingUp, CalendarX, Gauge } from "lucide-react";
import type { Student } from "../types";
import { bestSubject, weakestSubject } from "../utils/calculations";
import { formatPct, shortSubject } from "../utils/formatters";
import { attendanceStatus, statusMeta } from "../utils/attendanceStatus";

export function SummaryCards({ student }: { student: Student }) {
  const best = bestSubject(student);
  const weakest = weakestSubject(student);
  const level = attendanceStatus(student.overall.percentage);
  const meta = statusMeta(level);

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <div className="card p-4">
        <p className="flex items-center gap-1.5 text-xs font-medium text-inkfaint">
          <Gauge size={13} aria-hidden /> Overall Status
        </p>
        <p
          className="mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold"
          style={
            meta
              ? { color: meta.dot, background: `${meta.dot}1a` }
              : { color: "var(--inkfaint)" }
          }
        >
          {meta?.label ?? "No data"}
        </p>
        <p className="mt-2 text-2xl font-extrabold tabular-nums text-ink">
          {formatPct(student.overall.percentage)}
        </p>
      </div>

      <div className="card p-4">
        <p className="flex items-center gap-1.5 text-xs font-medium text-inkfaint">
          <TrendingUp size={13} style={{ color: "var(--success)" }} aria-hidden /> Best Subject
        </p>
        <p className="mt-2 truncate font-semibold text-ink">
          {best ? shortSubject(best.subject) : "—"}
        </p>
        <p className="text-2xl font-extrabold tabular-nums text-success">
          {best ? formatPct(best.pct) : "—"}
        </p>
      </div>

      <div className="card p-4">
        <p className="flex items-center gap-1.5 text-xs font-medium text-inkfaint">
          <TrendingDown size={13} style={{ color: "var(--danger)" }} aria-hidden /> Weakest Subject
        </p>
        <p className="mt-2 truncate font-semibold text-ink">
          {weakest ? shortSubject(weakest.subject) : "—"}
        </p>
        <p className="text-2xl font-extrabold tabular-nums text-danger">
          {weakest ? formatPct(weakest.pct) : "—"}
        </p>
      </div>

      <div className="card p-4">
        <p className="flex items-center gap-1.5 text-xs font-medium text-inkfaint">
          <CalendarX size={13} style={{ color: "var(--warning)" }} aria-hidden /> Classes Missed
        </p>
        <p className="mt-2 text-2xl font-extrabold tabular-nums text-ink">
          {student.overall.missedClasses}
        </p>
        <p className="text-xs text-inkfaint">of {student.overall.totalClasses} conducted</p>
      </div>
    </div>
  );
}