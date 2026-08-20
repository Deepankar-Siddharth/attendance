import { CheckCircle2, Target } from "lucide-react";
import type { SubjectSummary } from "../utils/calculations";
import { targetGap } from "../utils/calculations";
import { ATTENDANCE_TARGET } from "../utils/config";
import { formatPct, shortSubject } from "../utils/formatters";
import { issueById } from "../data";

export function TargetCard({ summary }: { summary: SubjectSummary }) {
  const { record, pct } = summary;
  const gap = targetGap(pct, record.total.attended, record.total.taken);
  const width = pct === null ? 0 : Math.min(100, pct);
  const affected = record.issues.length > 0;

  return (
    <div className="card flex flex-col gap-3 p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-ink">{shortSubject(summary.subject)}</h3>
          <p className="text-xs text-inkfaint">
            {record.total.attended}/{record.total.taken} classes
          </p>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
          <Target size={13} aria-hidden /> {ATTENDANCE_TARGET}%
        </span>
      </div>

      <div>
        <p className="text-3xl font-extrabold tabular-nums text-ink">
          {formatPct(pct, 1)}
        </p>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-bg-soft">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${width}%`,
              background: gap.alreadyMet ? "var(--success)" : "var(--warning)",
            }}
          />
        </div>
      </div>

      {gap.alreadyMet ? (
        <p className="flex items-center gap-1.5 text-sm font-semibold text-success">
          <CheckCircle2 size={15} aria-hidden /> Target reached —{" "}
          {gap.gap.toFixed(1)} pts above {ATTENDANCE_TARGET}%
        </p>
      ) : pct === null ? (
        <p className="text-sm text-inkfaint">No classes recorded yet.</p>
      ) : (
        <div className="text-sm">
          <p className="font-medium text-warning">
            ⚠ {gap.gap.toFixed(1)} percentage points below target
          </p>
          {gap.impossible ? (
            <p className="mt-1 text-inkfaint">
              Reaching {ATTENDANCE_TARGET}% cannot be computed for this subject.
            </p>
          ) : (
            <p className="mt-1 text-ink">
              Attend the next{" "}
              <span className="font-bold text-ink">{gap.classesToReach}</span>{" "}
              consecutive classes to reach {ATTENDANCE_TARGET}%.
            </p>
          )}
        </div>
      )}

      <p className="text-[11px] leading-relaxed text-inkfaint">
        Assumes future classes continue to be conducted and you attend all of them.
      </p>

      {affected && (
        <div className="rounded-lg bg-warning/10 p-2 text-xs text-warning">
          ⚠ Affected by source-data issue:{" "}
          {record.issues
            .map((id) => issueById.get(id)?.message)
            .filter(Boolean)
            .join(" ")}
        </div>
      )}
    </div>
  );
}