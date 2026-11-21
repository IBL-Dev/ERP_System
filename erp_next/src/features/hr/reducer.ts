import type { AttendanceRecord, HrAction, HrState } from "@/common/type";
import { approverOf } from "./utils";

export function hrReducer(state: HrState, action: HrAction): HrState {
  switch (action.type) {
    case "addEmployee":
      return { ...state, employees: [...state.employees, action.employee] };

    case "recordSalaryChange":
      return {
        ...state,
        employees: state.employees.map((e) =>
          e.id === action.employeeId
            ? {
                ...e,
                salaryHistory: [
                  { effective: action.effective, amount: action.amount, reason: action.reason },
                  ...e.salaryHistory,
                ].sort((a, b) => b.effective.localeCompare(a.effective)),
              }
            : e,
        ),
      };

    case "clockIn": {
      const exists = state.attendance.some((r) => r.employeeId === action.employeeId && r.date === action.date);
      if (exists) return state;
      const record: AttendanceRecord = {
        id: `AT-${action.employeeId.slice(4)}-${action.date.slice(8)}`,
        employeeId: action.employeeId,
        date: action.date,
        shift: "day",
        clockIn: action.time,
        clockOut: null,
      };
      return { ...state, attendance: [record, ...state.attendance] };
    }

    case "clockOut":
      return {
        ...state,
        attendance: state.attendance.map((r) =>
          r.employeeId === action.employeeId && r.date === action.date && r.clockIn && !r.clockOut
            ? { ...r, clockOut: action.time }
            : r,
        ),
      };

    case "requestLeave":
      return { ...state, leave: [action.request, ...state.leave] };

    case "decideLeave": {
      // Approval control: only the responsible department head may decide, never on their own request.
      const request = state.leave.find((l) => l.id === action.id);
      const requester = state.employees.find((e) => e.id === request?.employeeId);
      if (!request || !requester || request.status !== "pending") return state;
      if (approverOf(requester) !== action.byId || request.employeeId === action.byId) return state;
      return {
        ...state,
        leave: state.leave.map((l) => (l.id === action.id ? { ...l, status: action.decision, decidedBy: action.byId } : l)),
      };
    }

    case "addGoal":
      return { ...state, goals: [action.goal, ...state.goals] };

    case "setGoalProgress":
      return {
        ...state,
        goals: state.goals.map((g) => (g.id === action.id ? { ...g, progress: Math.min(100, Math.max(0, action.progress)) } : g)),
      };

    case "advanceReview":
      return {
        ...state,
        reviews: state.reviews.map((r) => {
          if (r.id !== action.id) return r;
          if (r.stage === "self-review") return { ...r, stage: "manager-review" };
          if (r.stage === "manager-review" && action.rating) return { ...r, stage: "completed", rating: action.rating };
          return r;
        }),
      };

    case "completeTraining":
      return {
        ...state,
        training: state.training.map((t) => (t.id === action.id && !t.completedOn ? { ...t, completedOn: action.date } : t)),
      };

    case "finalizePayroll":
      return { ...state, payrollFinalized: true };
  }
}
