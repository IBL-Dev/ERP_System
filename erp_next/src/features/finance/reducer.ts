import type { FinanceAction, FinanceState } from "@/common/type";

const EVENT_FOR_STATUS = { maintenance: "serviced", "in-service": "returned" } as const;

export function financeReducer(state: FinanceState, action: FinanceAction): FinanceState {
  switch (action.type) {
    case "addAccount":
      return { ...state, accounts: [...state.accounts, action.account].sort((a, b) => a.code.localeCompare(b.code)) };

    case "setAccountActive":
      return { ...state, accounts: state.accounts.map((a) => (a.code === action.code ? { ...a, active: action.active } : a)) };

    case "post":
      return { ...state, journal: [action.entry, ...state.journal] };

    case "decideVendorInvoice":
      return { ...state, apSteps: { ...state.apSteps, [action.noteId]: { decision: action.decision, decidedBy: action.byId, scheduledOn: null } } };

    case "scheduleVendorPayment": {
      const step = state.apSteps[action.noteId];
      if (!step || step.decision !== "approved") return state;
      return { ...state, apSteps: { ...state.apSteps, [action.noteId]: { ...step, scheduledOn: action.date } } };
    }

    case "addReceipt":
      return { ...state, receipts: [action.receipt, ...state.receipts] };

    case "addAsset":
      return { ...state, assets: [...state.assets, action.asset] };

    case "applyDepreciation":
      return {
        ...state,
        assets: state.assets.map((a) => {
          const amount = action.amounts[a.id];
          return amount ? { ...a, accumulated: Math.round((a.accumulated + amount) * 100) / 100, depreciatedThrough: action.period } : a;
        }),
      };

    case "setAssetStatus":
      return {
        ...state,
        assets: state.assets.map((a) =>
          a.id === action.id && a.status !== "disposed" && action.status !== "disposed"
            ? { ...a, status: action.status, events: [...a.events, { date: action.date, type: EVENT_FOR_STATUS[action.status], note: action.note }] }
            : a,
        ),
      };

    case "recordValuation":
      return {
        ...state,
        assets: state.assets.map((a) =>
          a.id === action.id
            ? {
                ...a,
                valuations: [action.valuation, ...a.valuations],
                events: [...a.events, { date: action.valuation.date, type: "revalued", note: `Valued at ${action.valuation.amount.toLocaleString("en-US")}` }],
              }
            : a,
        ),
      };

    case "disposeAsset":
      return {
        ...state,
        assets: state.assets.map((a) =>
          a.id === action.id && a.status !== "disposed"
            ? {
                ...a,
                status: "disposed",
                disposedOn: action.date,
                proceeds: action.proceeds,
                events: [...a.events, { date: action.date, type: "disposed", note: `Sold for ${action.proceeds.toLocaleString("en-US")}` }],
              }
            : a,
        ),
      };

    case "setBudget":
      return { ...state, budgets: state.budgets.map((b) => (b.id === action.id ? { ...b, annual: action.annual } : b)) };

    case "addBudgetLine":
      return { ...state, budgets: [...state.budgets, action.line] };
  }
}
