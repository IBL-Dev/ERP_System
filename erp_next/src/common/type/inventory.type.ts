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

export type StockLevel = "ok" | "low" | "out";
export type ExpiryState = "none" | "expired" | "soon" | "ok";

export type StockLevelFilter = "all" | "alerts" | "out";
export type LifecycleFilter = "all" | "serial" | "lot" | "soon" | "expired";

export type InventoryAction =
  | { type: "advance"; id: string }
  | { type: "advanceAll" }
  | { type: "postCount"; sku: string; countedQty: number; reason: AdjustmentReason; at: string }
  | { type: "setThresholds"; sku: string; minStock: number; reorderQty: number }
  | { type: "createShipments"; movements: Movement[] };

export type InventoryContextValue = InventoryState & {
  units: TrackedUnit[];
  itemsBySku: Record<string, StockItem>;
  advance: (id: string) => void;
  /** Moves every open document one step. Returns how many were moved. */
  advanceAll: () => number;
  postCount: (input: { sku: string; countedQty: number; reason: AdjustmentReason }) => void;
  setThresholds: (sku: string, minStock: number, reorderQty: number) => void;
  /**
   * Sales handoff: reserves stock and creates one outbound document per line (stage "open").
   * Returns the new document ids, or null (and changes nothing) if any line is short.
   */
  reserveForOrder: (orderId: string, lines: { sku: string; qty: number }[]) => string[] | null;
};
