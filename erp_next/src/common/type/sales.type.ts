import type { MovementStage, StockItem } from "./inventory.type";

export type CustomerTier = "standard" | "silver" | "gold";

export type Customer = {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  address: string;
  tier: CustomerTier;
  accountManager: string;
  paymentTermsDays: number;
  customerSince: string;
};

/** Quantity break: from `minQty` units the unit price is `unitPrice`. */
export type PriceBreak = { minQty: number; unitPrice: number };

/** Price snapshot taken when the quote is built. `discountPct` is the customer tier discount. */
export type QuoteLine = { sku: string; qty: number; unitPrice: number; discountPct: number };

export type QuoteStatus = "draft" | "sent" | "approved" | "rejected" | "converted";

export type Quote = {
  id: string;
  customerId: string;
  createdOn: string;
  validUntil: string;
  status: QuoteStatus;
  lines: QuoteLine[];
  orderId: string | null;
};

export type SalesOrder = {
  id: string;
  customerId: string;
  quoteId: string | null;
  placedOn: string;
  lines: QuoteLine[];
  /** Inventory goods-flow documents created for this order. */
  movementIds: string[];
  invoiceId: string | null;
};

export type FulfillmentStage = Extract<MovementStage, "open" | "picked" | "packed" | "shipped">;

export type HandoffNotice = {
  id: string;
  orderId: string;
  team: string;
  message: string;
  at: string; // YYYY-MM-DD
};

export type CommunicationType = "call" | "email" | "meeting" | "note";

export type CommunicationLog = {
  id: string;
  customerId: string;
  type: CommunicationType;
  summary: string;
  by: string;
  at: string; // YYYY-MM-DD
};

export type InvoiceStatus = "requested" | "issued" | "paid";
export type InvoiceDisplayStatus = "requested" | "issued" | "overdue" | "paid";

export type Invoice = {
  id: string;
  orderId: string;
  customerId: string;
  amount: number;
  requestedOn: string;
  issuedOn: string | null;
  dueOn: string | null;
  paidAmount: number;
  /** Each payment received, so the ledger can post them on the right date. */
  payments: { date: string; amount: number }[];
  status: InvoiceStatus;
};

export type SalesState = {
  customers: Customer[];
  quotes: Quote[];
  orders: SalesOrder[];
  handoffs: HandoffNotice[];
  communications: CommunicationLog[];
  invoices: Invoice[];
};

/** One line of a stock check against live inventory. */
export type AvailabilityLine = {
  sku: string;
  qty: number;
  available: number;
  inTransit: number;
  ok: boolean;
  shortBy: number;
};

export type ConvertResult =
  | { ok: true; orderId: string }
  | { ok: false; reason: "status" | "stock"; shortages: AvailabilityLine[] };

// ---- screen filters ----
export type QuoteFilter = QuoteStatus | "all";
export type CustomerTierFilter = CustomerTier | "all";
export type OrderFilter = "all" | "to-ship" | "shipped";
export type InvoiceFilter = InvoiceDisplayStatus | "all";

// ---- provider API ----
export type NewCustomer = {
  name: string;
  contact: string;
  email: string;
  phone: string;
  tier: CustomerTier;
  paymentTermsDays: number;
};

export type NewQuote = {
  customerId: string;
  lines: { sku: string; qty: number }[];
  send: boolean;
};

export type SalesAction =
  | { type: "addCustomer"; customer: Customer }
  | { type: "logCommunication"; entry: CommunicationLog }
  | { type: "createQuote"; quote: Quote }
  | { type: "sendQuote"; id: string }
  | { type: "decideQuote"; id: string; decision: "approved" | "rejected" }
  | { type: "placeOrder"; order: SalesOrder; notice: HandoffNotice }
  | { type: "requestInvoice"; invoice: Invoice }
  | { type: "issueInvoice"; id: string; issuedOn: string; dueOn: string }
  | { type: "recordPayment"; id: string; amount: number; date: string };

export type SalesContextValue = SalesState & {
  customersById: Record<string, Customer>;
  quotesById: Record<string, Quote>;
  ordersById: Record<string, SalesOrder>;
  addCustomer: (input: NewCustomer) => string;
  logCommunication: (customerId: string, type: CommunicationType, summary: string) => void;
  createQuote: (input: NewQuote) => string;
  sendQuote: (id: string) => void;
  decideQuote: (id: string, decision: "approved" | "rejected") => void;
  /** Checks live stock, reserves it, creates the shipping documents and notifies Inventory. */
  convertQuote: (id: string) => ConvertResult;
  /** Asks Finance to invoice a shipped order. */
  signalFinance: (orderId: string) => void;
  /** Finance issues the invoice for a request from Sales. */
  issueInvoice: (id: string) => void;
  /** Finance records money received. The invoice becomes paid once the balance reaches zero. */
  recordPayment: (id: string, amount: number) => void;
};

export type ItemsBySku = Record<string, StockItem>;
