import { Check, Lock, Medal } from "lucide-react";
import type { Student } from "../types";
import { monthlyTrend } from "../utils/calculations";

const MILESTONES = [50, 60, 70, 75, 80];

export function Milestones({ student }: { student: Student }) {
  const pct = student.overall.percentage;
  const trend = monthlyTrend(student, null).filter((t) => t.pct !== null);
  const improvingStreak = countStreak(trend);

  return (
    <div className="card p-5">
      <h2 className="mb-4 flex items-center gap-2 font-bold text-ink">
        <Medal size={18} style={{ color: "var(--warning)" }} aria-hidden />
        Attendance Milestones
      </h2>
      <div className="flex flex-wrap items-center gap-2">
        {MILESTONES.map((m) => {
          const reached = pct !== null && pct >= m;
          return (
            <span
              key={m}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ${
                reached
                  ? "bg-success/10 text-success border border-success/30"
                  : "bg-bg text-inkfaint border border-border"
              }`}
            >
              {reached ? <Check size={14} aria-hidden /> : <Lock size={13} aria-hidden />}
              {m}%
            </span>
          );
        })}
      </div>
      {improvingStreak >= 2 && (
        <p className="mt-3 text-sm text-ink-soft">
          🔥 {improvingStreak} consecutive months improving
        </p>
      )}
    </div>
  );
}

function countStreak(points: Array<{ pct: number | null }>): number {
  if (points.length < 2) return 0;
  let streak = 0;
  for (let i = points.length - 1; i >= 1; i--) {
    const cur = points[i].pct;
    const prev = points[i - 1].pct;
    if (cur === null || prev === null) break;
    if (cur >= prev) streak++;
    else break;
  }
  return streak;
}