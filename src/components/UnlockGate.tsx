import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Search } from "lucide-react";
import type { Student } from "../types";
import { unlock } from "../utils/gate";

export function UnlockGate({
  student,
  onUnlocked,
}: {
  student: Student;
  onUnlocked: () => void;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim().replace(/\s+/g, "");
    if (trimmed === student.rollNo) {
      unlock(student.rollNo);
      onUnlocked();
    } else {
      setError(true);
      setValue("");
    }
  };

  return (
    <div className="mx-auto mt-10 w-full max-w-md animate-fade-up">
      <div className="card-lg p-8 text-center">
        <div
          className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{ background: "var(--primary-soft)" }}
        >
          <Lock size={26} style={{ color: "var(--primary)" }} aria-hidden />
        </div>
        <h1 className="text-xl font-bold text-ink">Student dashboard</h1>
        <p className="mt-2 text-sm text-inkfaint">
          Enter the roll number for{" "}
          <span className="font-semibold text-ink">{student.name}</span> to view
          this attendance report.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-3">
          <label htmlFor="unlock-roll" className="sr-only">
            Roll number
          </label>
          <div className="relative">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-inkfaint"
              aria-hidden
            />
            <input
              id="unlock-roll"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              autoFocus
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError(false);
              }}
              placeholder="e.g. 1230321024"
              className="input pl-11 text-center font-mono text-lg"
            />
          </div>
          {error && (
            <p className="text-sm font-medium text-danger" role="alert">
              That roll number doesn't match. Try again.
            </p>
          )}
          <button type="submit" className="btn-primary w-full">
            Unlock dashboard
          </button>
        </form>

        <button
          type="button"
          onClick={() => navigate("/")}
          className="mt-4 text-sm text-primary hover:underline"
        >
          ← Back to search
        </button>
        <p className="mt-6 text-[11px] leading-relaxed text-inkfaint">
          This is a lightweight privacy layer, not authentication. Roll numbers
          are not secrets — it simply discourages casual browsing of other
          students' reports.
        </p>
      </div>
    </div>
  );
}