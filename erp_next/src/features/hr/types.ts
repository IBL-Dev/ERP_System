import type { DepartmentId } from "@/config/navigation";

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

export type Goal = {
  id: string;
  employeeId: string;
  title: string;
  due: string;
  progress: number; // 0-100
};

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

export type HrState = {
  employees: Employee[];
  attendance: AttendanceRecord[];
  leave: LeaveRequest[];
  goals: Goal[];
  reviews: Review[];
  training: Training[];
  payrollFinalized: boolean;
};
