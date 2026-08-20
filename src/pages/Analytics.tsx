import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { GraduationCap, ShieldCheck, TrendingDown, TrendingUp } from "lucide-react";
import { attendanceData } from "../data";
import { useChartTheme } from "../utils/chartTheme";
import { shortSubject, formatPct } from "../utils/formatters";
import { ATTENDANCE_TARGET } from "../utils/config";
import { attendanceStatus } from "../utils/attendanceStatus";
import { formatDate } from "../utils/formatters";

interface HistBin {
  label: string;
  count: number;
}

export function AnalyticsPage() {
  const chart = useChartTheme();
  const meta = attendanceData.meta;

  const stats = useMemo(() => {
    const students = attendanceData.students;
    let totalConducted = 0;
    let totalAttended = 0;
    const statusCounts = { excellent: 0, safe: 0, warning: 0, low: 0, critical: 0, none: 0 };
    for (const s of students) {
      totalConducted += s.overall.totalClasses;
      totalAttended += s.overall.attendedClasses;
      const level = attendanceStatus(s.overall.percentage);
      statusCounts[level] += 1;
    }
    const above = students.filter(
      (s) => s.overall.percentage !== null && s.overall.percentage >= ATTENDANCE_TARGET
    ).length;
    const below = students.length - above;
    return {
      avg: totalConducted > 0 ? (totalAttended / totalConducted) * 100 : null,
      above,
      below,
      statusCounts,
    };
  }, []);

  const subjectAvg = useMemo(
    () =>
      meta.subjectOrder.map((name) => {
        let taken = 0;
        let attended = 0;
        for (const s of attendanceData.students) {
          const rec = s.subjects[name];
          if (rec) {
            taken += rec.total.taken;
            attended += rec.total.attended;
          }
        }
        return {
          subject: shortSubject(name),
          pct: taken > 0 ? Number(((attended / taken) * 100).toFixed(1)) : null,
        };
      }),
    [meta.subjectOrder]
  );

  const histogram: HistBin[] = useMemo(() => {
    const bins: HistBin[] = [];
    for (let lo = 0; lo < 100; lo += 10) {
      bins.push({
        label: lo === 0 ? "0–9" : `${lo}–${lo + 9}`,
        count: 0,
      });
    }
    for (const s of attendanceData.students) {
      const pct = s.overall.percentage;
      if (pct === null) continue;
      const idx = Math.min(9, Math.floor(pct / 10));
      bins[idx].count += 1;
    }
    return bins;
  }, []);

  const extremes = useMemo(() => {
    const withData = attendanceData.students.filter((s) => s.overall.percentage !== null);
    if (withData.length === 0) return { top: null, bottom: null };
    const sorted = [...withData].sort(
      (a, b) => (b.overall.percentage ?? 0) - (a.overall.percentage ?? 0)
    );
    return { top: sorted[0], bottom: sorted[sorted.length - 1] };
  }, []);

  const statusBars = [
    { key: "excellent", label: "Excellent", value: stats.statusCounts.excellent, color: chart.success },
    { key: "safe", label: "On Track", value: stats.statusCounts.safe, color: chart.info },
    { key: "warning", label: "Needs Attention", value: stats.statusCounts.warning, color: chart.warning },
    { key: "low", label: "Low", value: stats.statusCounts.low, color: chart.warning },
    { key: "critical", label: "Critical", value: stats.statusCounts.critical, color: chart.danger },
  ];

  const barTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const entry = payload[0];
    return (
      <div className="chart-tooltip">
        <p className="font-semibold">{label}</p>
        <p className="tabular-nums">
          {entry.name === "Students" ? `${entry.value} students` : `${entry.value}%`}
        </p>
      </div>
    );
  };

  return (
    <div className="animate-fade-in space-y-8">
      <header>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">
          Class Analytics
        </h1>
        <p className="mt-1 text-sm text-inkfaint">
          Aggregate attendance across {attendanceData.students.length} students ·{" "}
          {meta.period.label} · Updated {formatDate(meta.lastUpdated)}
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="card p-4">
          <p className="flex items-center gap-1.5 text-xs font-medium text-inkfaint">
            <GraduationCap size={13} aria-hidden /> Students
          </p>
          <p className="mt-2 text-2xl font-extrabold tabular-nums text-ink">
            {attendanceData.students.length}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-medium text-inkfaint">Class Average</p>
          <p className="mt-2 text-2xl font-extrabold tabular-nums text-primary">
            {formatPct(stats.avg, 1)}
          </p>
        </div>
        <div className="card p-4">
          <p className="flex items-center gap-1.5 text-xs font-medium text-inkfaint">
            <TrendingUp size={13} style={{ color: "var(--success)" }} aria-hidden /> Above 75%
          </p>
          <p className="mt-2 text-2xl font-extrabold tabular-nums text-success">
            {stats.above}
          </p>
        </div>
        <div className="card p-4">
          <p className="flex items-center gap-1.5 text-xs font-medium text-inkfaint">
            <TrendingDown size={13} style={{ color: "var(--danger)" }} aria-hidden /> Below 75%
          </p>
          <p className="mt-2 text-2xl font-extrabold tabular-nums text-danger">
            {stats.below}
          </p>
        </div>
      </div>

      <section>
        <h2 className="mb-4 font-bold text-ink">Subject averages</h2>
        <div className="card p-5">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectAvg} layout="vertical" margin={{ top: 0, right: 24, bottom: 0, left: 8 }} barCategoryGap={10}>
                <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} horizontal={false} />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  stroke={chart.axis}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => `${v}%`}
                />
                <YAxis
                  type="category"
                  dataKey="subject"
                  stroke={chart.axis}
                  fontSize={12}
                  width={110}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={barTooltip} cursor={{ fill: "var(--bg-soft)" }} />
                <Bar dataKey="pct" radius={[0, 6, 6, 0]} maxBarSize={22}>
                  {subjectAvg.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={(entry.pct ?? 0) >= ATTENDANCE_TARGET ? chart.success : chart.primary}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-4 font-bold text-ink">Attendance distribution</h2>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={histogram} margin={{ top: 0, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} vertical={false} />
                <XAxis dataKey="label" stroke={chart.axis} fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke={chart.axis} fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={barTooltip} cursor={{ fill: "var(--bg-soft)" }} />
                <Bar dataKey="count" name="Students" fill={chart.primary} radius={[4, 4, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="mb-4 font-bold text-ink">Status distribution</h2>
          <div className="space-y-3">
            {statusBars.map((s) => (
              <div key={s.key} className="flex items-center gap-3">
                <span className="w-32 shrink-0 text-sm text-ink-soft">{s.label}</span>
                <div className="h-5 flex-1 overflow-hidden rounded-md bg-bg-soft">
                  <div
                    className="h-full rounded-md transition-all duration-700"
                    style={{
                      width: `${(s.value / attendanceData.students.length) * 100}%`,
                      background: s.color,
                    }}
                  />
                </div>
                <span className="w-8 shrink-0 text-right text-sm font-bold tabular-nums text-ink">
                  {s.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-bold text-ink">Highest & lowest overall attendance</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="card p-5">
            <p className="flex items-center gap-1.5 text-xs font-medium text-inkfaint">
              <TrendingUp size={13} className="text-success" aria-hidden /> Highest
            </p>
            {extremes.top ? (
              <>
                <p className="mt-2 text-3xl font-extrabold tabular-nums text-success">
                  {formatPct(extremes.top.overall.percentage, 1)}
                </p>
                <p className="mt-1 font-mono text-sm text-ink-soft">Roll {extremes.top.rollNo}</p>
              </>
            ) : (
              <p className="mt-2 text-sm text-inkfaint">No data</p>
            )}
          </div>
          <div className="card p-5">
            <p className="flex items-center gap-1.5 text-xs font-medium text-inkfaint">
              <TrendingDown size={13} className="text-danger" aria-hidden /> Lowest
            </p>
            {extremes.bottom ? (
              <>
                <p className="mt-2 text-3xl font-extrabold tabular-nums text-danger">
                  {formatPct(extremes.bottom.overall.percentage, 1)}
                </p>
                <p className="mt-1 font-mono text-sm text-ink-soft">Roll {extremes.bottom.rollNo}</p>
              </>
            ) : (
              <p className="mt-2 text-sm text-inkfaint">No data</p>
            )}
          </div>
        </div>
        <p className="mt-3 flex items-center gap-2 text-xs text-inkfaint">
          <ShieldCheck size={13} aria-hidden />
          For privacy, individual dashboards are identified by roll number only.
        </p>
      </section>
    </div>
  );
}