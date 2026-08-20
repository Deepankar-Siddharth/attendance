import { ReactNode, useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  CircleAlert,
  Info,
  ShieldCheck,
} from "lucide-react";
import { statusMeta, StatusLevel } from "../utils/attendanceStatus";
import type { Issue } from "../types";

/* ---------------------------------- Status -------------------------------- */

export function StatusBadge({ pct }: { pct: number | null }) {
  const level: StatusLevel = pct === null || pct === undefined || Number.isNaN(pct)
    ? "none"
    : pct >= 85
    ? "excellent"
    : pct >= 75
    ? "safe"
    : pct >= 65
    ? "warning"
    : pct >= 50
    ? "low"
    : "critical";
  const meta = statusMeta(level);
  if (!meta) return <span className="text-xs text-inkfaint">No data</span>;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.chipClass}`}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.dot }} />
      {meta.label}
    </span>
  );
}

export function StatusDot({ level }: { level: StatusLevel }) {
  const meta = statusMeta(level);
  if (!meta) return null;
  return (
    <span
      className="inline-block h-2.5 w-2.5 rounded-full"
      style={{ background: meta.dot }}
      aria-hidden
    />
  );
}

/* ---------------------------------- Card ---------------------------------- */

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`card ${className}`}>{children}</div>;
}

export function Section({
  title,
  subtitle,
  right,
  children,
  className = "",
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`animate-fade-up ${className}`}>
      {(title || right) && (
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            {title && <h2 className="section-title">{title}</h2>}
            {subtitle && <p className="section-sub mt-0.5">{subtitle}</p>}
          </div>
          {right}
        </div>
      )}
      {children}
    </section>
  );
}

/* --------------------------------- Issues --------------------------------- */

const SEVERITY_META: Record<
  Issue["severity"],
  { label: string; chipClass: string; Icon: typeof Info }
> = {
  error: { label: "Error", chipClass: "bg-danger/10 text-danger border border-danger/30", Icon: CircleAlert },
  warning: { label: "Warning", chipClass: "bg-warning/10 text-warning border border-warning/30", Icon: AlertTriangle },
  info: { label: "Info", chipClass: "bg-info/10 text-info border border-info/30", Icon: Info },
};

export function IssueSeverityChip({ severity }: { severity: Issue["severity"] }) {
  const meta = SEVERITY_META[severity];
  const Icon = meta.Icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.chipClass}`}>
      <Icon size={13} /> {meta.label}
    </span>
  );
}

export function IssueIcon({ severity, size = 18 }: { severity: Issue["severity"]; size?: number }) {
  const Icon = SEVERITY_META[severity].Icon;
  const color =
    severity === "error"
      ? "var(--danger)"
      : severity === "warning"
      ? "var(--warning)"
      : "var(--info)";
  return <Icon size={size} style={{ color }} aria-hidden />;
}

export function IssueWarningDot({
  count,
  className = "",
}: {
  count: number;
  className?: string;
}) {
  if (count === 0) return null;
  return (
    <span
      className={`inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[11px] font-bold text-white ${className}`}
      style={{ background: "var(--danger)" }}
      aria-label={`${count} issues`}
    >
      {count}
    </span>
  );
}

export function NoIssuesBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success border border-success/30">
      <ShieldCheck size={13} /> No data issues
    </span>
  );
}

/* ------------------------------- Collapsible ------------------------------ */

export function Collapsible({
  id,
  title,
  subtitle,
  children,
  defaultOpen = false,
}: {
  id?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section id={id} className="animate-fade-up">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={id ? `${id}-panel` : undefined}
        className="mb-4 flex w-full items-start justify-between gap-3 text-left"
      >
        <span>
          <span className="section-title block">{title}</span>
          {subtitle && <span className="section-sub mt-0.5 block">{subtitle}</span>}
        </span>
        <span
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-ink-soft transition-transform duration-300"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
          aria-hidden
        >
          <ChevronDown size={18} />
        </span>
      </button>
      {open && <div id={id ? `${id}-panel` : undefined}>{children}</div>}
    </section>
  );
}

/* ------------------------------- Skeleton -------------------------------- */

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse-soft rounded-lg bg-ink/10 ${className}`} />;
}

/* ------------------------------- Empty ----------------------------------- */

export function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-bg/50 px-6 py-12 text-center">
      {icon && <div className="text-inkfaint">{icon}</div>}
      <p className="font-semibold text-ink">{title}</p>
      {subtitle && <p className="max-w-sm text-sm text-inkfaint">{subtitle}</p>}
    </div>
  );
}