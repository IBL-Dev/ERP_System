import { addDays } from "@/lib/date";
import type {
  DeliveryRecord,
  PaymentNote,
  PurchaseOrder,
  Requisition,
  Supplier,
  SupplierContract,
  SupplierState,
} from "../../type";

// Mock data. Replace with an API service later; the rest of the feature only reads SupplierState.

const supplier = (
  n: number,
  name: string,
  contact: string,
  category: string,
  paymentTermsDays: number,
  leadTimeDays: number,
  supplierSince: string,
): Supplier => ({
  id: `S-${String(n).padStart(3, "0")}`,
  name,
  contact,
  email: `${contact.toLowerCase().replace(/[^a-z ]/g, "").replace(/ /g, ".")}@${name.toLowerCase().replace(/[^a-z]/g, "")}.example`,
  phone: `555-04${String(n).padStart(2, "0")}`,
  address: `${20 + n * 11} Industrial Park Road`,
  category,
  paymentTermsDays,
  leadTimeDays,
  status: "active",
  supplierSince,
});

const SUPPLIERS: Supplier[] = [
  supplier(1, "Zenith Electronics", "Kai Lindgren", "Electronics", 30, 14, "2021-02-10"),
  supplier(2, "Packwell Supplies", "Isla Moreno", "Packaging", 14, 7, "2020-08-24"),
  supplier(3, "PureCare Hygiene", "Dev Patel", "Hygiene and safety", 30, 10, "2022-05-16"),
  supplier(4, "NutriFresh Foods", "Camille Roy", "Food", 21, 12, "2023-01-09"),
  supplier(5, "PowerLift Industrial", "Bruno Keller", "Industrial equipment", 45, 21, "2021-11-01"),
];

const contract = (
  n: number,
  supplierId: string,
  title: string,
  start: string,
  end: string,
  terms: string,
  prices: Record<string, number>,
): SupplierContract => ({ id: `SC-${String(n).padStart(3, "0")}`, supplierId, title, start, end, terms, prices });

const CONTRACTS: SupplierContract[] = [
  contract(1, "S-001", "Annual supply agreement", "2026-04-01", "2027-03-31", "Prices fixed for the term. Delivery within 14 days. 30 days payment.", { "BC-2000": 82, "LP-1400": 690, "FL-48": 470 }),
  contract(2, "S-002", "Packaging supply agreement", "2026-02-01", "2027-01-31", "Volume rebate paid yearly. Delivery within 7 days. 14 days payment.", { "LB-100": 4.1, "CT-4030": 0.72, "WF-500": 9.8 }),
  contract(3, "S-003", "Hygiene and safety supply", "2025-12-11", "2026-12-10", "Delivery within 10 days. 30 days payment. Renewal to be agreed.", { "HS-500": 2.9, "SG-L": 2.1 }),
  contract(4, "S-004", "Food supply agreement", "2026-03-01", "2027-02-28", "Short shelf life: minimum 6 months remaining at delivery. 21 days payment.", { "PB-24": 21 }),
  contract(5, "S-005", "Industrial equipment agreement", "2025-11-01", "2026-10-31", "Delivery within 21 days. 45 days payment. Contract has ended.", { "FL-48": 455, "WF-500": 9.2, "SG-L": 2.2 }),
];

const supplierOf = (id: string) => SUPPLIERS.find((s) => s.id === id)!;
const priceOf = (supplierId: string, sku: string) => CONTRACTS.find((c) => c.supplierId === supplierId)!.prices[sku];
const round2 = (n: number) => Math.round(n * 100) / 100;

const ORDERS: PurchaseOrder[] = [];
const DELIVERIES: DeliveryRecord[] = [];
const NOTES: PaymentNote[] = [];

// ---------- orders still open: they match the goods-receipt documents already in the Inventory mock data ----------
// [PO number, supplier, sku, qty, created on, inventory document]
const OPEN_SEEDS: [number, string, string, number, string, string][] = [
  [4501, "S-001", "BC-2000", 20, "2026-11-02", "GR-5001"],
  [4502, "S-002", "LB-100", 400, "2026-11-05", "GR-5002"], // past its expected date
  [4503, "S-003", "HS-500", 100, "2026-11-09", "GR-5003"],
  [4504, "S-004", "PB-24", 80, "2026-11-06", "GR-5004"],
  [4505, "S-001", "FL-48", 2, "2026-11-10", "GR-5005"],
  [4490, "S-003", "SG-L", 200, "2026-11-04", "GR-4990"], // already received in the warehouse, receipt not confirmed yet
];

for (const [num, supplierId, sku, qty, createdOn, movementId] of OPEN_SEEDS) {
  ORDERS.push({
    id: `PO-${num}`,
    supplierId,
    createdOn,
    expectedOn: addDays(createdOn, supplierOf(supplierId).leadTimeDays),
    lines: [{ sku, qty, unitPrice: priceOf(supplierId, sku) }],
    requisitionId: null,
    movementIds: [movementId],
    status: "issued",
    paymentNoteId: null,
  });
}

// ---------- closed orders, with the delivery record and payment note that went with them ----------
// [PO number, supplier, sku, qty, ordered on, days promised, days taken, qty accepted, invoice / expected value, paid]
type Closed = [number, string, string, number, string, number, number, number, number, boolean];
const CLOSED_SEEDS: Closed[] = [
  [4401, "S-001", "BC-2000", 40, "2026-07-01", 14, 13, 40, 1.0, true],
  [4415, "S-001", "LP-1400", 20, "2026-08-05", 14, 18, 20, 1.0, true],
  [4430, "S-001", "BC-2000", 30, "2026-09-10", 14, 14, 28, 1.0, true],
  [4460, "S-001", "FL-48", 2, "2026-10-01", 14, 15, 2, 1.04, false],
  [4402, "S-002", "LB-100", 500, "2026-07-03", 7, 7, 500, 1.0, true],
  [4418, "S-002", "CT-4030", 2000, "2026-08-10", 7, 6, 2000, 1.0, true],
  [4435, "S-002", "WF-500", 60, "2026-09-12", 7, 7, 60, 1.0, true],
  [4465, "S-002", "LB-100", 400, "2026-10-15", 7, 9, 400, 1.0, false],
  [4405, "S-003", "HS-500", 300, "2026-07-08", 10, 10, 300, 1.0, true],
  [4421, "S-003", "SG-L", 400, "2026-08-12", 10, 11, 400, 1.0, true],
  [4440, "S-003", "HS-500", 200, "2026-09-20", 10, 9, 200, 1.0, true],
  [4410, "S-004", "PB-24", 100, "2026-07-15", 12, 12, 100, 1.0, true],
  [4428, "S-004", "PB-24", 120, "2026-08-25", 12, 15, 115, 1.0, true],
  [4450, "S-004", "PB-24", 80, "2026-09-25", 12, 12, 80, 1.02, true],
  [4408, "S-005", "FL-48", 3, "2026-06-20", 21, 22, 3, 1.0, true],
  [4425, "S-005", "WF-500", 80, "2026-08-18", 21, 20, 80, 1.0, true],
  [4452, "S-005", "SG-L", 300, "2026-09-28", 21, 24, 300, 1.06, true],
];

CLOSED_SEEDS.forEach(([num, supplierId, sku, qty, orderedOn, promised, taken, accepted, factor, paid], i) => {
  const price = priceOf(supplierId, sku);
  const promisedOn = addDays(orderedOn, promised);
  const receivedOn = addDays(orderedOn, taken);
  const expectedValue = round2(accepted * price);
  const noteId = `PN-${8001 + i}`;

  ORDERS.push({
    id: `PO-${num}`,
    supplierId,
    createdOn: orderedOn,
    expectedOn: promisedOn,
    lines: [{ sku, qty, unitPrice: price }],
    requisitionId: null,
    movementIds: [],
    status: "closed",
    paymentNoteId: noteId,
  });
  DELIVERIES.push({
    id: `D-${num}`,
    poId: `PO-${num}`,
    supplierId,
    orderedOn,
    promisedOn,
    receivedOn,
    orderedQty: qty,
    receivedQty: accepted,
    expectedValue,
    invoicedValue: round2(expectedValue * factor),
  });
  NOTES.push({
    id: noteId,
    poId: `PO-${num}`,
    supplierId,
    amount: round2(expectedValue * factor),
    sentOn: receivedOn,
    dueOn: addDays(receivedOn, supplierOf(supplierId).paymentTermsDays),
    paidOn: paid ? [addDays(receivedOn, 10), "2026-11-10"].sort()[0] : null,
    status: paid ? "paid" : "sent",
  });
});

ORDERS.sort((a, b) => b.createdOn.localeCompare(a.createdOn));

// ---------- purchase requisitions ----------
const requisition = (
  n: number,
  requestedBy: string,
  requesterId: string | null,
  sku: string,
  qty: number,
  supplierId: string,
  createdOn: string,
  reason: string,
  status: Requisition["status"],
  decidedBy: string | null,
  poId: string | null = null,
): Requisition => ({
  id: `PR-${1000 + n}`,
  requestedBy,
  requesterId,
  department: "inventory",
  sku,
  qty,
  supplierId,
  unitPrice: priceOf(supplierId, sku),
  createdOn,
  reason,
  status,
  decidedBy,
  poId,
});

const SYSTEM = "Low-stock alert (system)";

const REQUISITIONS: Requisition[] = [
  requisition(1, SYSTEM, null, "LP-1400", 30, "S-001", "2026-11-14", "Stock at or below safety level", "pending", null),
  requisition(2, "Tomas Alvarez", "EMP-1007", "WF-500", 60, "S-002", "2026-11-15", "Stock at or below safety level", "pending", null),
  requisition(3, "Aisha Rahman", "EMP-1008", "SG-L", 400, "S-003", "2026-11-10", "Gloves for the winter shift", "approved", "EMP-1004"),
  requisition(4, "Aisha Rahman", "EMP-1008", "CT-4030", 1000, "S-002", "2026-11-03", "Extra cartons", "rejected", "EMP-1004"),
  requisition(5, SYSTEM, null, "PB-24", 80, "S-004", "2026-11-05", "Stock at or below safety level", "ordered", "EMP-1004", "PO-4504"),
];
const linked = ORDERS.find((o) => o.id === "PO-4504");
if (linked) linked.requisitionId = "PR-1005";

export const INITIAL_STATE: SupplierState = {
  suppliers: SUPPLIERS,
  contracts: CONTRACTS,
  requisitions: REQUISITIONS,
  orders: ORDERS,
  deliveries: DELIVERIES,
  paymentNotes: NOTES.reverse(),
};
