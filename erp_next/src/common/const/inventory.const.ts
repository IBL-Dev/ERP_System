import type {
  AdjustmentReason,
  LifecycleFilter,
  MovementKind,
  MovementStage,
  SelectOption,
  StockLevel,
  StockLevelFilter,
  StockStatus,
  ToneMeta,
} from "../type";

export const EXPIRY_WARNING_DAYS = 30;

export const STOCK_STATUSES: readonly StockStatus[] = ["available", "reserved", "damaged", "inTransit"];

export const STATUS_META: Record<StockStatus, ToneMeta> = {
  available: { label: "Available", tone: "success" },
  reserved: { label: "Reserved", tone: "info" },
  damaged: { label: "Damaged", tone: "danger" },
  inTransit: { label: "In transit", tone: "warning" },
};

export const LEVEL_META: Record<StockLevel, ToneMeta> = {
  ok: { label: "In stock", tone: "success" },
  low: { label: "Low stock", tone: "warning" },
  out: { label: "Out of stock", tone: "danger" },
};

export const MOVEMENT_STAGES: Record<MovementKind, readonly MovementStage[]> = {
  inbound: ["in-transit", "received"],
  outbound: ["open", "picked", "packed", "shipped"],
};

export const STAGE_LABEL: Record<MovementStage, string> = {
  "in-transit": "In transit",
  received: "Goods received",
  open: "Open (reserved)",
  picked: "Picked",
  packed: "Packed",
  shipped: "Shipped",
};

/** Button text for moving a document INTO this stage. */
export const STAGE_ACTION: Record<MovementStage, string> = {
  "in-transit": "",
  received: "Receive goods",
  open: "",
  picked: "Confirm pick",
  packed: "Confirm pack",
  shipped: "Ship order",
};

export const REASON_LABEL: Record<AdjustmentReason, string> = {
  "cycle-count": "Cycle count correction",
  lost: "Lost or missing",
  found: "Found stock",
  damaged: "Damaged",
};

export const REASON_OPTIONS: readonly SelectOption<AdjustmentReason>[] = (
  Object.keys(REASON_LABEL) as AdjustmentReason[]
).map((value) => ({ value, label: REASON_LABEL[value] }));

export const STOCK_LEVEL_FILTERS: readonly SelectOption<StockLevelFilter>[] = [
  { value: "all", label: "All items" },
  { value: "alerts", label: "Low or out of stock" },
  { value: "out", label: "Out of stock" },
];

export const LIFECYCLE_FILTERS: readonly SelectOption<LifecycleFilter>[] = [
  { value: "all", label: "All tracked units" },
  { value: "serial", label: "Serial numbers" },
  { value: "lot", label: "Lots with expiry" },
  { value: "soon", label: "Expiring soon" },
  { value: "expired", label: "Expired" },
];
