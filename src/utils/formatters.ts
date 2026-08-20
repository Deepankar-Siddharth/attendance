export function formatPct(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "No classes";
  return `${value.toFixed(digits)}%`;
}

export function formatCount(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return String(value);
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} · ${d.toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit" })}`;
}

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function titleCaseName(name: string): string {
  return name
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
}

export function shortSubject(subject: string): string {
  const map: Record<string, string> = {
    "General and Dental Pharmacology": "Pharmacology",
    "General Pathology": "Pathology",
    "Preclinical Prosthodontics": "Prosthodontics",
    "Dental Material": "Dental Material",
    "Oral Pathology": "Oral Pathology",
    "General Microbiology": "Microbiology",
    "Preclinical Conservative": "Conservative",
  };
  return map[subject] || subject;
}

export function shortRoll(roll: string): string {
  return roll.length > 6 ? roll.slice(-6) : roll;
}