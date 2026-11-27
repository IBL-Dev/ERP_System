import {
  AP_APPROVAL_LIMIT,
  AP_BUDGET_OWNER_DEPARTMENT,
  BUDGET_WATCH_PCT,
  DEMO_TODAY,
  DEPARTMENT_HEAD,
  FISCAL_YEAR,
} from "@/common/const";
import type {
  Account,
  AccountBalance,
  AgingBucket,
  ApStatus,
  ApStep,
  AssetValuation,
  BudgetLine,
  BudgetStatus,
  FixedAsset,
  Invoice,
  JournalEntry,
  LedgerRow,
  PaymentNote,
  ScheduleRow,
} from "@/common/type";
import { daysBetween } from "@/lib/date";
import { accumulatedThrough, depreciableAmount, monthlyDepreciation } from "@/lib/depreciation";

export { nextNumber } from "@/lib/ids";

export const round2 = (n: number) => Math.round(n * 100) / 100;

// ---------- general ledger ----------
export function accountBalances(journal: JournalEntry[]): Record<string, AccountBalance> {
  const totals: Record<string, AccountBalance> = {};
  for (const entry of journal) {
    for (const line of entry.lines) {
      const t = (totals[line.account] ??= { debit: 0, credit: 0, net: 0 });
      t.debit = round2(t.debit + line.debit);
      t.credit = round2(t.credit + line.credit);
      t.net = round2(t.debit - t.credit);
    }
  }
  return totals;
}

/** Assets and expenses normally carry a debit balance. Contra accounts (accumulated depreciation) are the exception. */
export const isDebitNormal = (a: Account) => (a.type === "asset" && !a.contra) || a.type === "expense";

/** The balance as a positive number on the account's normal side. */
export const naturalBalance = (a: Account, b: AccountBalance | undefined) => {
  const net = b?.net ?? 0;
  return isDebitNormal(a) ? net : -net;
};

export function ledgerRows(journal: JournalEntry[]): LedgerRow[] {
  return [...journal]
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
    .flatMap((entry) => entry.lines.map((line) => ({ entry, line })));
}

export const entryTotal = (e: JournalEntry) => round2(e.lines.reduce((t, l) => t + l.debit, 0));

export const formatJournalId = (n: number) => `JE-${String(n).padStart(4, "0")}`;

// ---------- accounts payable ----------
/** Goods invoices over the limit need the Finance head; otherwise the budget owner approves. */
export function approverIdForNote(note: PaymentNote): string {
  return note.amount > AP_APPROVAL_LIMIT ? DEPARTMENT_HEAD.finance : DEPARTMENT_HEAD[AP_BUDGET_OWNER_DEPARTMENT];
}

export function apStatus(note: PaymentNote, steps: Record<string, ApStep>): ApStatus {
  if (note.status === "paid") return "paid";
  const step = steps[note.id];
  if (!step) return "pending";
  if (step.decision === "rejected") return "rejected";
  return step.scheduledOn ? "scheduled" : "approved";
}

export const canApproveNote = (note: PaymentNote, steps: Record<string, ApStep>, userId: string) =>
  apStatus(note, steps) === "pending" && approverIdForNote(note) === userId;

// ---------- accounts receivable ----------
export function agingBucket(inv: Pick<Invoice, "dueOn">): AgingBucket {
  if (!inv.dueOn || inv.dueOn >= DEMO_TODAY) return "current";
  const late = daysBetween(inv.dueOn, DEMO_TODAY);
  if (late <= 30) return "1-30";
  return late <= 60 ? "31-60" : "60+";
}

// ---------- fixed assets ----------
export const bookValue = (a: FixedAsset) => round2(a.cost - a.accumulated);
export const monthlyFor = (a: FixedAsset) => monthlyDepreciation(a);
export const isFullyDepreciated = (a: FixedAsset) => a.accumulated >= depreciableAmount(a);

export const latestValuation = (a: FixedAsset): AssetValuation | undefined =>
  [...a.valuations].sort((x, y) => y.date.localeCompare(x.date))[0];

/** Depreciation per calendar year until the asset is fully depreciated. */
export function depreciationSchedule(a: FixedAsset): ScheduleRow[] {
  const firstYear = Number(a.acquiredOn.slice(0, 4));
  const rows: ScheduleRow[] = [];
  let previous = 0;
  for (let year = firstYear; year <= firstYear + a.lifeYears; year += 1) {
    const total = accumulatedThrough(a, `${year}-12`);
    if (total > previous) rows.push({ year, depreciation: round2(total - previous), closingValue: round2(a.cost - total) });
    previous = total;
  }
  return rows;
}

// ---------- budgeting ----------
/** Share of the fiscal year that has passed, 0 to 1. */
export const yearElapsed = () => (daysBetween(`${FISCAL_YEAR}-01-01`, DEMO_TODAY) + 1) / 365;

export const projectedYearEnd = (actual: number) => round2(actual / yearElapsed());

/** Expenses should stay under budget; revenue should reach it. */
export function budgetStatus(line: BudgetLine, actual: number): BudgetStatus {
  const projected = projectedYearEnd(actual);
  const ratio = line.annual > 0 ? (projected / line.annual) * 100 : 0;
  if (line.kind === "expense") {
    if (ratio > 100) return "off-track";
    return ratio >= BUDGET_WATCH_PCT ? "watch" : "on-track";
  }
  if (ratio >= 100) return "on-track";
  return ratio >= BUDGET_WATCH_PCT ? "watch" : "off-track";
}

export function budgetActual(line: BudgetLine, invoices: Invoice[], notes: PaymentNote[]): number {
  const year = String(line.fiscalYear);
  if (line.source === "sales-invoices") {
    return round2(invoices.filter((i) => i.issuedOn?.startsWith(year)).reduce((t, i) => t + i.amount, 0));
  }
  if (line.source === "supplier-notes") {
    return round2(notes.filter((n) => n.sentOn.startsWith(year)).reduce((t, n) => t + n.amount, 0));
  }
  return line.actual;
}
