"use client";

import { createContext, useContext, useMemo, useReducer, type ReactNode } from "react";
import { INITIAL_STATE, UNITS } from "@/common/const/mock/inventory.mock";
import type { InventoryContextValue } from "@/common/type";
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

