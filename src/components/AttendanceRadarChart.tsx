import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { Student } from "../types";
import { useChartTheme } from "../utils/chartTheme";
import { shortSubject } from "../utils/formatters";

export function AttendanceRadarChart({ student }: { student: Student }) {
  const chart = useChartTheme();

  const data = Object.values(student.subjects).map((s) => ({
    subject: shortSubject(s.subject),
    pct: s.total.percentage === null ? 0 : Number(s.total.percentage.toFixed(1)),
    attended: s.total.attended,
    taken: s.total.taken,
    hasData: s.total.percentage !== null,
  }));

  const customTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const entry = payload[0].payload;
    return (
      <div className="chart-tooltip">
        <p className="font-semibold">{entry.subject}</p>
        {entry.hasData ? (
          <p className="tabular-nums">
            {entry.pct}% · {entry.attended}/{entry.taken} classes
          </p>
        ) : (
          <p className="text-inkfaint">No classes recorded</p>
        )}
      </div>
    );
  };

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="72%">
          <PolarGrid stroke={chart.grid} />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: chart.axis, fontSize: 11 }}
          />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            dataKey="pct"
            stroke={chart.primary}
            fill={chart.primary}
            fillOpacity={0.28}
            strokeWidth={2}
          />
          <Tooltip content={customTooltip} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}