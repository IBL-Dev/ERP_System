import type { Tone } from "@/components/ui/StatusBadge";
import { DEMO_TODAY, addDays, isWeekend } from "@/lib/date";
import type {
  AttendanceRecord,
  Department,
  Employee,
  Goal,
  LeaveRequest,
  LeaveType,
  ReviewStage,
  ShiftId,
  Training,
} from "./types";

export const CURRENCY = "USD";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: CURRENCY });
export const formatMoney = (n: number) => money.format(n);
export const formatNumber = (n: number) => n.toLocaleString("en-US");

export const DEPARTMENT_LABEL: Record<Department, string> = {
  executive: "Executive",
  inventory: "Inventory",
  finance: "Finance",
  hr: "HR",
  supplier: "Supplier",
  sales: "Sales",
};

/** Responsible department head: the person who approves leave for that department. */
export const DEPARTMENT_HEAD: Record<Department, string> = {
  executive: "EMP-1001",
  finance: "EMP-1002",
  hr: "EMP-1003",
  inventory: "EMP-1004",
  supplier: "EMP-1005",
  sales: "EMP-1006",
};

/** Heads report to the managing director, so the director approves their leave. */
export function approverOf(employee: Employee): string {
  const head = DEPARTMENT_HEAD[employee.department];
  return head === employee.id ? DEPARTMENT_HEAD.executive : head;
}

// ---------- time and attendance ----------
export const SHIFTS: Record<ShiftId, { label: string; start: string; end: string }> = {
  day: { label: "Day shift", start: "08:00", end: "17:00" },
  early: { label: "Early shift", start: "06:00", end: "15:00" },
  late: { label: "Late shift", start: "14:00", end: "23:00" },
};

export const BREAK_MINUTES = 60;
export const STANDARD_PAID_MINUTES = 8 * 60;
export const LATE_GRACE_MINUTES = 10;

export const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

export const formatHours = (minutes: number) =>
  `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}m`;

/** Paid minutes (break removed), or null while the person is still clocked in. */
export function workedMinutes(r: AttendanceRecord): number | null {
  if (r.absent || !r.clockIn || !r.clockOut) return null;
  return Math.max(0, toMinutes(r.clockOut) - toMinutes(r.clockIn) - BREAK_MINUTES);
}

export function overtimeMinutes(r: AttendanceRecord): number {
  const worked = workedMinutes(r);
  return worked === null ? 0 : Math.max(0, worked - STANDARD_PAID_MINUTES);
}

export type AttendanceStatus = "on-time" | "late" | "open" | "absent";

export function attendanceStatus(r: AttendanceRecord): AttendanceStatus {
  if (r.absent || !r.clockIn) return "absent";
  const late = toMinutes(r.clockIn) > toMinutes(SHIFTS[r.shift].start) + LATE_GRACE_MINUTES;
  if (!r.clockOut) return late ? "late" : "open";
  return late ? "late" : "on-time";
}

export const ATTENDANCE_META: Record<AttendanceStatus, { label: string; tone: Tone }> = {
  "on-time": { label: "On time", tone: "success" },
  late: { label: "Late", tone: "warning" },
  open: { label: "Clocked in", tone: "info" },
  absent: { label: "Absent", tone: "danger" },
};

// ---------- leave ----------
export const LEAVE_LABEL: Record<LeaveType, string> = {
  annual: "Annual leave",
  sick: "Sick leave",
  unpaid: "Unpaid leave",
};

/** Days per year. null = no limit. */
export const ENTITLEMENT: Record<LeaveType, number | null> = { annual: 14, sick: 7, unpaid: null };

// Sample company holiday calendar. TODO: manage this list from an admin screen.
export const HOLIDAYS: { date: string; name: string }[] = [
  { date: "2026-11-27", name: "Company foundation day" },
  { date: "2026-12-25", name: "Christmas Day" },
  { date: "2027-01-01", name: "New Year's Day" },
];

/** Weekdays between two dates, inclusive, skipping company holidays. */
export function countWorkingDays(from: string, to: string): number {
  if (!from || !to || to < from) return 0;
  const holidays = new Set(HOLIDAYS.map((h) => h.date));
  let days = 0;
  for (let d = from; d <= to; d = addDays(d, 1)) {
    if (!isWeekend(d) && !holidays.has(d)) days += 1;
  }
  return days;
}

export function leaveDays(employeeId: string, type: LeaveType, leave: LeaveRequest[], status: "approved" | "pending") {
  return leave
    .filter((l) => l.employeeId === employeeId && l.type === type && l.status === status)
    .reduce((total, l) => total + l.days, 0);
}

export const LEAVE_STATUS_META: Record<LeaveRequest["status"], { label: string; tone: Tone }> = {
  pending: { label: "Pending", tone: "warning" },
  approved: { label: "Approved", tone: "success" },
  rejected: { label: "Rejected", tone: "danger" },
};

// ---------- employees / salary ----------
/** Basic monthly salary in force on `date` (history is newest first). */
export function salaryAt(employee: Employee, date: string = DEMO_TODAY): number {
  const record = employee.salaryHistory.find((s) => s.effective <= date) ?? employee.salaryHistory.at(-1);
  return record?.amount ?? 0;
}

export const CONTRACT_LABEL = {
  permanent: "Permanent",
  "fixed-term": "Fixed term",
  probation: "Probation",
} as const;

// ---------- talent ----------
export type GoalStatus = "done" | "overdue" | "in-progress";

export function goalStatus(goal: Goal): GoalStatus {
  if (goal.progress >= 100) return "done";
  return goal.due < DEMO_TODAY ? "overdue" : "in-progress";
}

export const GOAL_META: Record<GoalStatus, { label: string; tone: Tone }> = {
  done: { label: "Achieved", tone: "success" },
  overdue: { label: "Overdue", tone: "danger" },
  "in-progress": { label: "In progress", tone: "info" },
};

export const REVIEW_STAGES: ReviewStage[] = ["self-review", "manager-review", "completed"];

export const REVIEW_META: Record<ReviewStage, { label: string; tone: Tone }> = {
  "self-review": { label: "Waiting for self-review", tone: "warning" },
  "manager-review": { label: "Waiting for manager", tone: "info" },
  completed: { label: "Completed", tone: "success" },
};

export type TrainingStatus = "completed" | "overdue" | "scheduled";

export function trainingStatus(t: Training): TrainingStatus {
  if (t.completedOn) return "completed";
  return t.dueDate < DEMO_TODAY ? "overdue" : "scheduled";
}

export const TRAINING_META: Record<TrainingStatus, { label: string; tone: Tone }> = {
  completed: { label: "Completed", tone: "success" },
  overdue: { label: "Overdue", tone: "danger" },
  scheduled: { label: "Scheduled", tone: "info" },
};
