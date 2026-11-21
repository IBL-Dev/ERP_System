import type { SalesAction, SalesState } from "@/common/type";

export function salesReducer(state: SalesState, action: SalesAction): SalesState {
  switch (action.type) {
    case "addCustomer":
      return { ...state, customers: [...state.customers, action.customer] };

    case "logCommunication":
      return { ...state, communications: [action.entry, ...state.communications] };

    case "createQuote":
      return { ...state, quotes: [action.quote, ...state.quotes] };

    case "sendQuote":
      return {
        ...state,
        quotes: state.quotes.map((q) => (q.id === action.id && q.status === "draft" ? { ...q, status: "sent" } : q)),
      };

    case "decideQuote":
      return {
        ...state,
        quotes: state.quotes.map((q) => (q.id === action.id && q.status === "sent" ? { ...q, status: action.decision } : q)),
      };

    case "placeOrder":
      return {
        ...state,
        orders: [action.order, ...state.orders],
        quotes: state.quotes.map((q) =>
          q.id === action.order.quoteId && q.status === "approved" ? { ...q, status: "converted", orderId: action.order.id } : q,
        ),
        handoffs: [action.notice, ...state.handoffs],
      };

    case "requestInvoice":
      return {
        ...state,
        invoices: [action.invoice, ...state.invoices],
        orders: state.orders.map((o) => (o.id === action.invoice.orderId ? { ...o, invoiceId: action.invoice.id } : o)),
      };

    case "issueInvoice":
      return {
        ...state,
        invoices: state.invoices.map((i) =>
          i.id === action.id && i.status === "requested" ? { ...i, status: "issued", issuedOn: action.issuedOn, dueOn: action.dueOn } : i,
        ),
      };

    case "markPaid":
      return {
        ...state,
        invoices: state.invoices.map((i) => (i.id === action.id && i.status === "issued" ? { ...i, status: "paid", paidAmount: i.amount } : i)),
      };
  }
}
