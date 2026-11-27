"use client";

import { createContext, useContext, useMemo, useReducer, type ReactNode } from "react";
import { DEMO_TODAY } from "@/common/const";
import { INITIAL_STATE } from "@/common/const/mock/hr.mock";
import type { Employee, HrContextValue, LeaveRequest } from "@/common/type";
import { getSession } from "@/features/session/session";
import { addDays, toMinutes } from "@/lib/date";
import { nextNumber } from "@/lib/ids";
import { hrReducer } from "./reducer";
import { countWorkingDays, subordinateIds } from "./utils";

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
  const { employeeId: meId, name: meName } = getSession();

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
          managerId: input.managerId,
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

      updateEmployee: (id, patch) => {
        if (patch.managerId !== undefined && patch.managerId !== null) {
          if (patch.managerId === id) return "An employee cannot report to themselves.";
          if (subordinateIds(state.employees, id).includes(patch.managerId)) {
            return "That person already reports to this employee, directly or through someone else.";
          }
        }
        if (patch.contract?.end && patch.contract.end < patch.contract.start) return "The contract end date must be after its start date.";
        dispatch({ type: "updateEmployee", id, patch });
        return null;
      },

      saveAttendance: (input) => {
        if (!input.absent) {
          if (!input.clockIn) return "Enter the clock in time.";
          if (input.clockOut && toMinutes(input.clockOut) <= toMinutes(input.clockIn)) return "Clock out must be after clock in.";
        }
        const existing = state.attendance.find((r) => r.employeeId === input.employeeId && r.date === input.date);
        dispatch({
          type: "saveAttendance",
          record: {
            id: existing?.id ?? `AT-${input.employeeId.slice(4)}-${input.date}`,
            employeeId: input.employeeId,
            date: input.date,
            shift: input.shift,
            clockIn: input.absent ? null : input.clockIn,
            clockOut: input.absent ? null : input.clockOut,
            ...(input.absent ? { absent: true } : {}),
            ...(input.note.trim() ? { note: input.note.trim() } : {}),
            ...(!input.absent && input.overtimeMinutes !== null ? { overtimeMinutes: input.overtimeMinutes } : {}),
          },
        });
        return null;
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

      addGoal: ({ employeeId, title, due, tasks }) =>
        dispatch({
          type: "addGoal",
          goal: {
            id: `G-${String(nextNumber(state.goals.map((g) => g.id), 0)).padStart(3, "0")}`,
            employeeId,
            title,
            due,
            progress: 0,
            tasks: tasks.map((text, i) => ({ id: `T${i + 1}`, text, done: false })),
            comments: [],
          },
        }),
      setGoalProgress: (id, progress) => dispatch({ type: "setGoalProgress", id, progress }),
      toggleGoalTask: (goalId, taskId) => dispatch({ type: "toggleGoalTask", goalId, taskId }),
      addGoalTask: (goalId, text) => {
        const goal = state.goals.find((g) => g.id === goalId);
        const id = `T${nextNumber((goal?.tasks ?? []).map((t) => `T-${t.id.slice(1)}`), 0)}`;
        dispatch({ type: "addGoalTask", goalId, task: { id, text, done: false } });
      },
      removeGoalTask: (goalId, taskId) => dispatch({ type: "removeGoalTask", goalId, taskId }),
      addGoalComment: (goalId, text) => {
        const goal = state.goals.find((g) => g.id === goalId);
        const id = `C${nextNumber((goal?.comments ?? []).map((c) => `C-${c.id.slice(1)}`), 0)}`;
        dispatch({ type: "addGoalComment", goalId, comment: { id, by: meName, at: DEMO_TODAY, text } });
      },
      advanceReview: (id, rating) => dispatch({ type: "advanceReview", id, rating }),
      addReviewComment: (reviewId, text) => {
        const review = state.reviews.find((r) => r.id === reviewId);
        const id = `C${nextNumber((review?.comments ?? []).map((c) => `C-${c.id.slice(1)}`), 0)}`;
        dispatch({ type: "addReviewComment", reviewId, comment: { id, by: meName, at: DEMO_TODAY, text } });
      },
      completeTraining: (id) => dispatch({ type: "completeTraining", id, date: DEMO_TODAY }),
      addTraining: (input) =>
        dispatch({
          type: "addTraining",
          training: { id: `T-${String(nextNumber(state.training.map((t) => t.id), 0)).padStart(3, "0")}`, ...input, completedOn: null },
        }),
      updateTraining: (id, patch) => dispatch({ type: "updateTraining", id, patch }),
      finalizePayroll: () => dispatch({ type: "finalizePayroll" }),
    }),
    [state, meId, meName],
  );

  return <HrContext.Provider value={value}>{children}</HrContext.Provider>;
}

export function useHr(): HrContextValue {
  const ctx = useContext(HrContext);
  if (!ctx) throw new Error("useHr must be used inside <HrProvider>");
  return ctx;
}
