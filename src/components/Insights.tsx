import {
  AlertTriangle,
  Lightbulb,
  Target,
  TrendingDown,
  TrendingUp,
  CalendarX,
  Sparkles,
} from "lucide-react";
import type { Student } from "../types";
import { generateInsights } from "../utils/calculations";

const ICONS = {
  strength: { Icon: Sparkles, color: "var(--success)" },
  weakness: { Icon: AlertTriangle, color: "var(--danger)" },
  trend: { Icon: TrendingUp, color: "var(--info)" },
  missed: { Icon: CalendarX, color: "var(--warning)" },
  target: { Icon: Target, color: "var(--primary)" },
  attention: { Icon: TrendingDown, color: "var(--warning)" },
};

export function Insights({ student }: { student: Student }) {
  const insights = generateInsights(student);
  if (insights.length === 0) return null;
  return (
    <div className="card p-5">
      <h2 className="mb-4 flex items-center gap-2 font-bold text-ink">
        <Lightbulb size={18} style={{ color: "var(--warning)" }} aria-hidden />
        Your Attendance Insights
      </h2>
      <ul className="space-y-2.5">
        {insights.map((insight, i) => {
          const meta = ICONS[insight.icon];
          const Icon = meta.Icon;
          return (
            <li key={i} className="flex items-start gap-3 text-sm text-ink-soft">
              <span
                className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                style={{ background: "var(--bg-soft)" }}
              >
                <Icon size={14} style={{ color: meta.color }} aria-hidden />
              </span>
              {insight.text}
            </li>
          );
        })}
      </ul>
    </div>
  );
}