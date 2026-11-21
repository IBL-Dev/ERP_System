import type {
  CommunicationType,
  CustomerTier,
  CustomerTierFilter,
  FulfillmentStage,
  InvoiceDisplayStatus,
  InvoiceFilter,
  OrderFilter,
  PriceBreak,
  QuoteFilter,
  QuoteStatus,
  SelectOption,
  ToneMeta,
} from "../type";

/** Where Sales hands orders off to. */
export const FULFILLMENT_TEAM = "Inventory";

export const QUOTE_VALIDITY_DAYS = 30;

// ---------- pricing rules (sample values) ----------
/** Quantity price breaks per SKU, lowest quantity first. TODO: load from a price-list API. */
export const PRICE_LIST: Record<string, readonly PriceBreak[]> = {
  "BC-2000": [{ minQty: 1, unitPrice: 129 }, { minQty: 10, unitPrice: 119 }, { minQty: 50, unitPrice: 109 }],
  "LP-1400": [{ minQty: 1, unitPrice: 899 }, { minQty: 5, unitPrice: 859 }, { minQty: 20, unitPrice: 819 }],
  "LB-100": [{ minQty: 1, unitPrice: 6.5 }, { minQty: 100, unitPrice: 5.9 }, { minQty: 500, unitPrice: 5.2 }],
  "CT-4030": [{ minQty: 1, unitPrice: 1.2 }, { minQty: 500, unitPrice: 1.05 }, { minQty: 2000, unitPrice: 0.92 }],
  "WF-500": [{ minQty: 1, unitPrice: 14 }, { minQty: 20, unitPrice: 12.5 }, { minQty: 60, unitPrice: 11 }],
  "HS-500": [{ minQty: 1, unitPrice: 4.5 }, { minQty: 100, unitPrice: 3.9 }, { minQty: 300, unitPrice: 3.4 }],
  "PB-24": [{ minQty: 1, unitPrice: 32 }, { minQty: 40, unitPrice: 29 }, { minQty: 120, unitPrice: 26 }],
  "SG-L": [{ minQty: 1, unitPrice: 3.2 }, { minQty: 200, unitPrice: 2.8 }, { minQty: 400, unitPrice: 2.5 }],
  "FL-48": [{ minQty: 1, unitPrice: 640 }, { minQty: 2, unitPrice: 610 }, { minQty: 5, unitPrice: 580 }],
};

export const TIER_LABEL: Record<CustomerTier, string> = { standard: "Standard", silver: "Silver", gold: "Gold" };

/** Extra discount on top of the quantity price, by customer tier. */
export const TIER_DISCOUNT_PCT: Record<CustomerTier, number> = { standard: 0, silver: 5, gold: 10 };

const TIERS = Object.keys(TIER_LABEL) as CustomerTier[];

export const TIER_OPTIONS: readonly SelectOption<CustomerTier>[] = TIERS.map((value) => ({
  value,
  label: `${TIER_LABEL[value]} (${TIER_DISCOUNT_PCT[value]}% discount)`,
}));

export const TIER_FILTERS: readonly SelectOption<CustomerTierFilter>[] = [
  { value: "all", label: "All tiers" },
  ...TIERS.map((value) => ({ value, label: TIER_LABEL[value] })),
];

// ---------- quotes ----------
export const QUOTE_STATUS_META: Record<QuoteStatus, ToneMeta> = {
  draft: { label: "Draft", tone: "neutral" },
  sent: { label: "Sent to customer", tone: "info" },
  approved: { label: "Approved", tone: "success" },
  rejected: { label: "Rejected", tone: "danger" },
  converted: { label: "Converted to order", tone: "success" },
};

export const QUOTE_FILTERS: readonly SelectOption<QuoteFilter>[] = [
  { value: "all", label: "All quotes" },
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent to customer" },
  { value: "approved", label: "Approved" },
  { value: "converted", label: "Converted to order" },
  { value: "rejected", label: "Rejected" },
];

// ---------- orders and fulfillment ----------
export const FULFILLMENT_STAGES: readonly FulfillmentStage[] = ["open", "picked", "packed", "shipped"];

export const FULFILLMENT_META: Record<FulfillmentStage, ToneMeta> = {
  open: { label: "Waiting to be picked", tone: "warning" },
  picked: { label: "Picked", tone: "info" },
  packed: { label: "Packed", tone: "info" },
  shipped: { label: "Shipped", tone: "success" },
};

export const ORDER_FILTERS: readonly SelectOption<OrderFilter>[] = [
  { value: "all", label: "All orders" },
  { value: "to-ship", label: "Still to ship" },
  { value: "shipped", label: "Shipped" },
];

// ---------- CRM ----------
export const COMMUNICATION_LABEL: Record<CommunicationType, string> = {
  call: "Call",
  email: "Email",
  meeting: "Meeting",
  note: "Note",
};

export const COMMUNICATION_OPTIONS: readonly SelectOption<CommunicationType>[] = (
  Object.keys(COMMUNICATION_LABEL) as CommunicationType[]
).map((value) => ({ value, label: COMMUNICATION_LABEL[value] }));

// ---------- billing ----------
export const INVOICE_STATUS_META: Record<InvoiceDisplayStatus, ToneMeta> = {
  requested: { label: "Sent to Finance", tone: "warning" },
  issued: { label: "Issued", tone: "info" },
  overdue: { label: "Overdue", tone: "danger" },
  paid: { label: "Paid", tone: "success" },
};

export const INVOICE_FILTERS: readonly SelectOption<InvoiceFilter>[] = [
  { value: "all", label: "All invoices" },
  { value: "requested", label: "Sent to Finance" },
  { value: "issued", label: "Issued" },
  { value: "overdue", label: "Overdue" },
  { value: "paid", label: "Paid" },
];
