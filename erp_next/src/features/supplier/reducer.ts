import type { SupplierAction, SupplierState } from "@/common/type";
import { canApprove } from "./utils";

export function supplierReducer(state: SupplierState, action: SupplierAction): SupplierState {
  switch (action.type) {
    case "addSupplier":
      return { ...state, suppliers: [...state.suppliers, action.supplier], contracts: [...state.contracts, action.contract] };

    case "setSupplierStatus":
      return { ...state, suppliers: state.suppliers.map((s) => (s.id === action.id ? { ...s, status: action.status } : s)) };

    case "setContractPrice":
      return {
        ...state,
        contracts: state.contracts.map((c) =>
          c.id === action.contractId ? { ...c, prices: { ...c.prices, [action.sku]: action.price } } : c,
        ),
      };

    case "renewContract":
      return { ...state, contracts: state.contracts.map((c) => (c.id === action.contractId ? { ...c, end: action.end } : c)) };

    case "createRequisition":
      return { ...state, requisitions: [action.requisition, ...state.requisitions] };

    case "decideRequisition": {
      // Approval control: only the responsible approver may decide, never the requester.
      const req = state.requisitions.find((r) => r.id === action.id);
      if (!req || !canApprove(req, action.byId)) return state;
      return {
        ...state,
        requisitions: state.requisitions.map((r) => (r.id === action.id ? { ...r, status: action.decision, decidedBy: action.byId } : r)),
      };
    }

    case "createOrder":
      return {
        ...state,
        orders: [action.order, ...state.orders],
        requisitions: state.requisitions.map((r) =>
          r.id === action.order.requisitionId ? { ...r, status: "ordered", poId: action.order.id } : r,
        ),
      };

    case "confirmReceipt":
      return {
        ...state,
        orders: state.orders.map((o) => (o.id === action.poId ? { ...o, status: "closed", paymentNoteId: action.note.id } : o)),
        deliveries: [action.delivery, ...state.deliveries],
        paymentNotes: [action.note, ...state.paymentNotes],
      };

    case "markNotePaid":
      return {
        ...state,
        paymentNotes: state.paymentNotes.map((n) => (n.id === action.id && n.status === "sent" ? { ...n, status: "paid", paidOn: action.paidOn } : n)),
      };
  }
}
