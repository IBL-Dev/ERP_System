import type { Session } from "../type";

/**
 * Mock users until real authentication exists. Both point at existing HR employee records,
 * so approvals and attribution inside the departments keep working.
 * The user name typed on the login page picks one of these (see resolveLoginUser).
 */
export const MOCK_SUPER_ADMIN: Session = {
  userId: "SADMIN01",
  role: "SUPER_ADMIN",
  employeeId: "EMP-1001",
  name: "Marcus Hale",
  responsibility: "Super administrator",
  department: "hr",
};

export const MOCK_ADMIN: Session = {
  userId: "ADMIN01",
  role: "ADMIN",
  employeeId: "EMP-1003",
  name: "Daniel Okafor",
  responsibility: "Administrator",
  department: "hr",
};

export const MOCK_USERS: readonly Session[] = [MOCK_SUPER_ADMIN, MOCK_ADMIN];
