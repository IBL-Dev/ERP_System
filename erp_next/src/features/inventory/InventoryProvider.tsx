"use client";

import { createContext, useContext, useMemo, useReducer, type ReactNode } from "react";
import { INITIAL_STATE, UNITS } from "@/common/const/mock/inventory.mock";
import type { InventoryContextValue, Movement } from "@/common/type";
import { inventoryReducer } from "./reducer";
import { nextStage } from "./utils";

const InventoryContext = createContext<InventoryContextValue | null>(null);

/**
 * Holds inventory state for every /inventory screen, so a posted movement or count
 * shows up everywhere at once. Swap the reducer for API calls / live updates later.
 */
export function InventoryProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(inventoryReducer, INITIAL_STATE);

  const value = useMemo<InventoryContextValue>(
    () => ({
      ...state,
      units: UNITS,
      itemsBySku: Object.fromEntries(state.items.map((i) => [i.sku, i])),
      advance: (id) => dispatch({ type: "advance", id }),
      advanceAll: () => {
        const count = state.movements.filter((m) => nextStage(m) !== null).length;
        dispatch({ type: "advanceAll" });
        return count;
      },
      postCount: (input) => dispatch({ type: "postCount", ...input, at: new Date().toISOString() }),
      setThresholds: (sku, minStock, reorderQty) => dispatch({ type: "setThresholds", sku, minStock, reorderQty }),
      expectGoods: (poId, lines) => {
        const movements: Movement[] = lines.map((l, i) => ({
          id: `GR-${poId.split("-")[1]}-${i + 1}`,
          kind: "inbound",
          ref: poId,
          sku: l.sku,
          qty: l.qty,
          stage: "in-transit",
        }));
        dispatch({ type: "createReceipts", movements });
        return movements.map((m) => m.id);
      },
      reserveForOrder: (orderId, lines) => {
        const needed = new Map<string, number>();
        for (const l of lines) needed.set(l.sku, (needed.get(l.sku) ?? 0) + l.qty);
        const short = [...needed].some(([sku, qty]) => (state.items.find((i) => i.sku === sku)?.qty.available ?? 0) < qty);
        if (short || lines.length === 0) return null;

        const movements: Movement[] = lines.map((l, i) => ({
          id: `${orderId}-${i + 1}`,
          kind: "outbound",
          ref: orderId,
          sku: l.sku,
          qty: l.qty,
          stage: "open",
        }));
        dispatch({ type: "createShipments", movements });
        return movements.map((m) => m.id);
      },
    }),
    [state],
  );

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
}

export function useInventory(): InventoryContextValue {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error("useInventory must be used inside <InventoryProvider>");
  return ctx;
}

