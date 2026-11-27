import {
  CONTRACT_EXPIRY_WARNING_DAYS,
  DEMO_TODAY,
  DEPARTMENT_HEAD,
  PERFORMANCE_CLOSE_MARGIN,
  PRICE_TOLERANCE_PCT,
  REQUISITION_APPROVAL_LIMIT,
} from "@/common/const";
import type {
  ContractStatus,
  DeliveryRecord,
  Movement,
  PaymentNote,
  PaymentNoteDisplayStatus,
  PurchaseOrder,
  PurchaseOrderDisplayStatus,
  Requisition,
  ReorderSuggestion,
  StockItem,
  Supplier,
  SupplierContract,
  SupplierMetrics,
  SupplierOffer,
  Tone,
} from "@/common/type";
import { stockLevel } from "@/features/inventory/utils";
import { daysBetween } from "@/lib/date";

export { nextNumber } from "@/lib/ids";

const round1 = (n: number) => Math.round(n * 10) / 10;
export const round2 = (n: number) => Math.round(n * 100) / 100;

// ---------- contracts and offers ----------
export function contractStatus(contract: SupplierContract): ContractStatus {
  if (contract.end < DEMO_TODAY) return "expired";
  return daysBetween(DEMO_TODAY, contract.end) <= CONTRACT_EXPIRY_WARNING_DAYS ? "expiring" : "active";
}

/** Prices a supplier can be ordered from: active supplier, contract not expired. */
export function offersFor(sku: string, suppliers: Supplier[], contracts: SupplierContract[]): SupplierOffer[] {
  return suppliers
    .filter((s) => s.status === "active")
    .flatMap((supplier) => {
      const price = contracts
        .filter((c) => c.supplierId === supplier.id && contractStatus(c) !== "expired")
        .map((c) => c.prices[sku])
        .find((p) => p !== undefined);
      return price === undefined ? [] : [{ supplier, price }];
    })
    .sort((a, b) => a.price - b.price);
}

/** Contract that currently applies to a supplier (the one ending last). */
export const currentContract = (supplierId: string, contracts: SupplierContract[]) =>
  contracts.filter((c) => c.supplierId === supplierId).sort((a, b) => b.end.localeCompare(a.end))[0];

// ---------- requisitions and orders ----------
export const requisitionValue = (r: Requisition) => round2(r.qty * r.unitPrice);
export const poTotal = (po: PurchaseOrder) => round2(po.lines.reduce((t, l) => t + l.qty * l.unitPrice, 0));
export const poUnits = (po: PurchaseOrder) => po.lines.reduce((t, l) => t + l.qty, 0);

/** Who may approve: the requester's department head, or the Supplier head above the value limit. Never the requester. */
export function approverIdFor(r: Requisition): string {
  return requisitionValue(r) > REQUISITION_APPROVAL_LIMIT ? DEPARTMENT_HEAD.supplier : DEPARTMENT_HEAD[r.department];
}

export const canApprove = (r: Requisition, userId: string) =>
  r.status === "pending" && approverIdFor(r) === userId && r.requesterId !== userId;

/** On the way until every goods-receipt document in Inventory has been received. */
export function arrivalOf(po: PurchaseOrder, movements: Movement[]): "on-the-way" | "arrived" {
  const docs = po.movementIds.map((id) => movements.find((m) => m.id === id)).filter((m): m is Movement => Boolean(m));
  return docs.length > 0 && docs.every((m) => m.stage === "received") ? "arrived" : "on-the-way";
}

export function poDisplayStatus(po: PurchaseOrder, movements: Movement[]): PurchaseOrderDisplayStatus {
  return po.status === "closed" ? "closed" : arrivalOf(po, movements);
}

export const isLate = (po: PurchaseOrder, movements: Movement[]) =>
  poDisplayStatus(po, movements) === "on-the-way" && po.expectedOn < DEMO_TODAY;

export function noteDisplayStatus(note: PaymentNote): PaymentNoteDisplayStatus {
  if (note.status === "paid") return "paid";
  return note.dueOn < DEMO_TODAY ? "overdue" : "sent";
}

// ---------- low stock ----------
export function reorderSuggestions(
  items: StockItem[],
  suppliers: Supplier[],
  contracts: SupplierContract[],
  requisitions: Requisition[],
): ReorderSuggestion[] {
  return items
    .filter((item) => stockLevel(item) !== "ok")
    .map((item) => ({
      item,
      offer: offersFor(item.sku, suppliers, contracts)[0] ?? null,
      suggestedQty: item.reorderQty,
      openRequisition: requisitions.find((r) => r.sku === item.sku && (r.status === "pending" || r.status === "approved")),
    }))
    .sort((a, b) => a.item.qty.available - b.item.qty.available);
}

// ---------- performance ----------
/** Scorecard figures for any group of deliveries (one supplier, or all of them). */
export function deliveryMetrics(own: DeliveryRecord[]): SupplierMetrics {
  if (own.length === 0) return { deliveries: 0, onTimePct: null, avgLeadDays: null, accuracyPct: null, pricingPct: null };

  const onTime = own.filter((d) => d.receivedOn <= d.promisedOn).length;
  const ordered = own.reduce((t, d) => t + d.orderedQty, 0);
  const received = own.reduce((t, d) => t + Math.min(d.receivedQty, d.orderedQty), 0);
  const priceOk = own.filter((d) => d.invoicedValue <= d.expectedValue * (1 + PRICE_TOLERANCE_PCT / 100)).length;

  return {
    deliveries: own.length,
    onTimePct: round1((onTime / own.length) * 100),
    avgLeadDays: round1(own.reduce((t, d) => t + daysBetween(d.orderedOn, d.receivedOn), 0) / own.length),
    accuracyPct: round1((received / ordered) * 100),
    pricingPct: round1((priceOk / own.length) * 100),
  };
}

export const supplierMetrics = (supplierId: string, deliveries: DeliveryRecord[]) =>
  deliveryMetrics(deliveries.filter((d) => d.supplierId === supplierId));

/** Green at or above target, amber within the close margin, red below, neutral when there is no data. */
export function metricTone(value: number | null, target: number): Tone {
  if (value === null) return "neutral";
  if (value >= target) return "success";
  return value >= target - PERFORMANCE_CLOSE_MARGIN ? "warning" : "danger";
}
