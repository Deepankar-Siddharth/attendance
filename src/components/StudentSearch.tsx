import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, User, X } from "lucide-react";
import { attendanceData } from "../data";
import { isExactRollMatch, searchStudents } from "../utils/search";
import { unlock } from "../utils/gate";
import { titleCaseName } from "../utils/formatters";

export function StudentSearch({
  autoFocus = false,
  size = "lg",
}: {
  autoFocus?: boolean;
  size?: "lg" | "md";
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const results = useMemo(
    () => searchStudents(attendanceData.students, query, 8),
    [query]
  );

  useEffect(() => {
    setActive(0);
  }, [query]);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const goTo = (rollNo: string, exact: boolean) => {
    if (exact) unlock(rollNo);
    setOpen(false);
    setQuery("");
    navigate(`/student/${rollNo}`);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
      setFocused(false);
      inputRef.current?.blur();
      return;
    }
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const res = results[active];
      if (res) {
        const exact = isExactRollMatch(res.student, query);
        goTo(res.student.rollNo, exact);
      }
    }
  };

  const showList = open && focused && query.trim().length > 0;

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search
          size={size === "lg" ? 22 : 18}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-inkfaint"
          aria-hidden
        />
        <input
          ref={inputRef}
          role="combobox"
          aria-expanded={showList}
          aria-label="Search students by name or roll number"
          autoComplete="off"
          value={query}
          onFocus={() => {
            setOpen(true);
            setFocused(true);
          }}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onKeyDown={onKeyDown}
          placeholder={size === "lg" ? "Search name or roll number…" : "Search…"}
          className={`input ${size === "lg" ? "py-4 pl-12 pr-12 text-base shadow-card" : "py-2.5 pl-10 pr-9 text-sm"}`}
        />
        {query && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-inkfaint hover:text-ink"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {showList && (
        <ul
          role="listbox"
          className="card-lg absolute z-30 mt-2 max-h-80 w-full overflow-auto p-2"
        >
          {results.length === 0 ? (
            <li className="px-3 py-4 text-center text-sm text-inkfaint">
              No students match “{query}”.
            </li>
          ) : (
            results.map(({ student, matchedBy }, i) => (
              <li key={student.rollNo}>
                <button
                  type="button"
                  role="option"
                  aria-selected={i === active}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    goTo(student.rollNo, isExactRollMatch(student, query));
                  }}
                  onMouseEnter={() => setActive(i)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                    i === active ? "bg-primary/10" : ""
                  }`}
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ background: "var(--primary)" }}
                    aria-hidden
                  >
                    {titleCaseName(student.name)
                      .split(" ")
                      .slice(0, 2)
                      .map((w) => w[0])
                      .join("")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink">
                      {titleCaseName(student.name)}
                    </span>
                    <span className="block text-xs text-inkfaint">
                      {student.rollNo}
                      {matchedBy === "roll" ? " · roll match" : ""}
                    </span>
                  </span>
                  <User size={16} className="shrink-0 text-inkfaint" aria-hidden />
                </button>
              </li>
            ))
          )}
          <li className="px-3 pt-2 text-[11px] text-inkfaint">
            ↑↓ navigate · Enter open · opening by name requires the roll number
          </li>
        </ul>
      )}
    </div>
  );
}