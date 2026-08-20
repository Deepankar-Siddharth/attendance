export interface Meta {
  institution: string;
  university: string;
  batch: string;
  departments: Record<string, string>;
  period: { start: string; end: string; label: string };
  months: string[];
  lastUpdated: string;
  subjectOrder: string[];
  sourceFile: string;
}

export interface SessionAttendance {
  taken: number;
  attended: number;
  percentage: number | null;
}

export interface MonthlySession extends SessionAttendance {
  excluded: boolean;
  issueIds: string[];
}

export interface MonthlyRecord {
  month: string;
  lecture: MonthlySession;
  practical: MonthlySession;
  percentage: number | null;
  excluded: boolean;
  issueIds: string[];
}

export interface SubjectExclusion {
  month: string;
  session: "lecture" | "practical";
  issueId: string;
}

export interface SubjectTotals {
  taken: number;
  attended: number;
  missed: number;
  percentage: number | null;
  validMonths: number;
  excluded: SubjectExclusion[];
}

export interface SubjectRecord {
  subject: string;
  monthly: MonthlyRecord[];
  lecture: SessionAttendance;
  practical: SessionAttendance;
  total: SubjectTotals;
  issues: string[];
}

export interface OverallAttendance {
  totalClasses: number;
  attendedClasses: number;
  missedClasses: number;
  percentage: number | null;
  referencePercentage: number | null;
  issueCount: number;
}

export interface Student {
  rollNo: string;
  name: string;
  section: string;
  subjects: Record<string, SubjectRecord>;
  overall: OverallAttendance;
  issues: string[];
}

export interface AttendanceData {
  meta: Meta;
  students: Student[];
}

export type IssueSeverity = "error" | "warning" | "info";
export type IssueScope = "student" | "class";

export interface Issue {
  id: string;
  severity: IssueSeverity;
  type: string;
  studentRoll: string | null;
  studentName: string | null;
  subject: string | null;
  month: string | null;
  session: "lecture" | "practical" | null;
  attended: number | null;
  conducted: number | null;
  percentage: number | null;
  message: string;
  affectsStudent: boolean;
  affectsCalculations: boolean;
  scope: IssueScope;
}

export interface IssuesData {
  meta: { generatedAt: string; total: number; errors: number; warnings: number; info: number };
  issues: Issue[];
}

export interface ValidationData {
  studentCount: number;
  subjectCount: number;
  recordCount: number;
  validRecordCount: number;
  issueCount: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  period: { start: string; end: string; label: string };
  months: string[];
  lastUpdated: string;
  validationChecks: Record<string, number>;
  issues: string[];
}