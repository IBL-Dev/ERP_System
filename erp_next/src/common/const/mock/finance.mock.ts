import { accumulatedThrough } from "@/lib/depreciation";
import type {
  Account,
  BudgetLine,
  Department,
  FinanceState,
  FixedAsset,
  JournalEntry,
  JournalLine,
  Receipt,
} from "../../type";
import { ACCOUNT_CODES } from "../finance.const";
import { INITIAL_STATE as SALES } from "./sales.mock";

// Mock data. Replace with an API service later; the rest of the feature only reads FinanceState.

const ACCOUNTS: Account[] = [
  { code: "1000", name: "Bank", type: "asset", active: true },
  { code: "1100", name: "Accounts receivable", type: "asset", active: true },
  { code: "1200", name: "Inventory", type: "asset", active: true },
  { code: "1500", name: "Fixed assets, at cost", type: "asset", active: true },
  { code: "1590", name: "Accumulated depreciation", type: "asset", contra: true, active: true },
  { code: "2000", name: "Accounts payable", type: "liability", active: true },
  { code: "3000", name: "Owner's equity", type: "equity", active: true },
  { code: "4000", name: "Sales revenue", type: "revenue", active: true },
  { code: "5000", name: "Cost of goods sold", type: "expense", active: true },
  { code: "6000", name: "Salaries and wages", type: "expense", active: true },
  { code: "6100", name: "Depreciation expense", type: "expense", active: true },
  { code: "6200", name: "Office and administration", type: "expense", active: true },
  { code: "6300", name: "Marketing", type: "expense", active: true },
  { code: "6400", name: "Utilities", type: "expense", active: true },
  { code: "6900", name: "Miscellaneous expense", type: "expense", active: false },
  { code: "7000", name: "Gain or loss on disposal", type: "revenue", active: true },
];

// ---------- fixed assets ----------
const SEED_PERIOD = "2026-10";

function asset(
  n: number,
  name: string,
  category: string,
  department: Department,
  acquiredOn: string,
  cost: number,
  salvage: number,
  lifeYears: number,
  extra: Partial<FixedAsset> = {},
): FixedAsset {
  const base = { cost, salvage, lifeYears, acquiredOn };
  const depreciatedThrough = extra.depreciatedThrough ?? SEED_PERIOD;
  return {
    id: `FA-${String(n).padStart(3, "0")}`,
    name,
    category,
    department,
    acquiredOn,
    cost,
    salvage,
    lifeYears,
    accumulated: accumulatedThrough(base, depreciatedThrough),
    depreciatedThrough,
    status: "in-service",
    valuations: [],
    events: [{ date: acquiredOn, type: "acquired", note: `Bought for ${cost.toLocaleString("en-US")}` }],
    disposedOn: null,
    proceeds: null,
    ...extra,
  };
}

const ASSETS: FixedAsset[] = [
  asset(1, "Diesel forklift", "Warehouse equipment", "inventory", "2022-03-01", 28000, 3000, 8),
  asset(2, "Delivery van", "Vehicles", "sales", "2023-06-15", 32000, 4000, 6, {
    valuations: [{ date: "2026-06-30", amount: 20500, note: "Dealer trade-in estimate" }],
  }),
  asset(3, "Office laptops (10)", "IT equipment", "hr", "2024-02-01", 9000, 0, 3),
  asset(4, "Pallet racking system", "Warehouse equipment", "inventory", "2021-09-01", 45000, 5000, 10),
  asset(5, "Office furniture", "Furniture", "finance", "2023-01-10", 12000, 1000, 5),
  asset(6, "Warehouse improvements", "Property", "inventory", "2020-05-01", 150000, 0, 20, {
    valuations: [{ date: "2025-12-15", amount: 165000, note: "Independent valuation" }],
  }),
  asset(7, "Old pallet jack", "Warehouse equipment", "inventory", "2019-04-01", 2500, 0, 5, {
    depreciatedThrough: "2024-03",
    status: "disposed",
    disposedOn: "2026-09-30",
    proceeds: 150,
  }),
];
ASSETS[1].events.push({ date: "2026-06-30", type: "revalued", note: "Valued at 20,500" });
ASSETS[5].events.push({ date: "2025-12-15", type: "revalued", note: "Valued at 165,000" });
ASSETS[0].events.push({ date: "2026-08-14", type: "serviced", note: "Annual service" }, { date: "2026-08-16", type: "returned", note: "Back in service" });
ASSETS[6].events.push({ date: "2026-09-30", type: "disposed", note: "Sold for 150" });

// ---------- journal ----------
const sum = (xs: number[]) => Math.round(xs.reduce((t, x) => t + x, 0) * 100) / 100;
const live = ASSETS.filter((a) => a.status !== "disposed");
const fixedCost = sum(live.map((a) => a.cost));
const accumulated = sum(live.map((a) => a.accumulated));

const OPEN_DEBITS: Record<string, number> = {
  [ACCOUNT_CODES.bank]: 250000,
  [ACCOUNT_CODES.receivable]: 12000,
  [ACCOUNT_CODES.inventory]: 70000,
  [ACCOUNT_CODES.fixedAssets]: fixedCost,
};
const openingPayable = 8000;
const totalDebits = sum(Object.values(OPEN_DEBITS));

const openingLines: JournalLine[] = [
  ...Object.entries(OPEN_DEBITS).map(([account, debit]) => ({ account, debit, credit: 0 })),
  { account: ACCOUNT_CODES.accumulatedDepreciation, debit: 0, credit: accumulated },
  { account: ACCOUNT_CODES.payable, debit: 0, credit: openingPayable },
  { account: ACCOUNT_CODES.equity, debit: 0, credit: sum([totalDebits, -accumulated, -openingPayable]) },
];

const JOURNAL: JournalEntry[] = [
  { id: "JE-0001", date: "2026-10-31", description: "Opening balances", source: "opening", reference: "OPENING", lines: openingLines },
  {
    id: "JE-0002",
    date: "2026-11-03",
    description: "Office rent, November",
    source: "manual",
    reference: "Rent Nov",
    lines: [{ account: "6200", debit: 2400, credit: 0 }, { account: ACCOUNT_CODES.bank, debit: 0, credit: 2400 }],
  },
  {
    id: "JE-0003",
    date: "2026-11-10",
    description: "Electricity bill",
    source: "manual",
    reference: "Utility Oct",
    lines: [{ account: "6400", debit: 380, credit: 0 }, { account: ACCOUNT_CODES.bank, debit: 0, credit: 380 }],
  },
];

// ---------- receipts: one per payment Sales already holds ----------
const RECEIPTS: Receipt[] = SALES.invoices
  .flatMap((inv) => inv.payments.map((p) => ({ inv, p })))
  .map(({ inv, p }, i) => ({
    id: `RC-${6001 + i}`,
    invoiceId: inv.id,
    customerId: inv.customerId,
    amount: p.amount,
    receivedOn: p.date,
    method: "bank-transfer" as const,
  }));

// ---------- budgets ----------
const budget = (
  n: number,
  department: Department,
  kind: BudgetLine["kind"],
  category: string,
  annual: number,
  actual: number,
  source: BudgetLine["source"] = "manual",
): BudgetLine => ({ id: `B-${String(n).padStart(3, "0")}`, department, fiscalYear: 2026, kind, category, annual, actual, source });

const BUDGETS: BudgetLine[] = [
  budget(1, "sales", "revenue", "Product sales", 12000, 0, "sales-invoices"),
  budget(2, "sales", "expense", "Marketing", 40000, 31500),
  budget(3, "sales", "expense", "Travel", 12000, 7200),
  budget(4, "hr", "expense", "Salaries", 600000, 508000),
  budget(5, "hr", "expense", "Training", 18000, 9400),
  budget(6, "hr", "expense", "Recruitment", 15000, 16200),
  budget(7, "inventory", "expense", "Warehouse operations", 90000, 71000),
  budget(8, "supplier", "expense", "Purchases of goods", 60000, 0, "supplier-notes"),
  budget(9, "finance", "expense", "Professional fees", 25000, 11000),
];

export const INITIAL_STATE: FinanceState = {
  accounts: ACCOUNTS,
  journal: JOURNAL.reverse(),
  apSteps: {},
  receipts: RECEIPTS,
  assets: ASSETS,
  budgets: BUDGETS,
};

