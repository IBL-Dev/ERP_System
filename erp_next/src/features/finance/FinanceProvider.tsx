"use client";

import { createContext, useContext, useMemo, useReducer, type ReactNode } from "react";
import { ACCOUNT_CODES, DEMO_TODAY } from "@/common/const";
import { INITIAL_STATE } from "@/common/const/mock/finance.mock";
import type {
  FinanceContextValue,
  FixedAsset,
  JournalLine,
  JournalSource,
  PayResult,
} from "@/common/type";
import { getSession } from "@/features/session/session";
import { useSales } from "@/features/sales/SalesProvider";
import { useSupplier } from "@/features/supplier/SupplierProvider";
import { addMonths, endOfMonth } from "@/lib/date";
import { accumulatedThrough } from "@/lib/depreciation";
import { financeReducer } from "./reducer";
import {
  accountBalances,
  apStatus,
  canApproveNote,
  formatJournalId,
  nextNumber,
  round2,
} from "./utils";

const FinanceContext = createContext<FinanceContextValue | null>(null);

const debit = (account: string, amount: number): JournalLine => ({ account, debit: amount, credit: 0 });
const credit = (account: string, amount: number): JournalLine => ({ account, debit: 0, credit: amount });

/**
 * Holds Finance state and does the bookkeeping for the other departments:
 * it issues Sales invoices and records customer payments, approves and pays Supplier payment notes,
 * and posts every one of those to the general ledger. Swap the reducer for API calls later.
 */
export function FinanceProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(financeReducer, INITIAL_STATE);
  const sales = useSales();
  const supplier = useSupplier();
  const meId = getSession().employeeId;

  const value = useMemo<FinanceContextValue>(() => {
    const balances = accountBalances(state.journal);
    const bank = balances[ACCOUNT_CODES.bank]?.net ?? 0;

    // Several postings in one click must not share an id, so count up from the latest one.
    let nextEntry = nextNumber(state.journal.map((j) => j.id), 0);
    const post = (date: string, description: string, source: JournalSource, reference: string, lines: JournalLine[]) =>
      dispatch({ type: "post", entry: { id: formatJournalId(nextEntry++), date, description, source, reference, lines } });

    const payNote = (noteId: string, amount: number) => {
      supplier.markNotePaid(noteId);
      post(DEMO_TODAY, `Payment to supplier, ${noteId}`, "payables", `PAY ${noteId}`, [
        debit(ACCOUNT_CODES.payable, amount),
        credit(ACCOUNT_CODES.bank, amount),
      ]);
    };

    return {
      ...state,
      accountsByCode: Object.fromEntries(state.accounts.map((a) => [a.code, a])),
      balances,
      meId,

      // ---------- general ledger ----------
      addAccount: ({ code, name, type }) => {
        if (!/^\d{4}$/.test(code)) return "The account code must be 4 digits.";
        if (state.accounts.some((a) => a.code === code)) return `Account ${code} already exists.`;
        if (!name.trim()) return "Enter an account name.";
        dispatch({ type: "addAccount", account: { code, name: name.trim(), type, active: true } });
        return null;
      },
      setAccountActive: (code, active) => dispatch({ type: "setAccountActive", code, active }),
      postManualEntry: ({ date, description, debitAccount, creditAccount, amount }) =>
        post(date, description, "manual", "Manual entry", [debit(debitAccount, amount), credit(creditAccount, amount)]),

      // ---------- accounts payable ----------
      decideVendorInvoice: (noteId, decision) => {
        const note = supplier.paymentNotes.find((n) => n.id === noteId);
        // Approval control: only the responsible approver may decide.
        if (!note || !canApproveNote(note, state.apSteps, meId)) return;
        dispatch({ type: "decideVendorInvoice", noteId, decision, byId: meId });
        if (decision === "approved") {
          post(DEMO_TODAY, `Vendor invoice ${noteId} approved`, "payables", `PN ${noteId}`, [
            debit(ACCOUNT_CODES.inventory, note.amount),
            credit(ACCOUNT_CODES.payable, note.amount),
          ]);
        }
      },

      scheduleVendorPayment: (noteId, date) => dispatch({ type: "scheduleVendorPayment", noteId, date }),

      payVendor: (noteId): PayResult => {
        const note = supplier.paymentNotes.find((n) => n.id === noteId);
        const status = note ? apStatus(note, state.apSteps) : null;
        if (!note || (status !== "approved" && status !== "scheduled")) return { ok: false, reason: "status" };
        // Cash control: never pay more than the bank holds.
        if (note.amount > bank) return { ok: false, reason: "cash" };
        payNote(noteId, note.amount);
        return { ok: true };
      },

      runDuePayments: () => {
        const due = supplier.paymentNotes
          .filter((n) => {
            const step = state.apSteps[n.id];
            return n.status === "sent" && step?.decision === "approved" && step.scheduledOn !== null && step.scheduledOn <= DEMO_TODAY;
          })
          .sort((a, b) => (state.apSteps[a.id].scheduledOn ?? "").localeCompare(state.apSteps[b.id].scheduledOn ?? ""));

        let cash = bank;
        let paid = 0;
        let skipped = 0;
        for (const note of due) {
          if (note.amount <= cash) {
            payNote(note.id, note.amount);
            cash = round2(cash - note.amount);
            paid += 1;
          } else {
            skipped += 1;
          }
        }
        return { paid, skipped };
      },

      // ---------- accounts receivable ----------
      generateInvoice: (invoiceId) => {
        const invoice = sales.invoices.find((i) => i.id === invoiceId);
        if (!invoice || invoice.status !== "requested") return;
        sales.issueInvoice(invoiceId);
        post(DEMO_TODAY, `Invoice ${invoiceId} issued`, "receivables", `INV ${invoiceId}`, [
          debit(ACCOUNT_CODES.receivable, invoice.amount),
          credit(ACCOUNT_CODES.sales, invoice.amount),
        ]);
      },

      recordPayment: (invoiceId, amount, method) => {
        const invoice = sales.invoices.find((i) => i.id === invoiceId);
        if (!invoice || invoice.status !== "issued") return;
        const received = Math.min(amount, round2(invoice.amount - invoice.paidAmount));
        if (received <= 0) return;

        sales.recordPayment(invoiceId, received);
        dispatch({
          type: "addReceipt",
          receipt: {
            id: `RC-${nextNumber(state.receipts.map((r) => r.id), 6000)}`,
            invoiceId,
            customerId: invoice.customerId,
            amount: received,
            receivedOn: DEMO_TODAY,
            method,
          },
        });
        post(DEMO_TODAY, `Payment received for ${invoiceId}`, "receivables", `RCT ${invoiceId}`, [
          debit(ACCOUNT_CODES.bank, received),
          credit(ACCOUNT_CODES.receivable, received),
        ]);
      },

      // ---------- fixed assets ----------
      addAsset: (input) => {
        const id = `FA-${String(nextNumber(state.assets.map((a) => a.id), 0)).padStart(3, "0")}`;
        const asset: FixedAsset = {
          id,
          ...input,
          accumulated: 0,
          depreciatedThrough: addMonths(input.acquiredOn.slice(0, 7), -1),
          status: "in-service",
          valuations: [],
          events: [{ date: input.acquiredOn, type: "acquired", note: `Bought for ${input.cost.toLocaleString("en-US")}` }],
          disposedOn: null,
          proceeds: null,
        };
        dispatch({ type: "addAsset", asset });
        post(input.acquiredOn, `Asset ${id} bought: ${input.name}`, "assets", id, [
          debit(ACCOUNT_CODES.fixedAssets, input.cost),
          credit(ACCOUNT_CODES.bank, input.cost),
        ]);
        return id;
      },

      runDepreciation: (period) => {
        const amounts: Record<string, number> = {};
        for (const a of state.assets) {
          if (a.status === "disposed") continue;
          const due = round2(accumulatedThrough(a, period) - a.accumulated);
          if (due > 0) amounts[a.id] = due;
        }
        const total = round2(Object.values(amounts).reduce((t, n) => t + n, 0));
        if (total <= 0) return 0;
        dispatch({ type: "applyDepreciation", period, amounts });
        post(endOfMonth(period), `Depreciation for ${period}`, "assets", `DEP ${period}`, [
          debit(ACCOUNT_CODES.depreciation, total),
          credit(ACCOUNT_CODES.accumulatedDepreciation, total),
        ]);
        return Object.keys(amounts).length;
      },

      setAssetStatus: (id, status, note) => dispatch({ type: "setAssetStatus", id, status, date: DEMO_TODAY, note }),

      recordValuation: (id, amount, note) =>
        dispatch({ type: "recordValuation", id, valuation: { date: DEMO_TODAY, amount, note } }),

      disposeAsset: (id, proceeds) => {
        const asset = state.assets.find((a) => a.id === id);
        if (!asset || asset.status === "disposed") return;
        const gain = round2(proceeds - (asset.cost - asset.accumulated));
        dispatch({ type: "disposeAsset", id, date: DEMO_TODAY, proceeds });
        post(DEMO_TODAY, `Asset ${id} disposed: ${asset.name}`, "assets", id, [
          ...(proceeds > 0 ? [debit(ACCOUNT_CODES.bank, proceeds)] : []),
          ...(asset.accumulated > 0 ? [debit(ACCOUNT_CODES.accumulatedDepreciation, asset.accumulated)] : []),
          ...(gain < 0 ? [debit(ACCOUNT_CODES.disposal, -gain)] : []),
          credit(ACCOUNT_CODES.fixedAssets, asset.cost),
          ...(gain > 0 ? [credit(ACCOUNT_CODES.disposal, gain)] : []),
        ]);
      },

      // ---------- budgeting ----------
      setBudget: (id, annual) => dispatch({ type: "setBudget", id, annual }),
      addBudgetLine: ({ department, kind, category, annual }) =>
        dispatch({
          type: "addBudgetLine",
          line: {
            id: `B-${String(nextNumber(state.budgets.map((b) => b.id), 0)).padStart(3, "0")}`,
            department,
            fiscalYear: 2026,
            kind,
            category,
            annual,
            actual: 0,
            source: "manual",
          },
        }),
    };
  }, [state, sales, supplier, meId]);

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance(): FinanceContextValue {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance must be used inside <FinanceProvider>");
  return ctx;
}
