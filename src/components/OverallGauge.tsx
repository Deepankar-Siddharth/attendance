import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CircleAlert, ShieldCheck } from "lucide-react";
import { ATTENDANCE_TARGET } from "../utils/config";
import { attendanceStatus, statusMeta } from "../utils/attendanceStatus";
import { formatPct } from "../utils/formatters";

function useCountUp(target: number, duration = 1100) {
  const [value, setValue] = useState(0);
  const raf = useRef<number>(0);
  useEffect(() => {
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(target * eased);
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return value;
}

export function OverallGauge({
  pct,
  target = ATTENDANCE_TARGET,
  issueCount = 0,
  compact = false,
  issuesLink = "/issues",
}: {
  pct: number | null;
  target?: number;
  issueCount?: number;
  compact?: boolean;
  issuesLink?: string;
}) {
  const display = pct ?? 0;
  const animated = useCountUp(display);
  const level = attendanceStatus(pct);
  const meta = statusMeta(level);

  const R = 88;
  const CIRC = 2 * Math.PI * R;
  const animatedFilled = Math.min(100, animated) / 100;
  const gaugeColor = meta ? meta.dot : "var(--ink-faint)";

  const below = pct !== null && pct < target;
  const diff = pct === null ? 0 : Math.abs(pct - target);

  return (
    <div className="card-lg relative flex flex-col items-center overflow-hidden px-6 py-8">
      <div className="relative">
        <svg
          width={compact ? 190 : 230}
          height={compact ? 190 : 230}
          viewBox="0 0 220 220"
          role="img"
          aria-label={`Overall attendance ${formatPct(pct)}`}
        >
          <circle
            cx="110"
            cy="110"
            r={R}
            fill="none"
            stroke="var(--border)"
            strokeWidth="14"
          />
          <circle
            cx="110"
            cy="110"
            r={R}
            fill="none"
            stroke={gaugeColor}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={CIRC * (1 - animatedFilled)}
            transform="rotate(-90 110 110)"
            style={{ transition: "stroke-dashoffset 60ms linear" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span
            className="font-display font-extrabold tracking-tight"
            style={{
              fontSize: compact ? "2.4rem" : "3rem",
              color: "var(--ink)",
            }}
          >
            {formatPct(pct === null ? null : animated)}
          </span>
          <span className="mt-1 text-sm font-medium text-inkfaint">
            Overall Attendance
          </span>
        </div>
      </div>

      <div className="mt-5 flex flex-col items-center gap-2 text-center">
        {pct === null ? (
          <span className="text-sm text-inkfaint">No classes recorded yet.</span>
        ) : below ? (
          <span className="flex items-center gap-2 text-sm font-semibold text-warning">
            <CircleAlert size={16} aria-hidden />
            {diff.toFixed(1)} pts below your {target}% target
          </span>
        ) : (
          <span className="flex items-center gap-2 text-sm font-semibold text-success">
            <ShieldCheck size={16} aria-hidden />
            {diff.toFixed(1)} pts above your {target}% target
          </span>
        )}

        {meta && (
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${meta.chipClass}`}
          >
            <span className="h-2 w-2 rounded-full" style={{ background: meta.dot }} />
            {meta.label}
          </span>
        )}

        {issueCount > 0 ? (
          <Link
            to={issuesLink}
            className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-danger hover:underline"
          >
            <CircleAlert size={13} aria-hidden />
            {issueCount} data issue{issueCount > 1 ? "s" : ""} affect{issueCount > 1 ? "" : "s"} this report
          </Link>
        ) : (
          <span className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-success">
            <ShieldCheck size={13} aria-hidden /> No data issues
          </span>
        )}
      </div>
    </div>
  );
}