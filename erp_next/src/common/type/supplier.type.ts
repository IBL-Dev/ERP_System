import type { Department } from "./hr.type";
import type { StockItem } from "./inventory.type";
import type { Tone } from "./ui.type";

export type SupplierStatus = "active" | "on-hold";

export type Supplier = {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  address: string;
  category: string;
  paymentTermsDays: number;
  /** Agreed delivery time in days. */
  leadTimeDays: number;
  status: SupplierStatus;
  supplierSince: string;
};

/** Agreement with a supplier, including the agreed unit price per SKU. */
export type SupplierContract = {
  id: string;
  supplierId: string;
  title: string;
  start: string;
  end: string;
  terms: string;
  prices: Record<string, number>;
};

export type ContractStatus = "active" | "expiring" | "expired";

export type RequisitionStatus = "pending" | "approved" | "rejected" | "ordered";

/** Purchase requisition (PR): an internal request to buy something. */
export type Requisition = {
  id: string;
  requestedBy: string;
  /** Employee id of the requester, or null when raised by the low-stock alert. */
  requesterId: string | null;
  department: Department;
  sku: string;
  qty: number;
  supplierId: string;
  unitPrice: number;
  createdOn: string;
  reason: string;
  status: RequisitionStatus;
  decidedBy: string | null;
  poId: string | null;
};

export type PoLine = { sku: string; qty: number; unitPrice: number };

export type PurchaseOrder = {
  id: string;
  supplierId: string;
  createdOn: string;
  expectedOn: string;
  lines: PoLine[];
  requisitionId: string | null;
  /** Inventory goods-receipt documents created for this PO. */
  movementIds: string[];
  /** "closed" once the warehouse receipt is confirmed and the payment note is sent. */
  status: "issued" | "closed";
  paymentNoteId: string | null;
};

export type PurchaseOrderDisplayStatus = "on-the-way" | "arrived" | "closed";

/** What actually happened on a delivery. Performance figures are worked out from these. */
export type DeliveryRecord = {
  id: string;
  poId: string;
  supplierId: string;
  orderedOn: string;
  promisedOn: string;
  receivedOn: string;
  orderedQty: number;
  receivedQty: number;
  expectedValue: number;
  invoicedValue: number;
};

export type PaymentNoteStatus = "sent" | "paid";
export type PaymentNoteDisplayStatus = "sent" | "overdue" | "paid";

/** Note to Finance asking it to pay a supplier. */
export type PaymentNote = {
  id: string;
  poId: string;
  supplierId: string;
  amount: number;
  sentOn: string;
  dueOn: string;
  paidOn: string | null;
  status: PaymentNoteStatus;
};

export type SupplierMetrics = {
  deliveries: number;
  onTimePct: number | null;
  avgLeadDays: number | null;
  accuracyPct: number | null;
  pricingPct: number | null;
};

export type SupplierOffer = { supplier: Supplier; price: number };

export type SupplierState = {
  suppliers: Supplier[];
  contracts: SupplierContract[];
  requisitions: Requisition[];
  orders: PurchaseOrder[];
  deliveries: DeliveryRecord[];
  paymentNotes: PaymentNote[];
};

export type ReorderSuggestion = {
  item: StockItem;
  offer: SupplierOffer | null;
  suggestedQty: number;
  openRequisition: Requisition | undefined;
};

// ---- screen filters ----
export type SupplierFilter = SupplierStatus | "all";
export type RequisitionFilter = RequisitionStatus | "all";
export type PurchaseOrderFilter = PurchaseOrderDisplayStatus | "all";

export type MetricTone = Exclude<Tone, "neutral" | "info">;

// ---- provider API ----
export type NewSupplier = {
  name: string;
  contact: string;
  email: string;
  phone: string;
  category: string;
  paymentTermsDays: number;
  leadTimeDays: number;
};

export type NewPurchaseOrder = {
  supplierId: string;
  lines: { sku: string; qty: number }[];
  requisitionId?: string;
};

export type ReorderResult =
  | { ok: true; id: string }
  | { ok: false; reason: "no-supplier" | "already-requested" };

export type ReceiptInput = { acceptedQty: number; invoiceAmount: number };

export type SupplierAction =
  | { type: "addSupplier"; supplier: Supplier; contract: SupplierContract }
  | { type: "setSupplierStatus"; id: string; status: SupplierStatus }
  | { type: "setContractPrice"; contractId: string; sku: string; price: number }
  | { type: "renewContract"; contractId: string; end: string }
  | { type: "createRequisition"; requisition: Requisition }
  | { type: "decideRequisition"; id: string; decision: "approved" | "rejected"; byId: string }
  | { type: "createOrder"; order: PurchaseOrder }
  | { type: "confirmReceipt"; poId: string; delivery: DeliveryRecord; note: PaymentNote }
  | { type: "markNotePaid"; id: string; paidOn: string };

export type SupplierContextValue = SupplierState & {
  suppliersById: Record<string, Supplier>;
  /** The signed-in user's employee id (for approvals). */
  meId: string;
  addSupplier: (input: NewSupplier) => string;
  setSupplierStatus: (id: string, status: SupplierStatus) => void;
  setContractPrice: (contractId: string, sku: string, price: number) => void;
  renewContract: (contractId: string) => void;
  /** Raises a requisition for a low-stock item, using the cheapest active contract price. */
  requestReorder: (sku: string) => ReorderResult;
  decideRequisition: (id: string, decision: "approved" | "rejected") => void;
  /** Issues a PO at contract prices and tells Inventory to expect the goods. Returns the PO id, or null. */
  createOrder: (input: NewPurchaseOrder) => string | null;
  /** Confirms the goods that arrived, records the delivery and sends a payment note to Finance. */
  confirmReceipt: (poId: string, input: ReceiptInput) => void;
  /** Finance pays the supplier for a payment note. */
  markNotePaid: (id: string) => void;
};
