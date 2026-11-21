import type { Session } from "../type";

/** Mock signed-in user until real authentication exists. */
export const MOCK_SESSION: Session = {
  userId: "INVMGR01",
  employeeId: "EMP-1004",
  name: "Sofia Lindqvist",
  responsibility: "Inventory manager",
  department: "inventory",
};
