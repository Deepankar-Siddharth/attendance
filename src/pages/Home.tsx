import { Link } from "react-router-dom";
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  CalendarRange,
  GraduationCap,
  Info,
  Search,
  Target,
} from "lucide-react";
import { attendanceData } from "../data";
import { StudentSearch } from "../components/StudentSearch";
import { formatDate } from "../utils/formatters";
import { APP_TAGLINE } from "../utils/config";

export function HomePage() {
  const meta = attendanceData.meta;
  const autoFocusSearch =
    typeof window !== "undefined" &&
    window.matchMedia("(min-width: 768px)").matches;

  const features = [
    {
      icon: BarChart3,
      title: "Class Analytics",
      desc: "Subject averages, class distribution and overall standing — by roll number only.",
      to: "/analytics",
    },
    {
      icon: Target,
      title: "75% Target",
      desc: "See how far each subject is from 75% and how many classes you need to catch up.",
      scrollTo: "target",
    },
    {
      icon: AlertTriangle,
      title: "Data Quality",
      desc: "Every anomaly in the Excel workbook is preserved and flagged — never silently fixed.",
      to: "/issues",
    },
    {
      icon: Info,
      title: "How it works",
      desc: "How the Excel workbook becomes this site, and the privacy principles behind it.",
      to: "/about",
    },
  ];

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="hero-glow pb-8 pt-6 text-center sm:pt-14">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-ink-soft">
          <GraduationCap size={14} className="text-primary" aria-hidden />
          <span className="hidden sm:inline">
            BDS 2nd Year · {meta.institution}
          </span>
          <span className="sm:hidden">BDS 2nd Year</span>
        </span>
        <h1 className="mt-5 font-display text-4xl font-extrabold leading-tight tracking-tight text-ink sm:text-6xl">
          Your attendance,
          <br />
          <span className="text-primary">made simple.</span>
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-base text-ink-soft sm:mt-4 sm:text-lg">
          {APP_TAGLINE}. Understand your BDS attendance at a glance — track
          subjects, spot trends and chase your 75% target.
        </p>

        <div className="mx-auto mt-7 max-w-xl sm:mt-8">
          <StudentSearch autoFocus={autoFocusSearch} size="lg" />
        </div>

        <p className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-inkfaint">
          <CalendarRange size={15} aria-hidden />
          {meta.period.label}
          <span className="hidden sm:inline">·</span>
          <span>Updated {formatDate(meta.lastUpdated)}</span>
        </p>
      </section>

      {/* Feature cards */}
      <section className="grid grid-cols-1 gap-4 pb-8 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => {
          const Icon = f.icon;
          const content = (
            <>
              <span
                className="flex h-11 w-11 items-center justify-center rounded-xl text-white"
                style={{ background: "var(--primary)" }}
              >
                <Icon size={22} aria-hidden />
              </span>
              <h2 className="mt-4 font-bold text-ink">{f.title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">{f.desc}</p>
            </>
          );
          if (f.scrollTo) {
            return (
              <button
                key={f.title}
                type="button"
                onClick={() =>
                  document
                    .getElementById(f.scrollTo!)
                    ?.scrollIntoView({ behavior: "smooth", block: "start" })
                }
                className="card group p-5 text-left transition-transform hover:-translate-y-0.5"
              >
                {content}
              </button>
            );
          }
          return (
            <Link
              key={f.title}
              to={f.to!}
              className="card group p-5 transition-transform hover:-translate-y-0.5"
            >
              {content}
            </Link>
          );
        })}
      </section>

      {/* Target highlight */}
      <section id="target" className="card-lg mb-6 p-6 sm:p-8">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white"
              style={{ background: "var(--warning)" }}
            >
              <Target size={24} aria-hidden />
            </span>
            <div>
              <h2 className="text-xl font-bold text-ink">The 75% target</h2>
              <p className="mt-1 max-w-2xl text-sm text-ink-soft">
                For every subject, BDSTrack shows how far you are from the 75%
                requirement and — when it's mathematically possible — exactly how
                many consecutive classes you need to attend to reach it.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link to="/analytics" className="btn-primary">
              <Search size={16} aria-hidden /> Find your report
            </Link>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MiniStat label="Students" value={attendanceData.students.length} icon={GraduationCap} />
          <MiniStat label="Subjects" value={meta.subjectOrder.length} icon={BookOpen} />
          <MiniStat label="Months" value={meta.months.length} icon={CalendarRange} />
          <MiniStat label="Records" value={attendanceData.students.length * meta.subjectOrder.length} icon={BarChart3} />
        </div>
      </section>
    </div>
  );
}

function MiniStat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof GraduationCap;
}) {
  return (
    <div className="rounded-xl bg-bg p-4 text-center">
      <Icon size={18} className="mx-auto text-primary" aria-hidden />
      <p className="mt-1 text-2xl font-extrabold tabular-nums text-ink">{value}</p>
      <p className="text-xs text-inkfaint">{label}</p>
    </div>
  );
}