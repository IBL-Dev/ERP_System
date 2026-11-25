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
  GoalTask,
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
  if (r.overtimeMinutes !== undefined) return r.overtimeMinutes;
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

// ---------- reporting lines ----------
/** Everyone who reports to `id`, directly or through someone else. */
export function subordinateIds(employees: Employee[], id: string): string[] {
  const result: string[] = [];
  const queue = [id];
  while (queue.length) {
    const current = queue.shift()!;
    for (const e of employees) {
      if (e.managerId === current && !result.includes(e.id)) {
        result.push(e.id);
        queue.push(e.id);
      }
    }
  }
  return result;
}

/** People an employee can be made to report to: anyone except themselves and their own reports. */
export function possibleManagers(employees: Employee[], id: string): Employee[] {
  const blocked = new Set([id, ...subordinateIds(employees, id)]);
  return employees.filter((e) => !blocked.has(e.id));
}

// ---------- goals ----------
/** Percent of to-do points done, or null when the goal has no to-do list. */
export function progressFromTasks(tasks: GoalTask[]): number | null {
  if (tasks.length === 0) return null;
  return Math.round((tasks.filter((t) => t.done).length / tasks.length) * 100);
}
