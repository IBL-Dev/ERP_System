import type { DepartmentId } from "./navigation.type";

/** The only two roles in this phase. Frontend demo only; the backend must enforce real authorization later. */
export type Role = "SUPER_ADMIN" | "ADMIN";

export type Session = {
  userId: string;
  role: Role;
  /** Matches an employee record in the HR department. */
  employeeId: string;
  name: string;
  responsibility: string;
  department: DepartmentId;
};
