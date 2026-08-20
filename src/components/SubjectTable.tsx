import { useMemo, useState } from "react";
import { ArrowUpDown } from "lucide-react";
import type { Student } from "../types";
import { subjectSummaries } from "../utils/calculations";
import { shortSubject } from "../utils/formatters";
import { formatPct } from "../utils/formatters";
import { StatusBadge } from "./ui";

type SortKey = "subject" | "attendance" | "missed" | "status" | "lecture" | "practical";

const STATUS_RANK: Record<string, number> = {
  excellent: 0,
  safe: 1,
  warning: 2,
  low: 3,
  critical: 4,
  none: 5,
};

export function SubjectTable({ student }: { student: Student }) {
  const rows = useMemo(() => subjectSummaries(student), [student]);
  const [sortKey, setSortKey] = useState<SortKey>("attendance");
  const [asc, setAsc] = useState(false);

  const sorted = useMemo(() => {
    const arr = [...rows];
    arr.sort((a, b) => {
      let r = 0;
      switch (sortKey) {
        case "subject":
          r = shortSubject(a.subject).localeCompare(shortSubject(b.subject));
          break;
        case "attendance":
          r = (a.pct ?? -1) - (b.pct ?? -1);
          break;
        case "missed":
          r = a.record.total.missed - b.record.total.missed;
          break;
        case "lecture":
          r = (a.record.lecture.percentage ?? -1) - (b.record.lecture.percentage ?? -1);
          break;
        case "practical":
          r = (a.record.practical.percentage ?? -1) - (b.record.practical.percentage ?? -1);
          break;
        case "status": {
          const sa = a.pct === null ? 5 : STATUS_RANK[statusRank(a.pct)];
          const sb = b.pct === null ? 5 : STATUS_RANK[statusRank(b.pct)];
          r = sa - sb;
          break;
        }
      }
      return asc ? r : -r;
    });
    return arr;
  }, [rows, sortKey, asc]);

  const toggle = (key: SortKey) => {
    if (key === sortKey) setAsc(!asc);
    else {
      setSortKey(key);
      setAsc(key === "subject" ? true : false);
    }
  };

  const Th = ({
    label,
    k,
    className = "",
  }: {
    label: string;
    k: SortKey;
    className?: string;
  }) => (
    <th className={`px-3 py-2 ${className}`}>
      <button
        type="button"
        onClick={() => toggle(k)}
        className="inline-flex items-center gap-1 text-xs font-semibold text-inkfaint hover:text-ink"
        aria-label={`Sort by ${label}`}
      >
        {label}
        <ArrowUpDown size={12} aria-hidden />
      </button>
    </th>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <Th label="Subject" k="subject" className="text-left" />
            <Th label="Lecture" k="lecture" className="text-right" />
            <Th label="Practical" k="practical" className="text-right" />
            <Th label="Total" k="missed" className="text-right" />
            <Th label="Attendance" k="attendance" className="text-right" />
            <Th label="Status" k="status" className="text-right" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((s) => (
            <tr key={s.subject} className="border-b border-border/60 last:border-0">
              <td className="px-3 py-2.5 font-medium text-ink">
                {shortSubject(s.subject)}
              </td>
              <td className="px-3 py-2.5 text-right tabular-nums text-ink-soft">
                {s.record.lecture.attended}/{s.record.lecture.taken}
              </td>
              <td className="px-3 py-2.5 text-right tabular-nums text-ink-soft">
                {s.record.practical.attended}/{s.record.practical.taken}
              </td>
              <td className="px-3 py-2.5 text-right tabular-nums text-ink-soft">
                {s.record.total.attended}/{s.record.total.taken}
              </td>
              <td className="px-3 py-2.5 text-right font-bold tabular-nums text-ink">
                {formatPct(s.pct, 1)}
              </td>
              <td className="px-3 py-2.5 text-right">
                <StatusBadge pct={s.pct} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function statusRank(pct: number): string {
  if (pct >= 85) return "excellent";
  if (pct >= 75) return "safe";
  if (pct >= 65) return "warning";
  if (pct >= 50) return "low";
  return "critical";
}