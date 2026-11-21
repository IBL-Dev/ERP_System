import type { InventoryAction, InventoryState, Movement, MovementStage, StockItem } from "@/common/type";
import { nextStage } from "./utils";

/** Stock effect of moving a document into `stage`. Pick and pack do not change quantities. */
function applyStage(items: StockItem[], movement: Movement, stage: MovementStage): StockItem[] {
  return items.map((item) => {
    if (item.sku !== movement.sku) return item;
    const qty = { ...item.qty };
    if (movement.kind === "inbound" && stage === "received") {
      qty.inTransit = Math.max(0, qty.inTransit - movement.qty);
      qty.available += movement.qty;
    }
    if (movement.kind === "outbound" && stage === "shipped") {
      qty.reserved = Math.max(0, qty.reserved - movement.qty);
    }
    return { ...item, qty };
  });
}

function advanceOne(state: InventoryState, id: string): InventoryState {
  const movement = state.movements.find((m) => m.id === id);
  const stage = movement ? nextStage(movement) : null;
  if (!movement || !stage) return state;
  return {
    ...state,
    items: applyStage(state.items, movement, stage),
    movements: state.movements.map((m) => (m.id === id ? { ...m, stage } : m)),
  };
}

export function inventoryReducer(state: InventoryState, action: InventoryAction): InventoryState {
  switch (action.type) {
    case "advance":
      return advanceOne(state, action.id);

    case "advanceAll":
      return state.movements.reduce((acc, m) => advanceOne(acc, m.id), state);

    case "postCount": {
      const item = state.items.find((i) => i.sku === action.sku);
      if (!item) return state;
      const variance = action.countedQty - item.qty.available;
      if (variance === 0) return state;

      const qty = { ...item.qty, available: action.countedQty };
      // Missing stock written off as damaged is moved to the damaged bucket, not lost.
      if (action.reason === "damaged" && variance < 0) qty.damaged += -variance;

      return {
        ...state,
        items: state.items.map((i) => (i.sku === action.sku ? { ...i, qty } : i)),
        adjustments: [
          {
            id: `ADJ-${String(state.adjustments.length + 1).padStart(4, "0")}`,
            sku: action.sku,
            systemQty: item.qty.available,
            countedQty: action.countedQty,
            variance,
            reason: action.reason,
            at: action.at,
          },
          ...state.adjustments,
        ],
      };
    }

    case "createShipments": {
      const items = state.items.map((item) => {
        const needed = action.movements.filter((m) => m.sku === item.sku).reduce((t, m) => t + m.qty, 0);
        if (!needed) return item;
        return { ...item, qty: { ...item.qty, available: item.qty.available - needed, reserved: item.qty.reserved + needed } };
      });
      // Never reserve stock that is not there.
      if (items.some((i) => i.qty.available < 0)) return state;
      return { ...state, items, movements: [...action.movements, ...state.movements] };
    }

    case "setThresholds":
      return {
        ...state,
        items: state.items.map((i) =>
          i.sku === action.sku
            ? { ...i, minStock: Math.max(0, action.minStock), reorderQty: Math.max(0, action.reorderQty) }
            : i,
        ),
      };
  }
}
