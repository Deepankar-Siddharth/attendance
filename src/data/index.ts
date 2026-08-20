import attendance from "./attendance.json";
import issues from "./issues.json";
import validation from "./validation.json";
import type {
  AttendanceData,
  IssuesData,
  Student,
  ValidationData,
} from "../types";

export const attendanceData = attendance as AttendanceData;
export const issuesData = issues as IssuesData;
export const validationData = validation as ValidationData;

export const studentByRoll = new Map<string, Student>(
  attendanceData.students.map((s) => [s.rollNo, s])
);

export const issueById = new Map(
  issuesData.issues.map((i) => [i.id, i])
);

export const studentById = (rollNo: string): Student | undefined =>
  studentByRoll.get(rollNo);

export function issuesForStudent(student: Student) {
  return student.issues
    .map((id) => issueById.get(id))
    .filter((i) => i !== undefined);
}

export function issuesForSubject(student: Student, subject: string) {
  const rec = student.subjects[subject];
  if (!rec) return [];
  return rec.issues.map((id) => issueById.get(id)).filter((i) => i !== undefined);
}