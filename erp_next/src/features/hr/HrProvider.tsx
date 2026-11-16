"use client";

import { createContext, useContext, useMemo, useReducer, type ReactNode } from "react";
import { getSession } from "@/features/session/session";
import { DEMO_TODAY, addDays } from "@/lib/date";
import { INITIAL_STATE } from "./mock-data";
import { hrReducer } from "./reducer";
import type { Department, Employee, Goal, HrState, LeaveRequest, LeaveType } from "./types";
import { DEPARTMENT_HEAD, countWorkingDays } from "./utils";

type NewEmployee = { name: string; jobTitle: string; department: Department; hireDate: string; salary: number; email: string };
type NewLeave = { type: LeaveType; from: string; to: string; reason: string };

type HrContextValue = HrState & {
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

const HrContext = createContext<HrContextValue | null>(null);

const nowHHMM = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

/**
 * Holds HR state for every /hr screen, so an approval, a clock-in or a salary change
 * shows up everywhere at once. Swap the reducer for API calls later.
 */
export function HrProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(hrReducer, INITIAL_STATE);
  const meId = getSession().employeeId;

  const value = useMemo<HrContextValue>(
    () => ({
      ...state,
      meId,
      employeesById: Object.fromEntries(state.employees.map((e) => [e.id, e])),

      addEmployee: (input) => {
        const next = Math.max(...state.employees.map((e) => Number(e.id.slice(4)))) + 1;
        const id = `EMP-${next}`;
        const employee: Employee = {
          id,
          name: input.name,
          jobTitle: input.jobTitle,
          department: input.department,
          managerId: DEPARTMENT_HEAD[input.department],
          email: input.email,
          phone: "-",
          address: "-",
          dateOfBirth: "-",
          emergencyContact: "-",
          hireDate: input.hireDate,
          contract: { type: "probation", start: input.hireDate, end: addDays(input.hireDate, 90) },
          salaryHistory: [{ effective: input.hireDate, amount: input.salary, reason: "Hired" }],
        };
        dispatch({ type: "addEmployee", employee });
        return id;
      },

      recordSalaryChange: (employeeId, amount, effective, reason) =>
        dispatch({ type: "recordSalaryChange", employeeId, amount, effective, reason }),

      clockIn: () => dispatch({ type: "clockIn", employeeId: meId, date: DEMO_TODAY, time: nowHHMM() }),
      clockOut: () => dispatch({ type: "clockOut", employeeId: meId, date: DEMO_TODAY, time: nowHHMM() }),

      requestLeave: (input) => {
        const request: LeaveRequest = {
          id: `LR-${3000 + state.leave.length + 1}`,
          employeeId: meId,
          ...input,
          days: countWorkingDays(input.from, input.to),
          status: "pending",
          decidedBy: null,
          requestedOn: DEMO_TODAY,
        };
        dispatch({ type: "requestLeave", request });
      },

      decideLeave: (id, decision) => dispatch({ type: "decideLeave", id, decision, byId: meId }),

      addGoal: (input) =>
        dispatch({ type: "addGoal", goal: { ...input, id: `G-${String(state.goals.length + 1).padStart(3, "0")}`, progress: 0 } }),
      setGoalProgress: (id, progress) => dispatch({ type: "setGoalProgress", id, progress }),
      advanceReview: (id, rating) => dispatch({ type: "advanceReview", id, rating }),
      completeTraining: (id) => dispatch({ type: "completeTraining", id, date: DEMO_TODAY }),
      finalizePayroll: () => dispatch({ type: "finalizePayroll" }),
    }),
    [state, meId],
  );

  return <HrContext.Provider value={value}>{children}</HrContext.Provider>;
}

export function useHr(): HrContextValue {
  const ctx = useContext(HrContext);
  if (!ctx) throw new Error("useHr must be used inside <HrProvider>");
  return ctx;
}
