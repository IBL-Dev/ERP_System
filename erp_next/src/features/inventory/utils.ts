import type { Tone } from "@/components/ui/StatusBadge";
import type {
  AdjustmentReason,
  Movement,
  MovementKind,
  MovementStage,
  StockItem,
  StockStatus,
} from "./types";

/** Mock "today" so server and browser render the same dates. Use the real date once data comes from an API. */
export const AS_OF = "2026-11-16";
export const EXPIRY_WARNING_DAYS = 30;

export const STOCK_STATUSES: StockStatus[] = ["available", "reserved", "damaged", "inTransit"];

export const STATUS_META: Record<StockStatus, { label: string; tone: Tone; bar: string }> = {
  available: { label: "Available", tone: "success", bar: "bg-success" },
  reserved: { label: "Reserved", tone: "info", bar: "bg-info" },
  damaged: { label: "Damaged", tone: "danger", bar: "bg-danger" },
  inTransit: { label: "In transit", tone: "warning", bar: "bg-warning" },
};

export type StockLevel = "ok" | "low" | "out";

export const LEVEL_META: Record<StockLevel, { label: string; tone: Tone }> = {
  ok: { label: "In stock", tone: "success" },
  low: { label: "Low stock", tone: "warning" },
  out: { label: "Out of stock", tone: "danger" },
};

export const MOVEMENT_STAGES: Record<MovementKind, MovementStage[]> = {
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

export const sumStatus = (items: StockItem[], status: StockStatus) =>
  items.reduce((total, item) => total + item.qty[status], 0);

export const totalQty = (item: StockItem) =>
  STOCK_STATUSES.reduce((total, status) => total + item.qty[status], 0);

export function stockLevel(item: StockItem): StockLevel {
  if (item.qty.available <= 0) return "out";
  if (item.qty.available <= item.minStock) return "low";
  return "ok";
}

export function nextStage(movement: Movement): MovementStage | null {
  const stages = MOVEMENT_STAGES[movement.kind];
  return stages[stages.indexOf(movement.stage) + 1] ?? null;
}

export function daysUntil(isoDate: string, asOf: string = AS_OF): number {
  const ms = Date.parse(`${isoDate}T00:00:00Z`) - Date.parse(`${asOf}T00:00:00Z`);
  return Math.round(ms / 86_400_000);
}

export type ExpiryState = "none" | "expired" | "soon" | "ok";

export function expiryState(isoDate: string | null): ExpiryState {
  if (!isoDate) return "none";
  const days = daysUntil(isoDate);
  if (days < 0) return "expired";
  if (days <= EXPIRY_WARNING_DAYS) return "soon";
  return "ok";
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return `${String(day).padStart(2, "0")} ${MONTHS[month - 1]} ${year}`;
}

/** Only used for records created after hydration (e.g. posted adjustments). */
export function formatDateTime(isoTimestamp: string): string {
  return new Date(isoTimestamp).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

export const formatNumber = (n: number) => n.toLocaleString("en-US");
