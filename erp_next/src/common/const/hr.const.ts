import type {
  AttendanceRange,
  AttendanceStatus,
  Department,
  DepartmentFilter,
  GoalStatus,
  Holiday,
  LeaveFilter,
  LeaveStatus,
  LeaveType,
  ReviewStage,
  SelectOption,
  ShiftDefinition,
  ShiftId,
  Contract,
  ToneMeta,
  TrainingFilter,
  TrainingStatus,
} from "../type";

/** The managing director: approves leave for department heads. */
export const EXECUTIVE_ID = "EMP-1001";

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
  executive: EXECUTIVE_ID,
  finance: "EMP-1002",
  hr: "EMP-1003",
  inventory: "EMP-1004",
  supplier: "EMP-1005",
  sales: "EMP-1006",
};

/** Names for the employee ids used across departments (same people as the HR mock data). */
export const STAFF_NAMES: Record<string, string> = {
  "EMP-1001": "Marcus Hale",
  "EMP-1002": "Priya Nair",
  "EMP-1003": "Daniel Okafor",
  "EMP-1004": "Sofia Lindqvist",
  "EMP-1005": "Hiroshi Tanaka",
  "EMP-1006": "Elena Petrova",
  "EMP-1007": "Tomas Alvarez",
  "EMP-1008": "Aisha Rahman",
  "EMP-1009": "Liam O'Connor",
  "EMP-1010": "Chen Wei",
  "EMP-1011": "Grace Mwangi",
  "EMP-1012": "Noah Fischer",
  "EMP-1013": "Zara Ahmed",
  "EMP-1014": "Mateo Silva",
};

const DEPARTMENT_IDS = Object.keys(DEPARTMENT_LABEL) as Department[];

export const DEPARTMENT_OPTIONS: readonly SelectOption<Department>[] = DEPARTMENT_IDS.map((value) => ({
  value,
  label: DEPARTMENT_LABEL[value],
}));

export const DEPARTMENT_FILTERS: readonly SelectOption<DepartmentFilter>[] = [
  { value: "all", label: "All departments" },
  ...DEPARTMENT_OPTIONS,
];

export const CONTRACT_LABEL = {
  permanent: "Permanent",
  "fixed-term": "Fixed term",
  probation: "Probation",
} as const;

// ---------- time and attendance ----------
export const SHIFTS: Record<ShiftId, ShiftDefinition> = {
  day: { label: "Day shift", start: "08:00", end: "17:00" },
  early: { label: "Early shift", start: "06:00", end: "15:00" },
  late: { label: "Late shift", start: "14:00", end: "23:00" },
};

export const BREAK_MINUTES = 60;
export const STANDARD_PAID_MINUTES = 8 * 60;
export const LATE_GRACE_MINUTES = 10;

export const ATTENDANCE_META: Record<AttendanceStatus, ToneMeta> = {
  "on-time": { label: "On time", tone: "success" },
  late: { label: "Late", tone: "warning" },
  open: { label: "Clocked in", tone: "info" },
  absent: { label: "Absent", tone: "danger" },
};

export const ATTENDANCE_RANGES: readonly SelectOption<AttendanceRange>[] = [
  { value: "all", label: "Last 6 working days" },
  { value: "today", label: "Today only" },
];

// ---------- leave ----------
export const LEAVE_LABEL: Record<LeaveType, string> = {
  annual: "Annual leave",
  sick: "Sick leave",
  unpaid: "Unpaid leave",
};

export const LEAVE_TYPE_OPTIONS: readonly SelectOption<LeaveType>[] = (Object.keys(LEAVE_LABEL) as LeaveType[]).map(
  (value) => ({ value, label: LEAVE_LABEL[value] }),
);

/** Days per year. null = no limit. */
export const ENTITLEMENT: Record<LeaveType, number | null> = { annual: 14, sick: 7, unpaid: null };

/** Sample company holiday calendar. TODO: manage this list from an admin screen. */
export const HOLIDAYS: readonly Holiday[] = [
  { date: "2026-11-27", name: "Company foundation day" },
  { date: "2026-12-25", name: "Christmas Day" },
  { date: "2027-01-01", name: "New Year's Day" },
];

export const LEAVE_STATUS_META: Record<LeaveStatus, ToneMeta> = {
  pending: { label: "Pending", tone: "warning" },
  approved: { label: "Approved", tone: "success" },
  rejected: { label: "Rejected", tone: "danger" },
};

export const LEAVE_FILTERS: readonly SelectOption<LeaveFilter>[] = [
  { value: "all", label: "All requests" },
  { value: "needs-me", label: "Waiting for my decision" },
  { value: "mine", label: "My requests" },
];

// ---------- talent ----------
export const GOAL_META: Record<GoalStatus, ToneMeta> = {
  done: { label: "Achieved", tone: "success" },
  overdue: { label: "Overdue", tone: "danger" },
  "in-progress": { label: "In progress", tone: "info" },
};

export const REVIEW_STAGES: readonly ReviewStage[] = ["self-review", "manager-review", "completed"];

export const REVIEW_META: Record<ReviewStage, ToneMeta> = {
  "self-review": { label: "Waiting for self-review", tone: "warning" },
  "manager-review": { label: "Waiting for manager", tone: "info" },
  completed: { label: "Completed", tone: "success" },
};

export const RATING_OPTIONS: readonly SelectOption[] = [
  { value: "", label: "Rating" },
  ...[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n} of 5` })),
];

export const TRAINING_META: Record<TrainingStatus, ToneMeta> = {
  completed: { label: "Completed", tone: "success" },
  overdue: { label: "Overdue", tone: "danger" },
  scheduled: { label: "Scheduled", tone: "info" },
};

export const TRAINING_FILTERS: readonly SelectOption<TrainingFilter>[] = [
  { value: "all", label: "All courses" },
  { value: "scheduled", label: "Scheduled" },
  { value: "overdue", label: "Overdue" },
  { value: "completed", label: "Completed" },
];

// ---------- editing forms ----------
export const SHIFT_OPTIONS: readonly SelectOption<ShiftId>[] = (Object.keys(SHIFTS) as ShiftId[]).map((value) => ({
  value,
  label: `${SHIFTS[value].label} (${SHIFTS[value].start}-${SHIFTS[value].end})`,
}));

export const ATTENDANCE_ENTRY_OPTIONS: readonly SelectOption[] = [
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent" },
];

export const CONTRACT_TYPE_OPTIONS: readonly SelectOption<Contract["type"]>[] = (
  Object.keys(CONTRACT_LABEL) as Contract["type"][]
).map((value) => ({ value, label: CONTRACT_LABEL[value] }));
