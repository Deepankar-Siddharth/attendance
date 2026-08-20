import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Student } from "../types";
import { useChartTheme } from "../utils/chartTheme";
import { shortSubject } from "../utils/formatters";

export function LecturePracticalChart({ student }: { student: Student }) {
  const chart = useChartTheme();

  const data = Object.values(student.subjects).map((s) => {
    const lp = s.lecture.percentage;
    const pp = s.practical.percentage;
    return {
      subject: shortSubject(s.subject),
      Lecture: lp === null ? 0 : Number(lp.toFixed(1)),
      Practical: pp === null ? 0 : Number(pp.toFixed(1)),
      lectureText: s.lecture.percentage === null ? "No classes" : `${s.lecture.attended}/${s.lecture.taken}`,
      practicalText: s.practical.percentage === null ? "No classes" : `${s.practical.attended}/${s.practical.taken}`,
    };
  });

  const customTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const entry = payload[0].payload;
    return (
      <div className="chart-tooltip">
        <p className="font-semibold">{label}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} className="flex items-center gap-2">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: p.fill }}
              aria-hidden
            />
            <span className="font-medium">{p.name}:</span>
            <span className="tabular-nums">
              {p.name === "Lecture" ? entry.lectureText : entry.practicalText}
              {p.value === 0 && p.name === "Lecture" && entry.lectureText === "No classes"
                ? " · No classes"
                : p.value === 0 && p.name === "Practical" && entry.practicalText === "No classes"
                ? " · No classes"
                : ""}
            </span>
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: -20 }} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} vertical={false} />
          <XAxis
            dataKey="subject"
            stroke={chart.axis}
            fontSize={11}
            tickLine={false}
            axisLine={false}
            interval={0}
          />
          <YAxis
            domain={[0, 100]}
            stroke={chart.axis}
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `${v}%`}
          />
          <Tooltip content={customTooltip} cursor={{ fill: "var(--bg-soft)" }} />
          <Legend />
          <Bar dataKey="Lecture" fill={chart.primary} radius={[4, 4, 0, 0]} maxBarSize={22} />
          <Bar dataKey="Practical" fill={chart.info} radius={[4, 4, 0, 0]} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}