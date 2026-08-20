// Central application configuration.
// Thresholds and the target are intentionally configurable here so the
// application can be tuned without touching component code.

export const APP_NAME = "BDSTrack";
export const APP_TAGLINE = "Track. Understand. Improve.";

/** Minimum attendance required (percentage points). */
export const ATTENDANCE_TARGET = 75;

/**
 * Attendance status thresholds (percentage points).
 *   >= excellent : Excellent
 *   >= safe      : On Track
 *   >= warning   : Needs Attention
 *   >= low       : Low
 *   <  low       : Critical
 */
export const ATTENDANCE_THRESHOLDS = {
  excellent: 85,
  safe: 75,
  warning: 65,
  low: 50,
} as const;

/** Storage keys */
export const THEME_STORAGE_KEY = "bdstrack-theme";
export const UNLOCK_STORAGE_KEY = "bdstrack-unlocked";