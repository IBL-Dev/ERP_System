import { DEMO_TODAY, EXPIRY_WARNING_DAYS, MOVEMENT_STAGES, STOCK_STATUSES } from "@/common/const";
import type { ExpiryState, Movement, MovementStage, StockItem, StockLevel, StockStatus } from "@/common/type";
import { daysBetween } from "@/lib/date";

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

/** Days from the demo date until `isoDate` (negative once past). */
export const daysUntil = (isoDate: string) => daysBetween(DEMO_TODAY, isoDate);

export function expiryState(isoDate: string | null): ExpiryState {
  if (!isoDate) return "none";
  const days = daysUntil(isoDate);
  if (days < 0) return "expired";
  if (days <= EXPIRY_WARNING_DAYS) return "soon";
  return "ok";
}
