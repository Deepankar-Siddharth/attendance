# BDSTrack — BDS Attendance Analytics Portal

A private, static web portal that turns the class attendance Excel workbook into
an interactive dashboard. Built for the BDS 2nd Year batch.

**Track. Understand. Improve.**

## Live site

https://`<username>`.github.io/attendance/

> Replace `<username>` with your GitHub username. The URL comes from the
> GitHub Pages settings on the repository (Source: **GitHub Actions**).

## Features

- **Roll-number-only privacy gate** — student names and detailed reports stay
  behind a roll-number prompt; once unlocked on a device they stay unlocked
  for the session.
- **Per-subject attendance** — lecture, practical and combined totals with
  percentages for all 7 subjects, across the whole academic period.
- **Weighted overall** — overall attendance = total attended ÷ total conducted
  (weighted by actual classes), not a simple average of percentages.
- **75% target tracking** — for each subject, see how far you are from 75% and
  how many consecutive classes you need to attend to reach it (when possible).
- **Trends & insights** — monthly trend chart, heatmap, subject profile radar,
  lecture-vs-practical comparison, milestones and plain-language insights.
- **Data quality, never silently fixed** — every anomaly in the Excel source
  (e.g. percentages above 100%) is preserved, assigned an issue ID, and listed
  on the Data Quality page. Impossible values are excluded from calculations
  only where necessary, and that exclusion is always visible.
- **Print / PDF** — every student report prints cleanly (CTRL+P or the
  "Print / Save PDF" button).
- **Dark mode** — follows system preference, toggleable, remembered.

## Tech stack

- React 18 + TypeScript (strict) + Vite
- Tailwind CSS + a CSS-variable theme system
- Recharts for all charts
- `xlsx` (SheetJS) — parses the workbook at build time
- GitHub Actions — validate, build, deploy to GitHub Pages
- SPA routing via hash router (works on GitHub Pages without server config)

## Project structure

```
data/
  attendance.xlsx            <- single source of truth (upload new monthly sheets here)
scripts/
  processAttendance.mjs      <- parses workbook, validates, generates JSON
src/
  data/                      <- generated JSON (gitignored, built in CI)
  types/index.ts             <- shared TypeScript interfaces
  utils/                     <- config, calculations, formatters, gate, theme…
  components/                <- UI, charts, cards, layout
  pages/                     <- Home, Student, Analytics, Data Quality, About
.github/workflows/deploy.yml <- CI/CD
```

## The Excel workbook format

- One sheet per subject (`General and Dental Pharmacology`, `General Pathology`,
  `Preclinical Prosthodontics`, `Dental Material`, `Oral Pathology`,
  `General Microbiology`, `Preclinical Conservative`), plus a consolidated
  `October 2024 to April 2025` sheet.
- Subject sheets: rows 1–4 titles, row 5 month groups, row 6 sub-headers
  (`Lecture Taken / Lecture Attended / %` and
  `Practical/Pracical Taken / Practical Attended / %`), student rows from row 7.
  Month groups start at column 3 and span 6 columns each; totals occupy
  columns 45–53. Section-header rows (e.g. `Supplementary Batch`, `Feb Batch`)
  have no roll number and are skipped.
- The parser detects months from the row-5 headers and the totals columns from
  row-6 headers, so the exact columns are not hard-coded.

## Monthly update workflow

1. Update `data/attendance.xlsx` with the new month's data (same workbook format).
2. `git add data/attendance.xlsx && git commit && git push`
3. GitHub Actions rebuilds and redeploys automatically.
4. Check the **Data Quality** page for any new anomalies in the workbook.

## Local development

```bash
npm install
npm run process-data   # parse the workbook -> src/data/*.json
npm run dev            # local dev server
npm run build          # process-data + tsc + vite build (single command)
npm run preview        # preview the production build
npm run typecheck      # TypeScript only
```

Set the correct repository path before your first deploy by editing the
`base` in `vite.config.ts` (currently `/attendance/`) to match your repository
name.

## Privacy notes

- The privacy gate is intentionally lightweight — roll numbers are not secrets,
  and no backend is involved. It prevents casual browsing of classmates'
  reports, nothing more.
- Analytics pages show roll numbers only, never names.
- The attendance workbook contains personal data; do not make the repository
  public if that is a concern.

## License

For personal/educational use. Not affiliated with or endorsed by any institution.