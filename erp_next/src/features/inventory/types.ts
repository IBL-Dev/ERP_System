export type StockStatus = "available" | "reserved" | "damaged" | "inTransit";

export type StockItem = {
  sku: string;
  name: string;
  uom: string;
  location: string;
  qty: Record<StockStatus, number>;
  /** Minimum safety stock: alert when available drops to this level or below. */
  minStock: number;
  reorderQty: number;
};

/** A serial-numbered unit, or a lot/batch that carries an expiry date. */
export type TrackedUnit = {
  id: string;
  kind: "serial" | "lot";
  sku: string;
  qty: number;
  receivedOn: string; // YYYY-MM-DD
  expiryDate: string | null; // YYYY-MM-DD
  status: StockStatus;
};

export type MovementKind = "inbound" | "outbound";
export type MovementStage = "in-transit" | "received" | "open" | "picked" | "packed" | "shipped";

export type Movement = {
  id: string;
  kind: MovementKind;
  ref: string;
  sku: string;
  qty: number;
  stage: MovementStage;
};

export type AdjustmentReason = "cycle-count" | "lost" | "found" | "damaged";

export type Adjustment = {
  id: string;
  sku: string;
  systemQty: number;
  countedQty: number;
  variance: number;
  reason: AdjustmentReason;
  at: string; // ISO timestamp
};

export type InventoryState = {
  items: StockItem[];
  movements: Movement[];
  adjustments: Adjustment[];
};
