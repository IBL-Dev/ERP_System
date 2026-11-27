import type {
  ContractStatus,
  PaymentNoteDisplayStatus,
  PurchaseOrderDisplayStatus,
  PurchaseOrderFilter,
  RequisitionFilter,
  RequisitionStatus,
  SelectOption,
  SupplierFilter,
  SupplierStatus,
  ToneMeta,
} from "../type";

export const FINANCE_TEAM = "Finance";

/** Requisitions above this value need the Supplier department head, not just the requester's department head. */
export const REQUISITION_APPROVAL_LIMIT = 5000;

/** Requester name used when a requisition is raised from the low-stock list. */
export const LOW_STOCK_REQUESTER = "Low-stock alert (system)";

export const CONTRACT_EXPIRY_WARNING_DAYS = 60;

/** An invoice up to this much above the expected value still counts as price-compliant. */
export const PRICE_TOLERANCE_PCT = 0.5;

/** Targets for the performance scorecard, in percent. */
export const PERFORMANCE_TARGETS = { onTimePct: 95, accuracyPct: 98, pricingPct: 95 } as const;

/** A score within this many points below target is "close" (amber); further below is red. */
export const PERFORMANCE_CLOSE_MARGIN = 10;

export const SUPPLIER_STATUS_META: Record<SupplierStatus, ToneMeta> = {
  active: { label: "Active", tone: "success" },
  "on-hold": { label: "On hold", tone: "warning" },
};

export const SUPPLIER_FILTERS: readonly SelectOption<SupplierFilter>[] = [
  { value: "all", label: "All suppliers" },
  { value: "active", label: "Active" },
  { value: "on-hold", label: "On hold" },
];

export const CONTRACT_STATUS_META: Record<ContractStatus, ToneMeta> = {
  active: { label: "Active", tone: "success" },
  expiring: { label: "Expiring soon", tone: "warning" },
  expired: { label: "Expired", tone: "danger" },
};

export const REQUISITION_STATUS_META: Record<RequisitionStatus, ToneMeta> = {
  pending: { label: "Awaiting approval", tone: "warning" },
  approved: { label: "Approved", tone: "success" },
  rejected: { label: "Rejected", tone: "danger" },
  ordered: { label: "Converted to PO", tone: "info" },
};

export const REQUISITION_FILTERS: readonly SelectOption<RequisitionFilter>[] = [
  { value: "all", label: "All requisitions" },
  { value: "pending", label: "Awaiting approval" },
  { value: "approved", label: "Approved" },
  { value: "ordered", label: "Converted to PO" },
  { value: "rejected", label: "Rejected" },
];

export const PO_STATUS_META: Record<PurchaseOrderDisplayStatus, ToneMeta> = {
  "on-the-way": { label: "On the way", tone: "info" },
  arrived: { label: "Arrived, confirm receipt", tone: "warning" },
  closed: { label: "Closed", tone: "success" },
};

export const PO_FILTERS: readonly SelectOption<PurchaseOrderFilter>[] = [
  { value: "all", label: "All orders" },
  { value: "on-the-way", label: "On the way" },
  { value: "arrived", label: "Arrived, confirm receipt" },
  { value: "closed", label: "Closed" },
];

export const PAYMENT_NOTE_STATUS_META: Record<PaymentNoteDisplayStatus, ToneMeta> = {
  sent: { label: "Sent to Finance", tone: "warning" },
  overdue: { label: "Overdue", tone: "danger" },
  paid: { label: "Paid", tone: "success" },
};
