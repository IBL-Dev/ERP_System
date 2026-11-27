import type { DepartmentId } from "./navigation.type";

export type Department = DepartmentId | "executive";

export type SalaryRecord = { effective: string; amount: number; reason: string };

export type Contract = {
  type: "permanent" | "fixed-term" | "probation";
  start: string;
  end: string | null;
};

export type Employee = {
  id: string;
  name: string;
  jobTitle: string;
  department: Department;
  managerId: string | null;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  emergencyContact: string;
  hireDate: string;
  contract: Contract;
  /** Monthly basic salary, newest record first. */
  salaryHistory: SalaryRecord[];
};

export type ShiftId = "day" | "early" | "late";
export type ShiftDefinition = { label: string; start: string; end: string };

export type AttendanceRecord = {
  id: string;
  employeeId: string;
  date: string;
  shift: ShiftId;
  clockIn: string | null; // HH:MM
  clockOut: string | null; // HH:MM
  absent?: boolean;
  note?: string;
  /** Overtime entered by hand, in minutes. When absent, overtime is worked out from the times. */
  overtimeMinutes?: number;
};

export type AttendanceStatus = "on-time" | "late" | "open" | "absent";

export type LeaveType = "annual" | "sick" | "unpaid";
export type LeaveStatus = "pending" | "approved" | "rejected";

export type LeaveRequest = {
  id: string;
  employeeId: string;
  type: LeaveType;
  from: string;
  to: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  decidedBy: string | null;
  requestedOn: string;
};

export type Holiday = { date: string; name: string };

/** A comment on a goal or a review. */
export type HrComment = { id: string; by: string; at: string; text: string };

/** One point on a goal's to-do list. */
export type GoalTask = { id: string; text: string; done: boolean };

export type Goal = {
  id: string;
  employeeId: string;
  title: string;
  due: string;
  /** 0-100. Worked out from the to-do list when the goal has one; otherwise set by hand. */
  progress: number;
  tasks: GoalTask[];
  comments: HrComment[];
};

export type GoalStatus = "done" | "overdue" | "in-progress";

export type ReviewStage = "self-review" | "manager-review" | "completed";

export type Review = {
  id: string;
  employeeId: string;
  reviewerId: string;
  cycle: string;
  stage: ReviewStage;
  rating: number | null; // 1-5
  comments: HrComment[];
};

export type Training = {
  id: string;
  employeeId: string;
  course: string;
  hours: number;
  dueDate: string;
  completedOn: string | null;
};

export type TrainingStatus = "completed" | "overdue" | "scheduled";

export type Payslip = {
  employeeId: string;
  basic: number;
  allowance: number;
  overtimeHours: number;
  overtimePay: number;
  gross: number;
  unpaidLeaveDays: number;
  unpaidLeave: number;
  pension: number;
  taxable: number;
  tax: number;
  totalDeductions: number;
  net: number;
};

export type HrState = {
  employees: Employee[];
  attendance: AttendanceRecord[];
  leave: LeaveRequest[];
  goals: Goal[];
  reviews: Review[];
  training: Training[];
  payrollFinalized: boolean;
};

// ---- screen filters ----
export type DepartmentFilter = Department | "all";
export type AttendanceRange = "all" | "today";
export type LeaveFilter = "all" | "needs-me" | "mine";
export type TrainingFilter = TrainingStatus | "all";

// ---- provider API ----
export type NewEmployee = {
  name: string;
  jobTitle: string;
  department: Department;
  /** Who the employee reports to. */
  managerId: string;
  hireDate: string;
  salary: number;
  email: string;
};

/** Fields that can be changed on an existing employee record. */
export type EmployeePatch = Partial<
  Pick<Employee, "name" | "email" | "phone" | "address" | "dateOfBirth" | "emergencyContact" | "jobTitle" | "department" | "managerId" | "contract">
>;

/** One attendance record, entered or corrected by hand. */
export type AttendanceInput = {
  employeeId: string;
  date: string;
  shift: ShiftId;
  absent: boolean;
  clockIn: string | null;
  clockOut: string | null;
  /** Minutes; null means work it out from the times. */
  overtimeMinutes: number | null;
  note: string;
};

export type NewGoal = { employeeId: string; title: string; due: string; tasks: string[] };

export type NewTraining = { employeeId: string; course: string; hours: number; dueDate: string };

export type TrainingPatch = Partial<Pick<Training, "course" | "hours" | "dueDate" | "completedOn">>;

export type NewLeave = { type: LeaveType; from: string; to: string; reason: string };

export type HrAction =
  | { type: "addEmployee"; employee: Employee }
  | { type: "updateEmployee"; id: string; patch: EmployeePatch }
  | { type: "saveAttendance"; record: AttendanceRecord }
  | { type: "recordSalaryChange"; employeeId: string; effective: string; amount: number; reason: string }
  | { type: "clockIn"; employeeId: string; date: string; time: string }
  | { type: "clockOut"; employeeId: string; date: string; time: string }
  | { type: "requestLeave"; request: LeaveRequest }
  | { type: "decideLeave"; id: string; decision: "approved" | "rejected"; byId: string }
  | { type: "addGoal"; goal: Goal }
  | { type: "setGoalProgress"; id: string; progress: number }
  | { type: "toggleGoalTask"; goalId: string; taskId: string }
  | { type: "addGoalTask"; goalId: string; task: GoalTask }
  | { type: "removeGoalTask"; goalId: string; taskId: string }
  | { type: "addGoalComment"; goalId: string; comment: HrComment }
  | { type: "addReviewComment"; reviewId: string; comment: HrComment }
  | { type: "addTraining"; training: Training }
  | { type: "updateTraining"; id: string; patch: TrainingPatch }
  | { type: "advanceReview"; id: string; rating?: number }
  | { type: "completeTraining"; id: string; date: string }
  | { type: "finalizePayroll" };

export type HrContextValue = HrState & {
  employeesById: Record<string, Employee>;
  /** The signed-in user's employee record id. */
  meId: string;
  addEmployee: (input: NewEmployee) => string;
  /** Returns an error message, or null when the change was saved. */
  updateEmployee: (id: string, patch: EmployeePatch) => string | null;
  /** Adds or corrects one employee's record for one day. Returns an error message, or null. */
  saveAttendance: (input: AttendanceInput) => string | null;
  recordSalaryChange: (employeeId: string, amount: number, effective: string, reason: string) => void;
  clockIn: () => void;
  clockOut: () => void;
  requestLeave: (input: NewLeave) => void;
  decideLeave: (id: string, decision: "approved" | "rejected") => void;
  addGoal: (input: NewGoal) => void;
  /** Only used for goals without a to-do list. */
  setGoalProgress: (id: string, progress: number) => void;
  toggleGoalTask: (goalId: string, taskId: string) => void;
  addGoalTask: (goalId: string, text: string) => void;
  removeGoalTask: (goalId: string, taskId: string) => void;
  addGoalComment: (goalId: string, text: string) => void;
  advanceReview: (id: string, rating?: number) => void;
  addReviewComment: (reviewId: string, text: string) => void;
  completeTraining: (id: string) => void;
  addTraining: (input: NewTraining) => void;
  updateTraining: (id: string, patch: TrainingPatch) => void;
  finalizePayroll: () => void;
};
