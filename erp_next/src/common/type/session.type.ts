import type { DepartmentId } from "./navigation.type";

export type Session = {
  userId: string;
  /** Matches an employee record in the HR department. */
  employeeId: string;
  name: string;
  responsibility: string;
  department: DepartmentId;
};
