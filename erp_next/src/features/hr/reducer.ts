import type { AttendanceRecord, Goal, HrAction, HrState } from "@/common/type";
import { approverOf, progressFromTasks } from "./utils";

/** Goals with a to-do list always take their percentage from it. */
function withProgress(goal: Goal): Goal {
  const progress = progressFromTasks(goal.tasks);
  return progress === null ? goal : { ...goal, progress };
}

const changeGoal = (state: HrState, id: string, change: (g: Goal) => Goal): HrState => ({
  ...state,
  goals: state.goals.map((g) => (g.id === id ? withProgress(change(g)) : g)),
});

export function hrReducer(state: HrState, action: HrAction): HrState {
  switch (action.type) {
    case "addEmployee":
      return { ...state, employees: [...state.employees, action.employee] };

    case "updateEmployee":
      return { ...state, employees: state.employees.map((e) => (e.id === action.id ? { ...e, ...action.patch } : e)) };

    case "saveAttendance": {
      const exists = state.attendance.some((r) => r.employeeId === action.record.employeeId && r.date === action.record.date);
      return exists
        ? {
            ...state,
            attendance: state.attendance.map((r) => (r.employeeId === action.record.employeeId && r.date === action.record.date ? action.record : r)),
          }
        : { ...state, attendance: [action.record, ...state.attendance] };
    }

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
      return { ...state, goals: [withProgress(action.goal), ...state.goals] };

    case "setGoalProgress":
      // A goal with a to-do list keeps its automatic percentage.
      return {
        ...state,
        goals: state.goals.map((g) =>
          g.id === action.id && g.tasks.length === 0 ? { ...g, progress: Math.min(100, Math.max(0, action.progress)) } : g,
        ),
      };

    case "toggleGoalTask":
      return changeGoal(state, action.goalId, (g) => ({ ...g, tasks: g.tasks.map((t) => (t.id === action.taskId ? { ...t, done: !t.done } : t)) }));

    case "addGoalTask":
      return changeGoal(state, action.goalId, (g) => ({ ...g, tasks: [...g.tasks, action.task] }));

    case "removeGoalTask":
      return changeGoal(state, action.goalId, (g) => ({ ...g, tasks: g.tasks.filter((t) => t.id !== action.taskId) }));

    case "addGoalComment":
      return changeGoal(state, action.goalId, (g) => ({ ...g, comments: [action.comment, ...g.comments] }));

    case "addReviewComment":
      return {
        ...state,
        reviews: state.reviews.map((rv) => (rv.id === action.reviewId ? { ...rv, comments: [action.comment, ...rv.comments] } : rv)),
      };

    case "addTraining":
      return { ...state, training: [action.training, ...state.training] };

    case "updateTraining":
      return { ...state, training: state.training.map((t) => (t.id === action.id ? { ...t, ...action.patch } : t)) };

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
