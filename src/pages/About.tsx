import { BookOpen, Database, LineChart, ShieldCheck, Users, Workflow } from "lucide-react";
import { attendanceData, validationData } from "../data";
import { formatDate } from "../utils/formatters";
import { APP_NAME } from "../utils/config";

const features = [
  {
    icon: Users,
    title: "Roll-number-only privacy",
    desc: "Student names and detailed reports are locked behind a roll-number gate. Once unlocked on a device, everything works as normal.",
  },
  {
    icon: BookOpen,
    title: "Lecture + practical breakdown",
    desc: "Every subject splits attendance into lectures and practicals, with their own totals and percentages.",
  },
  {
    icon: LineChart,
    title: "Monthly trends & insights",
    desc: "See your attendance improve or decline month by month, with plain-language insights and milestones.",
  },
  {
    icon: Workflow,
    title: "Excel → web automatically",
    desc: "A build pipeline parses the attendance Excel workbook, validates every record and generates the site. Update the workbook, push, and the site rebuilds.",
  },
  {
    icon: Database,
    title: "Nothing silently changed",
    desc: "If a cell looks wrong (like a percentage above 100%), it's kept exactly as-is and flagged on the Data Quality page — never quietly corrected.",
  },
  {
    icon: ShieldCheck,
    title: "Print / PDF friendly",
    desc: "Every student report can be printed or saved as a PDF in a clean, shareable format.",
  },
];

const pipeline = [
  "Upload the Excel workbook to data/attendance.xlsx",
  "GitHub Actions validates the workbook and regenerates the JSON data",
  "A strict TypeScript build bundles the React app",
  "The finished site is deployed to GitHub Pages",
];

export function AboutPage() {
  const meta = attendanceData.meta;
  return (
    <div className="animate-fade-in mx-auto max-w-3xl space-y-8">
      <header>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">
          About {APP_NAME}
        </h1>
        <p className="mt-2 leading-relaxed text-ink-soft">
          {APP_NAME} turns the class attendance Excel workbook into a fast,
          private web dashboard. It was built for the BDS 2nd Year batch covering{" "}
          {meta.period.label}.
        </p>
      </header>

      <section>
        <h2 className="mb-4 font-bold text-ink">What BDSTrack does</h2>
        <ul className="list-inside space-y-2 text-sm leading-relaxed text-ink-soft">
          <li>• Parses 7 subject sheets plus the consolidated sheet of the Excel workbook.</li>
          <li>• Computes per-subject lecture, practical and combined attendance.</li>
          <li>• Computes a weighted overall percentage (sum of attended ÷ sum of conducted).</li>
          <li>• Flags every data-quality issue instead of silently "fixing" the source.</li>
          <li>• Shows what's needed to reach the 75% attendance target.</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-4 font-bold text-ink">The data quality principle</h2>
        <p className="text-sm leading-relaxed text-ink-soft">
          The Excel workbook is treated as the single source of truth. If a value
          looks incorrect (for example a practical attendance of 5 out of 4
          conducted classes), it is never altered in the underlying data. Instead it
          is preserved, assigned an issue ID, and — when it would produce an
          impossible percentage — excluded from calculations while still being shown
          in the original report. All of this is visible on the{" "}
          <a className="font-semibold text-primary hover:underline" href="#/issues">
            Data Quality
          </a>{" "}
          page.
        </p>
        <p className="mt-3 text-sm text-inkfaint">
          Right now the workbook has {validationData.errorCount} error
          {validationData.errorCount === 1 ? "" : "s"}, {validationData.warningCount} warning
          {validationData.warningCount === 1 ? "" : "s"} and {validationData.infoCount} information
          item{validationData.infoCount === 1 ? "" : "s"}.
        </p>
      </section>

      <section>
        <h2 className="mb-4 font-bold text-ink">How the site updates</h2>
        <ol className="space-y-2">
          {pipeline.map((step, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-ink-soft">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
        <p className="mt-4 text-xs text-inkfaint">
          Data last updated {formatDate(meta.lastUpdated)} · generated from the workbook
          at build time.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {features.map((f) => {
          const Icon = f.icon;
          return (
            <div key={f.title} className="card p-5">
              <Icon size={20} className="text-primary" aria-hidden />
              <h3 className="mt-3 font-bold text-ink">{f.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">{f.desc}</p>
            </div>
          );
        })}
      </section>
    </div>
  );
}