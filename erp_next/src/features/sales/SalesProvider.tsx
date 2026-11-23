"use client";

import { createContext, useContext, useMemo, useReducer, type ReactNode } from "react";
import { DEMO_TODAY, FULFILLMENT_TEAM, QUOTE_VALIDITY_DAYS } from "@/common/const";
import { INITIAL_STATE } from "@/common/const/mock/sales.mock";
import type { ConvertResult, Customer, Invoice, Quote, SalesContextValue, SalesOrder } from "@/common/type";
import { useInventory } from "@/features/inventory/InventoryProvider";
import { getSession } from "@/features/session/session";
import { addDays } from "@/lib/date";
import { buildQuoteLine, linesTotal } from "@/lib/pricing";
import { salesReducer } from "./reducer";
import { checkAvailability, nextNumber } from "./utils";

const SalesContext = createContext<SalesContextValue | null>(null);

/**
 * Holds Sales state for every /sales screen. It reads live stock from the Inventory provider and,
 * when an order is placed, reserves stock and creates the shipping documents there.
 * Swap the reducer for API calls later.
 */
export function SalesProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(salesReducer, INITIAL_STATE);
  const inventory = useInventory();
  const userName = getSession().name;

  const value = useMemo<SalesContextValue>(() => {
    const customersById = Object.fromEntries(state.customers.map((c) => [c.id, c])) as Record<string, Customer>;

    return {
      ...state,
      customersById,
      quotesById: Object.fromEntries(state.quotes.map((q) => [q.id, q])),
      ordersById: Object.fromEntries(state.orders.map((o) => [o.id, o])),

      addCustomer: (input) => {
        const id = `C-${String(nextNumber(state.customers.map((c) => c.id), 0)).padStart(3, "0")}`;
        dispatch({
          type: "addCustomer",
          customer: { ...input, id, address: "-", accountManager: userName, customerSince: DEMO_TODAY },
        });
        return id;
      },

      logCommunication: (customerId, type, summary) =>
        dispatch({
          type: "logCommunication",
          entry: { id: `CL-${state.communications.length + 1}`, customerId, type, summary, by: userName, at: DEMO_TODAY },
        }),

      createQuote: ({ customerId, lines, send }) => {
        const tier = customersById[customerId]?.tier ?? "standard";
        const quote: Quote = {
          id: `Q-${nextNumber(state.quotes.map((q) => q.id), 2000)}`,
          customerId,
          createdOn: DEMO_TODAY,
          validUntil: addDays(DEMO_TODAY, QUOTE_VALIDITY_DAYS),
          status: send ? "sent" : "draft",
          lines: lines.map((l) => buildQuoteLine(l.sku, l.qty, tier)),
          orderId: null,
        };
        dispatch({ type: "createQuote", quote });
        return quote.id;
      },

      sendQuote: (id) => dispatch({ type: "sendQuote", id }),
      decideQuote: (id, decision) => dispatch({ type: "decideQuote", id, decision }),

      convertQuote: (id): ConvertResult => {
        const quote = state.quotes.find((q) => q.id === id);
        if (!quote || quote.status !== "approved") return { ok: false, reason: "status", shortages: [] };

        // 1. Check live stock.
        const shortages = checkAvailability(quote.lines, inventory.itemsBySku).filter((l) => !l.ok);
        if (shortages.length) return { ok: false, reason: "stock", shortages };

        // 2. Hand off to Inventory: reserve stock and create the shipping documents.
        const orderId = `SO-${nextNumber(state.orders.map((o) => o.id), 7000)}`;
        const movementIds = inventory.reserveForOrder(orderId, quote.lines);
        if (!movementIds) return { ok: false, reason: "stock", shortages: [] };

        // 3. Record the order and the notification.
        const units = quote.lines.reduce((t, l) => t + l.qty, 0);
        const order: SalesOrder = {
          id: orderId,
          customerId: quote.customerId,
          quoteId: quote.id,
          placedOn: DEMO_TODAY,
          lines: quote.lines,
          movementIds,
          invoiceId: null,
        };
        dispatch({
          type: "placeOrder",
          order,
          notice: {
            id: `H-${state.handoffs.length + 1}`,
            orderId,
            team: FULFILLMENT_TEAM,
            message: `${FULFILLMENT_TEAM} team notified to pick, pack and ship ${orderId} (${quote.lines.length} line${quote.lines.length === 1 ? "" : "s"}, ${units} units).`,
            at: DEMO_TODAY,
          },
        });
        return { ok: true, orderId };
      },

      signalFinance: (orderId) => {
        const order = state.orders.find((o) => o.id === orderId);
        if (!order || order.invoiceId) return;
        const invoice: Invoice = {
          id: `I-${nextNumber(state.invoices.map((i) => i.id), 9000)}`,
          orderId,
          customerId: order.customerId,
          amount: linesTotal(order.lines),
          requestedOn: DEMO_TODAY,
          issuedOn: null,
          dueOn: null,
          paidAmount: 0,
          payments: [],
          status: "requested",
        };
        dispatch({ type: "requestInvoice", invoice });
      },

      issueInvoice: (id) => {
        const invoice = state.invoices.find((i) => i.id === id);
        const terms = invoice ? (customersById[invoice.customerId]?.paymentTermsDays ?? 30) : 30;
        dispatch({ type: "issueInvoice", id, issuedOn: DEMO_TODAY, dueOn: addDays(DEMO_TODAY, terms) });
      },

      recordPayment: (id, amount) => dispatch({ type: "recordPayment", id, amount, date: DEMO_TODAY }),
    };
  }, [state, inventory, userName]);

  return <SalesContext.Provider value={value}>{children}</SalesContext.Provider>;
}

export function useSales(): SalesContextValue {
  const ctx = useContext(SalesContext);
  if (!ctx) throw new Error("useSales must be used inside <SalesProvider>");
  return ctx;
}
