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

export type Goal = {
  id: string;
  employeeId: string;
  title: string;
  due: string;
  progress: number; // 0-100
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
  hireDate: string;
  salary: number;
  email: string;
};

export type NewLeave = { type: LeaveType; from: string; to: string; reason: string };

export type HrAction =
  | { type: "addEmployee"; employee: Employee }
  | { type: "recordSalaryChange"; employeeId: string; effective: string; amount: number; reason: string }
  | { type: "clockIn"; employeeId: string; date: string; time: string }
  | { type: "clockOut"; employeeId: string; date: string; time: string }
  | { type: "requestLeave"; request: LeaveRequest }
  | { type: "decideLeave"; id: string; decision: "approved" | "rejected"; byId: string }
  | { type: "addGoal"; goal: Goal }
  | { type: "setGoalProgress"; id: string; progress: number }
  | { type: "advanceReview"; id: string; rating?: number }
  | { type: "completeTraining"; id: string; date: string }
  | { type: "finalizePayroll" };

export type HrContextValue = HrState & {
  employeesById: Record<string, Employee>;
  /** The signed-in user's employee record id. */
  meId: string;
  addEmployee: (input: NewEmployee) => string;
  recordSalaryChange: (employeeId: string, amount: number, effective: string, reason: string) => void;
  clockIn: () => void;
  clockOut: () => void;
  requestLeave: (input: NewLeave) => void;
  decideLeave: (id: string, decision: "approved" | "rejected") => void;
  addGoal: (input: Omit<Goal, "id" | "progress">) => void;
  setGoalProgress: (id: string, progress: number) => void;
  advanceReview: (id: string, rating?: number) => void;
  completeTraining: (id: string) => void;
  finalizePayroll: () => void;
};
