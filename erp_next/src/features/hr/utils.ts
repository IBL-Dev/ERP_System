import {
  BREAK_MINUTES,
  DEMO_TODAY,
  DEPARTMENT_HEAD,
  HOLIDAYS,
  LATE_GRACE_MINUTES,
  SHIFTS,
  STANDARD_PAID_MINUTES,
} from "@/common/const";
import type {
  AttendanceRecord,
  AttendanceStatus,
  Employee,
  Goal,
  GoalStatus,
  LeaveRequest,
  LeaveType,
  Training,
  TrainingStatus,
} from "@/common/type";
import { countWorkingDays as countDays, toMinutes } from "@/lib/date";

/** Heads report to the managing director, so the director approves their leave. */
export function approverOf(employee: Employee): string {
  const head = DEPARTMENT_HEAD[employee.department];
  return head === employee.id ? DEPARTMENT_HEAD.executive : head;
}

// ---------- time and attendance ----------
/** Paid minutes (break removed), or null while the person is still clocked in. */
export function workedMinutes(r: AttendanceRecord): number | null {
  if (r.absent || !r.clockIn || !r.clockOut) return null;
  return Math.max(0, toMinutes(r.clockOut) - toMinutes(r.clockIn) - BREAK_MINUTES);
}

export function overtimeMinutes(r: AttendanceRecord): number {
  const worked = workedMinutes(r);
  return worked === null ? 0 : Math.max(0, worked - STANDARD_PAID_MINUTES);
}

export function attendanceStatus(r: AttendanceRecord): AttendanceStatus {
  if (r.absent || !r.clockIn) return "absent";
  const late = toMinutes(r.clockIn) > toMinutes(SHIFTS[r.shift].start) + LATE_GRACE_MINUTES;
  if (!r.clockOut) return late ? "late" : "open";
  return late ? "late" : "on-time";
}

// ---------- leave ----------
/** Weekdays between two dates, inclusive, skipping company holidays. */
export const countWorkingDays = (from: string, to: string) =>
  countDays(from, to, HOLIDAYS.map((h) => h.date));

export function leaveDays(employeeId: string, type: LeaveType, leave: LeaveRequest[], status: "approved" | "pending") {
  return leave
    .filter((l) => l.employeeId === employeeId && l.type === type && l.status === status)
    .reduce((total, l) => total + l.days, 0);
}

// ---------- employees / salary ----------
/** Basic monthly salary in force on `date` (history is newest first). */
export function salaryAt(employee: Employee, date: string = DEMO_TODAY): number {
  const record = employee.salaryHistory.find((s) => s.effective <= date) ?? employee.salaryHistory.at(-1);
  return record?.amount ?? 0;
}

// ---------- talent ----------
export function goalStatus(goal: Goal): GoalStatus {
  if (goal.progress >= 100) return "done";
  return goal.due < DEMO_TODAY ? "overdue" : "in-progress";
}

export function trainingStatus(t: Training): TrainingStatus {
  if (t.completedOn) return "completed";
  return t.dueDate < DEMO_TODAY ? "overdue" : "scheduled";
}
