import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CalendarRange,
  GraduationCap,
  Hash,
  Printer,
  TriangleAlert,
} from "lucide-react";
import { studentById, attendanceData } from "../data";
import { isUnlocked } from "../utils/gate";
import { UnlockGate } from "../components/UnlockGate";
import { OverallGauge } from "../components/OverallGauge";
import { SummaryCards } from "../components/SummaryCards";
import { SubjectBarChart } from "../components/SubjectBarChart";
import { TargetCard } from "../components/TargetCard";
import { MonthlyTrendChart } from "../components/MonthlyTrendChart";
import { LecturePracticalChart } from "../components/LecturePracticalChart";
import { MonthlyHeatmap } from "../components/MonthlyHeatmap";
import { AttendanceRadarChart } from "../components/AttendanceRadarChart";
import { SubjectDetailCards } from "../components/SubjectDetailCards";
import { SubjectTable } from "../components/SubjectTable";
import { Insights } from "../components/Insights";
import { Milestones } from "../components/Milestones";
import { IssueBanner } from "../components/IssueBanner";
import { Collapsible, EmptyState } from "../components/ui";
import { greeting, formatDate, titleCaseName } from "../utils/formatters";
import { subjectsBelowTarget, targetGap } from "../utils/calculations";
import { ATTENDANCE_TARGET } from "../utils/config";

const isDesktop = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(min-width: 1024px)").matches;

const SECTION_NAV = [
  { id: "overview", label: "Overview" },
  { id: "targets", label: "75% Target" },
  { id: "trend", label: "Trend" },
  { id: "details", label: "Subjects" },
];

export function StudentDashboardPage() {
  const { rollNo = "" } = useParams();
  const navigate = useNavigate();
  const student = studentById(rollNo);
  const [unlocked, setUnlocked] = useState(() => isUnlocked(rollNo));

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [rollNo]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (!student) {
    return (
      <div className="mx-auto mt-10 max-w-lg">
        <EmptyState
          icon={<TriangleAlert size={40} />}
          title="We couldn't find that student."
          subtitle="Double-check the roll number in the link, or search by roll number from the home page."
        />
        <div className="mt-4 text-center">
          <button onClick={() => navigate("/")} className="btn-primary">
            <ArrowLeft size={16} aria-hidden /> Back to search
          </button>
        </div>
      </div>
    );
  }

  if (!unlocked) {
    return (
      <UnlockGate student={student} onUnlocked={() => setUnlocked(true)} />
    );
  }

  const below = subjectsBelowTarget(student);
  const meta = attendanceData.meta;
  const weakest = below[0];

  return (
    <div className="animate-fade-in space-y-8">
      {/* Print toolbar */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => navigate(-1)}
          className="btn-ghost"
          aria-label="Go back"
        >
          <ArrowLeft size={16} aria-hidden /> Back
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="btn-primary"
            aria-label="Print or save this report as PDF"
          >
            <Printer size={16} aria-hidden /> Print / Save PDF
          </button>
        </div>
      </div>

      {/* 1. Greeting / identity */}
      <section className="print-area">
        <p className="text-sm font-medium text-inkfaint">
          {greeting()}, {titleCaseName(student.name.split(" ")[0])} 👋
        </p>
        <h1 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
          {titleCaseName(student.name)}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-ink-soft">
          <span className="flex items-center gap-1.5">
            <Hash size={15} aria-hidden /> Roll No. {student.rollNo}
          </span>
          <span className="flex items-center gap-1.5">
            <GraduationCap size={15} aria-hidden /> BDS 2nd Year
          </span>
          <span className="flex items-center gap-1.5">
            <CalendarRange size={15} aria-hidden /> {meta.period.label}
          </span>
          {student.section && (
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              {student.section}
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-inkfaint">
          Updated {formatDate(meta.lastUpdated)}
        </p>
      </section>

      {/* Issue banner */}
      <div className="no-print">
        <IssueBanner student={student} />
      </div>

      {/* 2. Overall + summary */}
      <section id="overview" className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <OverallGauge
          pct={student.overall.percentage}
          issueCount={student.overall.issueCount}
          issuesLink={`/issues?student=${encodeURIComponent(student.rollNo)}`}
        />
        <div className="flex flex-col gap-4">
          <SummaryCards student={student} />
          {weakest && (
            <div className="card p-4">
              <p className="text-xs font-medium text-inkfaint">Priority subject</p>
              <p className="mt-1 flex items-center gap-2 font-semibold text-ink">
                <TriangleAlert size={16} className="text-warning" aria-hidden />
                {weakest.subject}
              </p>
              <p className="mt-0.5 text-sm text-ink-soft">
                {weakest.pct?.toFixed(1)}% ·{" "}
                {(ATTENDANCE_TARGET - (weakest.pct ?? 0)).toFixed(1)} pts below target — focus here
                first.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* 3. Subject attendance */}
      <section>
        <div className="mb-4">
          <h2 className="section-title">Your attendance at a glance</h2>
          <p className="section-sub">Attendance percentage per subject, weighted by actual classes.</p>
        </div>
        <div className="card p-5">
          <SubjectBarChart student={student} order={meta.subjectOrder} />
        </div>
      </section>

      {/* 4. Weak subjects */}
      {below.length > 0 && (
        <section>
          <div className="mb-4">
            <h2 className="section-title">Where am I losing attendance?</h2>
            <p className="section-sub">
              {below.length} subject{below.length > 1 ? "s" : ""} below the 75% target, weakest first.
            </p>
          </div>
          <div className="space-y-2.5">
            {below.map((s) => {
              const gap = targetGap(s.pct, s.record.total.attended, s.record.total.taken);
              return (
                <div key={s.subject} className="card flex flex-wrap items-center gap-4 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-ink">{s.subject}</p>
                    <p className="text-sm text-warning">
                      {s.pct?.toFixed(1)}% · {gap.gap.toFixed(1)} pts below target
                    </p>
                  </div>
                  <p className="text-sm text-ink-soft">
                    {gap.classesToReach !== null ? (
                      <>
                        Attend next{" "}
                        <span className="font-bold text-ink">{gap.classesToReach}</span>{" "}
                        consecutive classes to reach 75%.
                      </>
                    ) : (
                      "Cannot be computed."
                    )}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 5. 75% target cards */}
      <section id="targets">
        <div className="mb-4">
          <h2 className="section-title">75% target tracking</h2>
          <p className="section-sub">
            Assumes future classes continue to be conducted and you attend all of them.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {meta.subjectOrder.map((name) => {
            const rec = student.subjects[name];
            if (!rec) return null;
            return (
              <TargetCard
                key={name}
                summary={{
                  subject: name,
                  record: rec,
                  pct: rec.total.percentage,
                  status: rec.total.percentage !== null && rec.total.percentage >= 75 ? "met" : "below",
                }}
              />
            );
          })}
        </div>
      </section>

      {/* 6. Monthly trend */}
      <section id="trend">
        <div className="mb-4">
          <h2 className="section-title">Attendance trend</h2>
          <p className="section-sub">Is your attendance improving or declining?</p>
        </div>
        <div className="card p-5">
          <MonthlyTrendChart student={student} />
        </div>
      </section>

      {/* 7. Lecture vs practical */}
      <section>
        <div className="mb-4">
          <h2 className="section-title">Lecture vs practical</h2>
          <p className="section-sub">How do your lectures and practicals compare?</p>
        </div>
        <div className="card p-5">
          <LecturePracticalChart student={student} />
        </div>
      </section>

      {/* 8. Deep dive (heatmap + radar) */}
      <Collapsible
        id="deep"
        title="Deep dive"
        subtitle="Monthly heatmap and subject profile — tap to expand"
        defaultOpen={isDesktop()}
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="card p-5">
            <h3 className="mb-4 text-sm font-semibold text-ink">Monthly heatmap</h3>
            <MonthlyHeatmap student={student} />
          </div>
          <div className="card p-5">
            <h3 className="mb-4 text-sm font-semibold text-ink">Subject profile</h3>
            <AttendanceRadarChart student={student} />
          </div>
        </div>
      </Collapsible>

      {/* 10. Subject details */}
      <section id="details">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="section-title">Subject details</h2>
            <p className="section-sub">Lectures, practicals and totals for every subject.</p>
          </div>
          <div className="no-print hidden gap-2 lg:flex" aria-label="Section navigation">
            {SECTION_NAV.map((s) => (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-ink-soft hover:text-ink"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <SubjectDetailCards student={student} />
      </section>

      {/* 11. Insights + milestones */}
      <section className="grid gap-4 lg:grid-cols-2">
        <Insights student={student} />
        <Milestones student={student} />
      </section>

      {/* 12. Sortable table */}
      <section className="hidden print:block lg:block">
        <div className="mb-4">
          <h2 className="section-title">Detailed table</h2>
          <p className="section-sub">Sortable — click any column header.</p>
        </div>
        <div className="card overflow-hidden p-2">
          <SubjectTable student={student} />
        </div>
      </section>
    </div>
  );
}