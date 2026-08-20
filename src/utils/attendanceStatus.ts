import { ATTENDANCE_THRESHOLDS } from "./config";

export type StatusLevel =
  | "excellent"
  | "safe"
  | "warning"
  | "low"
  | "critical"
  | "none";

export interface StatusMeta {
  label: string;
  shortLabel: string;
  dot: string; // css color
  textClass: string;
  bgClass: string;
  borderClass: string;
  chipClass: string;
}

const STATUS_STYLES: Record<Exclude<StatusLevel, "none">, StatusMeta> = {
  excellent: {
    label: "Excellent",
    shortLabel: "Excellent",
    dot: "var(--success)",
    textClass: "text-success",
    bgClass: "bg-success/10",
    borderClass: "border-success/30",
    chipClass: "bg-success/10 text-success border border-success/30",
  },
  safe: {
    label: "On Track",
    shortLabel: "Safe",
    dot: "var(--info)",
    textClass: "text-info",
    bgClass: "bg-info/10",
    borderClass: "border-info/30",
    chipClass: "bg-info/10 text-info border border-info/30",
  },
  warning: {
    label: "Needs Attention",
    shortLabel: "Warning",
    dot: "var(--warning)",
    textClass: "text-warning",
    bgClass: "bg-warning/10",
    borderClass: "border-warning/30",
    chipClass: "bg-warning/10 text-warning border border-warning/30",
  },
  low: {
    label: "Low",
    shortLabel: "Low",
    dot: "var(--warning)",
    textClass: "text-warning",
    bgClass: "bg-warning/10",
    borderClass: "border-warning/30",
    chipClass: "bg-warning/10 text-warning border border-warning/30",
  },
  critical: {
    label: "Critical",
    shortLabel: "Critical",
    dot: "var(--danger)",
    textClass: "text-danger",
    bgClass: "bg-danger/10",
    borderClass: "border-danger/30",
    chipClass: "bg-danger/10 text-danger border border-danger/30",
  },
};

export function attendanceStatus(pct: number | null): StatusLevel {
  if (pct === null || Number.isNaN(pct)) return "none";
  if (pct >= ATTENDANCE_THRESHOLDS.excellent) return "excellent";
  if (pct >= ATTENDANCE_THRESHOLDS.safe) return "safe";
  if (pct >= ATTENDANCE_THRESHOLDS.warning) return "warning";
  if (pct >= ATTENDANCE_THRESHOLDS.low) return "low";
  return "critical";
}

export function statusMeta(level: StatusLevel): StatusMeta | null {
  if (level === "none") return null;
  return STATUS_STYLES[level];
}