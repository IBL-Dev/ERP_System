"use client";

import { createContext, useContext, useMemo, useReducer, type ReactNode } from "react";
import { INITIAL_STATE, UNITS } from "./mock-data";
import { inventoryReducer } from "./reducer";
import type { AdjustmentReason, InventoryState, StockItem, TrackedUnit } from "./types";
import { nextStage } from "./utils";

type InventoryContextValue = InventoryState & {
  units: TrackedUnit[];
  itemsBySku: Record<string, StockItem>;
  advance: (id: string) => void;
  /** Moves every open document one step. Returns how many were moved. */
  advanceAll: () => number;
  postCount: (input: { sku: string; countedQty: number; reason: AdjustmentReason }) => void;
  setThresholds: (sku: string, minStock: number, reorderQty: number) => void;
};

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

