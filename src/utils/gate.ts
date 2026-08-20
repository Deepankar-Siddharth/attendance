import { UNLOCK_STORAGE_KEY } from "./config";

/**
 * Client-side privacy gate.
 *
 * NOTE: This is a lightweight privacy layer, NOT authentication. Roll numbers
 * are not secrets. It exists to prevent casual browsing of a classmate's
 * dashboard. Real authentication would require a backend.
 */

function readUnlocked(): string[] {
  try {
    const raw = sessionStorage.getItem(UNLOCK_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function writeUnlocked(list: string[]) {
  try {
    sessionStorage.setItem(UNLOCK_STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* storage unavailable — gate stays per-visit */
  }
}

export function isUnlocked(rollNo: string): boolean {
  return readUnlocked().includes(rollNo);
}

export function unlock(rollNo: string): void {
  const list = readUnlocked();
  if (!list.includes(rollNo)) {
    list.push(rollNo);
    writeUnlocked(list);
  }
}

export function lockAll(): void {
  try {
    sessionStorage.removeItem(UNLOCK_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}