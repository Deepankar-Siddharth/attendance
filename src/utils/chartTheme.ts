import { useMemo } from "react";
import { useTheme } from "./theme";

/**
 * Resolves chart colors from CSS variables so Recharts adapts to the
 * active theme. Re-evaluated whenever the theme changes.
 */
export function useChartTheme() {
  const { isDark } = useTheme();
  return useMemo(() => {
    const cs = getComputedStyle(document.documentElement);
    const v = (name: string, fallback: string) =>
      cs.getPropertyValue(name).trim() || fallback;
    return {
      isDark,
      grid: v("--chart-grid", "#e2e8f0"),
      axis: v("--chart-axis", "#94a3b8"),
      ink: v("--chart-ink", "#0f172a"),
      primary: v("--primary", "#4f46e5"),
      primarySoft: v("--primary-soft", "#eef2ff"),
      success: v("--success", "#22c55e"),
      info: v("--info", "#0ea5e9"),
      warning: v("--warning", "#f59e0b"),
      danger: v("--danger", "#ef4444"),
      tooltipBg: v("--card", "#ffffff"),
      tooltipBorder: v("--border", "#e2e8f0"),
      tooltipInk: v("--ink", "#0f172a"),
    };
  }, [isDark]);
}