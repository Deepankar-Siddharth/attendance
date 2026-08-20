import { useMemo, useState } from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { TriangleAlert } from "lucide-react";
import type { Student } from "../types";
import { monthlyTrend } from "../utils/calculations";
import { useChartTheme } from "../utils/chartTheme";
import { issueById } from "../data";
import { shortSubject } from "../utils/formatters";

export function MonthlyTrendChart({ student }: { student: Student }) {
  const chart = useChartTheme();
  const subjects = student ? Object.keys(student.subjects) : [];
  const [selected, setSelected] = useState<string>("__overall__");

  const data = useMemo(() => {
    const trend = monthlyTrend(
      student,
      selected === "__overall__" ? null : selected
    );
    return trend.map((t) => ({
      month: t.month,
      pct: t.pct === null ? undefined : Number(t.pct.toFixed(1)),
      hasData: t.pct !== null,
      excluded: t.excluded,
      issueText: t.issueIds
        .map((id) => issueById.get(id)?.message)
        .filter(Boolean)
        .join(" · "),
    }));
  }, [student, selected]);

  const allZero = data.every((d) => !d.hasData);

  const customTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const point = payload[0].payload;
    return (
      <div className="chart-tooltip">
        <p className="font-semibold">{label}</p>
        {point.hasData ? (
          <p className="tabular-nums">{point.pct}%</p>
        ) : (
          <p className="text-inkfaint">No classes recorded</p>
        )}
        {point.excluded && (
          <p className="mt-1 max-w-[220px] text-xs text-warning">
            ⚠ Source-data issue{point.issueText ? ` — ${point.issueText}` : ""}. This value was
            excluded from the calculated trend.
          </p>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="mb-3">
        <label htmlFor="trend-subject" className="sr-only">
          Select subject for trend
        </label>
        <select
          id="trend-subject"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="input max-w-xs py-2 text-sm"
        >
          <option value="__overall__">Overall</option>
          {subjects.map((s) => (
            <option key={s} value={s}>
              {shortSubject(s)}
            </option>
          ))}
        </select>
      </div>

      <div className="h-64 w-full">
        {allZero ? (
          <div className="flex h-full items-center justify-center text-sm text-inkfaint">
            No classes recorded for this selection.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
              <XAxis
                dataKey="month"
                stroke={chart.axis}
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[0, 100]}
                stroke={chart.axis}
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `${v}%`}
              />
              <Tooltip content={customTooltip} cursor={{ stroke: chart.axis }} />
              <Line
                type="monotone"
                dataKey="pct"
                stroke={chart.primary}
                strokeWidth={3}
                dot={{ r: 4, fill: chart.primary, strokeWidth: 0 }}
                activeDot={{ r: 6 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-2 flex items-center gap-2 text-xs text-inkfaint">
        <TriangleAlert size={13} className="text-warning" aria-hidden />
        A point with ⚠ in its tooltip contains source-data that was excluded from calculations.
      </div>
    </div>
  );
}