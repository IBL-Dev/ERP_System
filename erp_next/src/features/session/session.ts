import type { DepartmentId } from "@/config/navigation";

export type Session = {
  userId: string;
  name: string;
  responsibility: string;
  department: DepartmentId;
};

/**
 * Mock session until real authentication exists.
 * TODO: replace with the logged-in user (cookie / token) once the backend is added.
 */
export function getSession(): Session {
  return {
    userId: "INVMGR01",
    name: "Demo user",
    responsibility: "Inventory manager",
    department: "inventory",
  };
}
