import { Student } from "../types";

const normalize = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "");

/**
 * Lightweight fuzzy scorer.
 * Returns a score >= 0; higher is a better match. 0 means no match.
 */
function fuzzyScore(query: string, target: string): number {
  const q = normalize(query);
  const t = normalize(target);
  if (!q) return 0;
  if (t === q) return 3;
  if (t.startsWith(q)) return 2.2;
  if (t.includes(q)) return 1.6;
  // subsequence match (fuzzy: handles minor typos / skipped characters)
  let i = 0;
  for (const ch of t) {
    if (ch === q[i]) i++;
    if (i === q.length) break;
  }
  if (i === q.length) return Math.max(0.3, 1.2 - (t.length - q.length) * 0.01);
  return 0;
}

export interface SearchResult {
  student: Student;
  score: number;
  matchedBy: "roll" | "name";
}

export function searchStudents(
  students: Student[],
  query: string,
  limit = 8
): SearchResult[] {
  const q = query.trim();
  if (!q) return [];

  const results: SearchResult[] = [];
  for (const student of students) {
    const rollScore = fuzzyScore(q, student.rollNo);
    const nameScore = fuzzyScore(q, student.name);
    const score = Math.max(rollScore, nameScore);
    if (score > 0) {
      results.push({
        student,
        score,
        matchedBy: rollScore >= nameScore ? "roll" : "name",
      });
    }
  }
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}

export function isExactRollMatch(student: Student, query: string): boolean {
  return normalize(student.rollNo) === normalize(query.trim());
}