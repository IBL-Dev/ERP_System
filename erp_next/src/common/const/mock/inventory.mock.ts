import type { InventoryState, TrackedUnit } from "../../type";

// Mock data. Replace with an API service later; the rest of the feature only reads InventoryState.
export const INITIAL_STATE: InventoryState = {
  items: [
    { sku: "BC-2000", name: "Wireless barcode scanner", uom: "pcs", location: "A-01", qty: { available: 42, reserved: 8, damaged: 2, inTransit: 20 }, minStock: 25, reorderQty: 50 },
    { sku: "LP-1400", name: "Laptop 14 inch", uom: "pcs", location: "A-02", qty: { available: 18, reserved: 6, damaged: 1, inTransit: 0 }, minStock: 20, reorderQty: 30 },
    { sku: "LB-100", name: "Thermal label roll 100x150", uom: "rolls", location: "B-04", qty: { available: 640, reserved: 120, damaged: 0, inTransit: 400 }, minStock: 300, reorderQty: 500 },
    { sku: "CT-4030", name: "Carton 40x30x30 cm", uom: "pcs", location: "B-07", qty: { available: 1250, reserved: 200, damaged: 35, inTransit: 0 }, minStock: 800, reorderQty: 2000 },
    { sku: "WF-500", name: "Pallet wrap film 500 mm", uom: "rolls", location: "B-09", qty: { available: 14, reserved: 4, damaged: 0, inTransit: 0 }, minStock: 30, reorderQty: 60 },
    { sku: "HS-500", name: "Hand sanitizer 500 ml", uom: "bottles", location: "C-02", qty: { available: 210, reserved: 40, damaged: 0, inTransit: 100 }, minStock: 150, reorderQty: 300 },
    { sku: "PB-24", name: "Protein bars, box of 24", uom: "boxes", location: "C-05", qty: { available: 0, reserved: 0, damaged: 3, inTransit: 80 }, minStock: 40, reorderQty: 120 },
    { sku: "SG-L", name: "Safety gloves, size L", uom: "pairs", location: "D-01", qty: { available: 320, reserved: 60, damaged: 10, inTransit: 0 }, minStock: 200, reorderQty: 400 },
    { sku: "FL-48", name: "Forklift battery 48 V", uom: "pcs", location: "D-03", qty: { available: 3, reserved: 1, damaged: 0, inTransit: 2 }, minStock: 2, reorderQty: 2 },
  ],
  movements: [
    { id: "GR-5001", kind: "inbound", ref: "PO-4501", sku: "BC-2000", qty: 20, stage: "in-transit" },
    { id: "GR-5002", kind: "inbound", ref: "PO-4502", sku: "LB-100", qty: 400, stage: "in-transit" },
    { id: "GR-5003", kind: "inbound", ref: "PO-4503", sku: "HS-500", qty: 100, stage: "in-transit" },
    { id: "GR-5004", kind: "inbound", ref: "PO-4504", sku: "PB-24", qty: 80, stage: "in-transit" },
    { id: "GR-5005", kind: "inbound", ref: "PO-4505", sku: "FL-48", qty: 2, stage: "in-transit" },
    { id: "GR-4990", kind: "inbound", ref: "PO-4490", sku: "SG-L", qty: 200, stage: "received" },
    { id: "SO-7001", kind: "outbound", ref: "Order 7001", sku: "BC-2000", qty: 8, stage: "open" },
    { id: "SO-7002", kind: "outbound", ref: "Order 7002", sku: "LP-1400", qty: 6, stage: "picked" },
    { id: "SO-7003", kind: "outbound", ref: "Order 7003", sku: "LB-100", qty: 120, stage: "packed" },
    { id: "SO-7004", kind: "outbound", ref: "Order 7004", sku: "CT-4030", qty: 200, stage: "open" },
    { id: "SO-7005", kind: "outbound", ref: "Order 7005", sku: "WF-500", qty: 4, stage: "picked" },
    { id: "SO-7006", kind: "outbound", ref: "Order 7006", sku: "HS-500", qty: 40, stage: "packed" },
    { id: "SO-7007", kind: "outbound", ref: "Order 7007", sku: "SG-L", qty: 60, stage: "open" },
    { id: "SO-7008", kind: "outbound", ref: "Order 7008", sku: "FL-48", qty: 1, stage: "open" },
    { id: "SO-6990", kind: "outbound", ref: "Order 6990", sku: "LP-1400", qty: 4, stage: "shipped" },
  ],
  adjustments: [],
};

export const UNITS: TrackedUnit[] = [
  { id: "SN-BC-100231", kind: "serial", sku: "BC-2000", qty: 1, receivedOn: "2026-08-12", expiryDate: null, status: "available" },
  { id: "SN-BC-100232", kind: "serial", sku: "BC-2000", qty: 1, receivedOn: "2026-08-12", expiryDate: null, status: "available" },
  { id: "SN-BC-100233", kind: "serial", sku: "BC-2000", qty: 1, receivedOn: "2026-08-12", expiryDate: null, status: "reserved" },
  { id: "SN-BC-100234", kind: "serial", sku: "BC-2000", qty: 1, receivedOn: "2026-08-12", expiryDate: null, status: "damaged" },
  { id: "SN-LP-554101", kind: "serial", sku: "LP-1400", qty: 1, receivedOn: "2026-09-03", expiryDate: null, status: "available" },
  { id: "SN-LP-554102", kind: "serial", sku: "LP-1400", qty: 1, receivedOn: "2026-09-03", expiryDate: null, status: "reserved" },
  { id: "SN-LP-554103", kind: "serial", sku: "LP-1400", qty: 1, receivedOn: "2026-09-03", expiryDate: null, status: "damaged" },
  { id: "SN-FL-9001", kind: "serial", sku: "FL-48", qty: 1, receivedOn: "2026-05-20", expiryDate: null, status: "available" },
  { id: "SN-FL-9002", kind: "serial", sku: "FL-48", qty: 1, receivedOn: "2026-05-20", expiryDate: null, status: "reserved" },
  { id: "LOT-HS-2511", kind: "lot", sku: "HS-500", qty: 100, receivedOn: "2026-05-04", expiryDate: "2026-12-05", status: "available" },
  { id: "LOT-HS-2608", kind: "lot", sku: "HS-500", qty: 110, receivedOn: "2026-09-18", expiryDate: "2027-08-31", status: "available" },
  { id: "LOT-HS-2509", kind: "lot", sku: "HS-500", qty: 40, receivedOn: "2026-07-22", expiryDate: "2027-03-15", status: "reserved" },
  { id: "LOT-PB-2510", kind: "lot", sku: "PB-24", qty: 3, receivedOn: "2026-04-10", expiryDate: "2026-10-30", status: "damaged" },
];
