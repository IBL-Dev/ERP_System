import { DEMO_TODAY, FULFILLMENT_STAGES } from "@/common/const";
import type {
  AvailabilityLine,
  FulfillmentStage,
  Invoice,
  InvoiceDisplayStatus,
  ItemsBySku,
  Movement,
  QuoteLine,
  SalesOrder,
} from "@/common/type";

/** Checks quote/order lines against live stock. Lines for the same SKU are added together. */
export function checkAvailability(lines: QuoteLine[], itemsBySku: ItemsBySku): AvailabilityLine[] {
  const needed = new Map<string, number>();
  for (const l of lines) needed.set(l.sku, (needed.get(l.sku) ?? 0) + l.qty);

  return [...needed].map(([sku, qty]) => {
    const item = itemsBySku[sku];
    const available = item?.qty.available ?? 0;
    return {
      sku,
      qty,
      available,
      inTransit: item?.qty.inTransit ?? 0,
      ok: available >= qty,
      shortBy: Math.max(0, qty - available),
    };
  });
}

/** Where an order is in Inventory: the furthest-behind document decides. */
export function fulfillmentOf(order: SalesOrder, movements: Movement[]): FulfillmentStage {
  const ranks = order.movementIds
    .map((id) => movements.find((m) => m.id === id)?.stage)
    .map((stage) => FULFILLMENT_STAGES.indexOf(stage as FulfillmentStage))
    .filter((rank) => rank >= 0);
  return FULFILLMENT_STAGES[ranks.length ? Math.min(...ranks) : 0];
}

export const invoiceBalance = (inv: Invoice) => Math.max(0, inv.amount - inv.paidAmount);

export function invoiceDisplayStatus(inv: Invoice): InvoiceDisplayStatus {
  if (inv.status === "paid") return "paid";
  if (inv.status === "requested") return "requested";
  return inv.dueOn && inv.dueOn < DEMO_TODAY ? "overdue" : "issued";
}

/** Next id like Q-2017 or SO-7009: highest number already used, plus one. */
export function nextNumber(ids: string[], fallback: number): number {
  const numbers = ids.map((id) => Number(id.split("-")[1])).filter((n) => Number.isFinite(n));
  return Math.max(fallback, ...numbers) + 1;
}
