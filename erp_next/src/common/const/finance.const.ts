import type {
  AccountType,
  AccountTypeFilter,
  AgingBucket,
  ApFilter,
  ApStatus,
  AssetEventType,
  AssetFilter,
  AssetStatus,
  BudgetKind,
  BudgetStatus,
  Department,
  JournalFilter,
  JournalSource,
  PaymentMethod,
  SelectOption,
  ToneMeta,
} from "../type";
import { DEPARTMENT_LABEL } from "./hr.const";

export const FISCAL_YEAR = 2026;

/** Account codes the system posts to by itself. */
export const ACCOUNT_CODES = {
  bank: "1000",
  receivable: "1100",
  inventory: "1200",
  fixedAssets: "1500",
  accumulatedDepreciation: "1590",
  payable: "2000",
  equity: "3000",
  sales: "4000",
  depreciation: "6100",
  disposal: "7000",
} as const;

// ---------- general ledger ----------
export const ACCOUNT_TYPE_LABEL: Record<AccountType, string> = {
  asset: "Asset",
  liability: "Liability",
  equity: "Equity",
  revenue: "Revenue",
  expense: "Expense",
};

const ACCOUNT_TYPES = Object.keys(ACCOUNT_TYPE_LABEL) as AccountType[];

export const ACCOUNT_TYPE_OPTIONS: readonly SelectOption<AccountType>[] = ACCOUNT_TYPES.map((value) => ({
  value,
  label: ACCOUNT_TYPE_LABEL[value],
}));

export const ACCOUNT_TYPE_FILTERS: readonly SelectOption<AccountTypeFilter>[] = [
  { value: "all", label: "All account types" },
  ...ACCOUNT_TYPE_OPTIONS,
];

export const JOURNAL_SOURCE_LABEL: Record<JournalSource, string> = {
  opening: "Opening balances",
  manual: "Manual entry",
  payables: "Accounts payable",
  receivables: "Accounts receivable",
  assets: "Fixed assets",
};

export const JOURNAL_FILTERS: readonly SelectOption<JournalFilter>[] = [
  { value: "all", label: "All sources" },
  ...(Object.keys(JOURNAL_SOURCE_LABEL) as JournalSource[]).map((value) => ({ value, label: JOURNAL_SOURCE_LABEL[value] })),
];

// ---------- accounts payable ----------
/** Vendor invoices above this value need the Finance head; below it the budget owner approves. */
export const AP_APPROVAL_LIMIT = 5000;

/** Supplier payment notes are for goods, so the Inventory department owns the budget. */
export const AP_BUDGET_OWNER_DEPARTMENT = "inventory";

export const AP_STATUS_META: Record<ApStatus, ToneMeta> = {
  pending: { label: "Awaiting approval", tone: "warning" },
  approved: { label: "Approved, not scheduled", tone: "info" },
  scheduled: { label: "Payment scheduled", tone: "info" },
  paid: { label: "Paid", tone: "success" },
  rejected: { label: "Rejected", tone: "danger" },
};

export const AP_FILTERS: readonly SelectOption<ApFilter>[] = [
  { value: "all", label: "All vendor invoices" },
  { value: "pending", label: "Awaiting approval" },
  { value: "approved", label: "Approved, not scheduled" },
  { value: "scheduled", label: "Payment scheduled" },
  { value: "paid", label: "Paid" },
  { value: "rejected", label: "Rejected" },
];

// ---------- accounts receivable ----------
export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  "bank-transfer": "Bank transfer",
  cheque: "Cheque",
  card: "Card",
  cash: "Cash",
};

export const PAYMENT_METHOD_OPTIONS: readonly SelectOption<PaymentMethod>[] = (
  Object.keys(PAYMENT_METHOD_LABEL) as PaymentMethod[]
).map((value) => ({ value, label: PAYMENT_METHOD_LABEL[value] }));

export const AGING_BUCKETS: readonly AgingBucket[] = ["current", "1-30", "31-60", "60+"];

export const AGING_LABEL: Record<AgingBucket, string> = {
  current: "Not yet due",
  "1-30": "1 to 30 days late",
  "31-60": "31 to 60 days late",
  "60+": "Over 60 days late",
};

// ---------- fixed assets ----------
export const ASSET_STATUS_META: Record<AssetStatus, ToneMeta> = {
  "in-service": { label: "In service", tone: "success" },
  maintenance: { label: "In maintenance", tone: "warning" },
  disposed: { label: "Disposed", tone: "neutral" },
};

export const ASSET_FILTERS: readonly SelectOption<AssetFilter>[] = [
  { value: "all", label: "All assets" },
  { value: "in-service", label: "In service" },
  { value: "maintenance", label: "In maintenance" },
  { value: "disposed", label: "Disposed" },
];

export const ASSET_EVENT_LABEL: Record<AssetEventType, string> = {
  acquired: "Acquired",
  serviced: "Sent for service",
  returned: "Back in service",
  revalued: "Revalued",
  disposed: "Disposed",
};

export const ASSET_CATEGORY_OPTIONS: readonly SelectOption[] = [
  "Warehouse equipment",
  "Vehicles",
  "IT equipment",
  "Furniture",
  "Property",
].map((value) => ({ value, label: value }));

// ---------- budgets ----------
/** Projected spend or income this close to budget (in percent) is shown as "watch". */
export const BUDGET_WATCH_PCT = 90;

export const BUDGET_KIND_LABEL: Record<BudgetKind, string> = { revenue: "Revenue", expense: "Expense" };

export const BUDGET_KIND_OPTIONS: readonly SelectOption<BudgetKind>[] = [
  { value: "expense", label: "Expense" },
  { value: "revenue", label: "Revenue" },
];

export const BUDGET_STATUS_META: Record<BudgetStatus, ToneMeta> = {
  "on-track": { label: "On track", tone: "success" },
  watch: { label: "Watch", tone: "warning" },
  "off-track": { label: "Off track", tone: "danger" },
};

/** Departments that own budgets and assets (everyone except the executive office). */
export const FINANCE_DEPARTMENT_OPTIONS: readonly SelectOption<Department>[] = (
  Object.keys(DEPARTMENT_LABEL) as Department[]
)
  .filter((value) => value !== "executive")
  .map((value) => ({ value, label: DEPARTMENT_LABEL[value] }));

export const BUDGET_DEPARTMENT_FILTERS: readonly SelectOption<Department | "all">[] = [
  { value: "all", label: "All departments" },
  ...FINANCE_DEPARTMENT_OPTIONS,
];
