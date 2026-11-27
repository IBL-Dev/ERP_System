"use client";

import { createContext, useContext, useMemo, useReducer, type ReactNode } from "react";
import { DEMO_TODAY, LOW_STOCK_REQUESTER } from "@/common/const";
import { INITIAL_STATE } from "@/common/const/mock/supplier.mock";
import type { PurchaseOrder, ReorderResult, Requisition, SupplierContextValue } from "@/common/type";
import { useInventory } from "@/features/inventory/InventoryProvider";
import { getSession } from "@/features/session/session";
import { addDays } from "@/lib/date";
import { supplierReducer } from "./reducer";
import { arrivalOf, contractStatus, currentContract, nextNumber, offersFor, poTotal, round2 } from "./utils";

const SupplierContext = createContext<SupplierContextValue | null>(null);

/**
 * Holds Supplier state for every /supplier screen. It reads stock from the Inventory provider and tells
 * Inventory to expect goods when a purchase order is issued; it sees the goods arrive when Inventory receives them.
 * Swap the reducer for API calls later.
 */
export function SupplierProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(supplierReducer, INITIAL_STATE);
  const inventory = useInventory();
  const meId = getSession().employeeId;

  const value = useMemo<SupplierContextValue>(() => {
    const suppliersById = Object.fromEntries(state.suppliers.map((s) => [s.id, s]));

    const createOrder: SupplierContextValue["createOrder"] = ({ supplierId, lines, requisitionId }) => {
      const supplier = suppliersById[supplierId];
      const contract = currentContract(supplierId, state.contracts);
      if (!supplier || supplier.status !== "active" || !contract || contractStatus(contract) === "expired" || lines.length === 0) return null;

      const priced = lines.map((l) => ({ ...l, unitPrice: contract.prices[l.sku] }));
      if (priced.some((l) => l.unitPrice === undefined || l.qty < 1)) return null;

      const id = `PO-${nextNumber(state.orders.map((o) => o.id), 4500)}`;
      const movementIds = inventory.expectGoods(id, lines);
      const order: PurchaseOrder = {
        id,
        supplierId,
        createdOn: DEMO_TODAY,
        expectedOn: addDays(DEMO_TODAY, supplier.leadTimeDays),
        lines: priced,
        requisitionId: requisitionId ?? null,
        movementIds,
        status: "issued",
        paymentNoteId: null,
      };
      dispatch({ type: "createOrder", order });
      return id;
    };

    return {
      ...state,
      suppliersById,
      meId,

      addSupplier: (input) => {
        const id = `S-${String(nextNumber(state.suppliers.map((s) => s.id), 0)).padStart(3, "0")}`;
        dispatch({
          type: "addSupplier",
          supplier: { ...input, id, address: "-", status: "active", supplierSince: DEMO_TODAY },
          contract: {
            id: `SC-${String(nextNumber(state.contracts.map((c) => c.id), 0)).padStart(3, "0")}`,
            supplierId: id,
            title: "Supply agreement",
            start: DEMO_TODAY,
            end: addDays(DEMO_TODAY, 365),
            terms: "To be agreed.",
            prices: {},
          },
        });
        return id;
      },

      setSupplierStatus: (id, status) => dispatch({ type: "setSupplierStatus", id, status }),
      setContractPrice: (contractId, sku, price) => dispatch({ type: "setContractPrice", contractId, sku, price }),

      renewContract: (contractId) => {
        const contract = state.contracts.find((c) => c.id === contractId);
        if (!contract) return;
        // Extend by a year from the later of today and the current end date.
        const from = contract.end > DEMO_TODAY ? contract.end : DEMO_TODAY;
        dispatch({ type: "renewContract", contractId, end: addDays(from, 365) });
      },

      requestReorder: (sku): ReorderResult => {
        const item = inventory.itemsBySku[sku];
        const open = state.requisitions.some((r) => r.sku === sku && (r.status === "pending" || r.status === "approved"));
        if (open) return { ok: false, reason: "already-requested" };
        const offer = offersFor(sku, state.suppliers, state.contracts)[0];
        if (!item || !offer) return { ok: false, reason: "no-supplier" };

        const requisition: Requisition = {
          id: `PR-${nextNumber(state.requisitions.map((r) => r.id), 1000)}`,
          requestedBy: LOW_STOCK_REQUESTER,
          requesterId: null,
          department: "inventory",
          sku,
          qty: item.reorderQty,
          supplierId: offer.supplier.id,
          unitPrice: offer.price,
          createdOn: DEMO_TODAY,
          reason: "Stock at or below safety level",
          status: "pending",
          decidedBy: null,
          poId: null,
        };
        dispatch({ type: "createRequisition", requisition });
        return { ok: true, id: requisition.id };
      },

      decideRequisition: (id, decision) => dispatch({ type: "decideRequisition", id, decision, byId: meId }),

      createOrder,

      confirmReceipt: (poId, { acceptedQty, invoiceAmount }) => {
        const po = state.orders.find((o) => o.id === poId);
        if (!po || po.status !== "issued" || arrivalOf(po, inventory.movements) !== "arrived") return;
        const supplier = suppliersById[po.supplierId];
        const ordered = po.lines.reduce((t, l) => t + l.qty, 0);
        const accepted = Math.min(Math.max(acceptedQty, 0), ordered);

        dispatch({
          type: "confirmReceipt",
          poId,
          delivery: {
            id: `D-${poId.split("-")[1]}`,
            poId,
            supplierId: po.supplierId,
            orderedOn: po.createdOn,
            promisedOn: po.expectedOn,
            receivedOn: DEMO_TODAY,
            orderedQty: ordered,
            receivedQty: accepted,
            expectedValue: round2((poTotal(po) * accepted) / ordered),
            invoicedValue: invoiceAmount,
          },
          note: {
            id: `PN-${nextNumber(state.paymentNotes.map((n) => n.id), 8000)}`,
            poId,
            supplierId: po.supplierId,
            amount: invoiceAmount,
            sentOn: DEMO_TODAY,
            dueOn: addDays(DEMO_TODAY, supplier?.paymentTermsDays ?? 30),
            paidOn: null,
            status: "sent",
          },
        });
      },

      markNotePaid: (id) => dispatch({ type: "markNotePaid", id, paidOn: DEMO_TODAY }),
    };
  }, [state, inventory, meId]);

  return <SupplierContext.Provider value={value}>{children}</SupplierContext.Provider>;
}

export function useSupplier(): SupplierContextValue {
  const ctx = useContext(SupplierContext);
  if (!ctx) throw new Error("useSupplier must be used inside <SupplierProvider>");
  return ctx;
}
