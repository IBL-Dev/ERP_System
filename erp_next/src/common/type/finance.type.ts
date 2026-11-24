import type { Department } from "./hr.type";

// ---------- general ledger ----------
export type AccountType = "asset" | "liability" | "equity" | "revenue" | "expense";

export type Account = {
  /** Four-digit account code, e.g. 1000. */
  code: string;
  name: string;
  type: AccountType;
  /** A contra account carries the opposite balance of its type (accumulated depreciation). */
  contra?: boolean;
  active: boolean;
};

export type AccountBalance = { debit: number; credit: number; net: number };

export type JournalSource = "opening" | "manual" | "payables" | "receivables" | "assets";

export type JournalLine = { account: string; debit: number; credit: number };

export type JournalEntry = {
  id: string;
  date: string;
  description: string;
  source: JournalSource;
  reference: string;
  lines: JournalLine[];
};

/** One line of one entry, for the account ledger view. */
export type LedgerRow = { entry: JournalEntry; line: JournalLine };

// ---------- accounts payable ----------
/** The approval and schedule recorded against a Supplier payment note. */
export type ApStep = {
  decision: "approved" | "rejected";
  decidedBy: string;
  scheduledOn: string | null;
};

export type ApStatus = "pending" | "approved" | "scheduled" | "paid" | "rejected";

export type PayResult = { ok: true } | { ok: false; reason: "status" | "cash" };

// ---------- accounts receivable ----------
export type PaymentMethod = "bank-transfer" | "cheque" | "card" | "cash";

export type Receipt = {
  id: string;
  invoiceId: string;
  customerId: string;
  amount: number;
  receivedOn: string;
  method: PaymentMethod;
};

export type AgingBucket = "current" | "1-30" | "31-60" | "60+";

// ---------- fixed assets ----------
export type AssetStatus = "in-service" | "maintenance" | "disposed";

export type AssetValuation = { date: string; amount: number; note: string };

export type AssetEventType = "acquired" | "serviced" | "returned" | "revalued" | "disposed";

export type AssetEvent = { date: string; type: AssetEventType; note: string };

export type FixedAsset = {
  id: string;
  name: string;
  category: string;
  department: Department;
  acquiredOn: string;
  cost: number;
  salvage: number;
  lifeYears: number;
  accumulated: number;
  /** Last month depreciation was posted, as YYYY-MM. */
  depreciatedThrough: string;
  status: AssetStatus;
  /** Market valuations, for property that is not part of inventory. Book value is separate. */
  valuations: AssetValuation[];
  events: AssetEvent[];
  disposedOn: string | null;
  proceeds: number | null;
};

export type ScheduleRow = { year: number; depreciation: number; closingValue: number };

// ---------- budgets ----------
export type BudgetKind = "revenue" | "expense";
export type BudgetSource = "manual" | "sales-invoices" | "supplier-notes";
export type BudgetStatus = "on-track" | "watch" | "off-track";

export type BudgetLine = {
  id: string;
  department: Department;
  fiscalYear: number;
  kind: BudgetKind;
  category: string;
  /** Budget for the whole year. */
  annual: number;
  /** Actual to date for manual lines. Live lines are worked out from Sales or Supplier data. */
  actual: number;
  source: BudgetSource;
};

export type FinanceState = {
  accounts: Account[];
  journal: JournalEntry[];
  apSteps: Record<string, ApStep>;
  receipts: Receipt[];
  assets: FixedAsset[];
  budgets: BudgetLine[];
};

// ---- screen filters ----
export type AccountTypeFilter = AccountType | "all";
export type JournalFilter = JournalSource | "all";
export type ApFilter = ApStatus | "all";
export type AssetFilter = AssetStatus | "all";
export type BudgetDepartmentFilter = Department | "all";

// ---- provider API ----
export type NewAccount = { code: string; name: string; type: AccountType };

export type NewManualEntry = {
  date: string;
  description: string;
  debitAccount: string;
  creditAccount: string;
  amount: number;
};

export type NewAsset = Pick<FixedAsset, "name" | "category" | "department" | "acquiredOn" | "cost" | "salvage" | "lifeYears">;

export type NewBudgetLine = Pick<BudgetLine, "department" | "kind" | "category" | "annual">;

export type FinanceAction =
  | { type: "addAccount"; account: Account }
  | { type: "setAccountActive"; code: string; active: boolean }
  | { type: "post"; entry: JournalEntry }
  | { type: "decideVendorInvoice"; noteId: string; decision: "approved" | "rejected"; byId: string }
  | { type: "scheduleVendorPayment"; noteId: string; date: string }
  | { type: "addReceipt"; receipt: Receipt }
  | { type: "addAsset"; asset: FixedAsset }
  | { type: "applyDepreciation"; period: string; amounts: Record<string, number> }
  | { type: "setAssetStatus"; id: string; status: AssetStatus; date: string; note: string }
  | { type: "recordValuation"; id: string; valuation: AssetValuation }
  | { type: "disposeAsset"; id: string; date: string; proceeds: number }
  | { type: "setBudget"; id: string; annual: number }
  | { type: "addBudgetLine"; line: BudgetLine };

export type FinanceContextValue = FinanceState & {
  accountsByCode: Record<string, Account>;
  balances: Record<string, AccountBalance>;
  /** The signed-in user's employee id (for approvals). */
  meId: string;

  /** Returns an error message, or null when the account was added. */
  addAccount: (input: NewAccount) => string | null;
  setAccountActive: (code: string, active: boolean) => void;
  postManualEntry: (input: NewManualEntry) => void;

  /** Approves or rejects a Supplier payment note. Approving posts the liability to the ledger. */
  decideVendorInvoice: (noteId: string, decision: "approved" | "rejected") => void;
  scheduleVendorPayment: (noteId: string, date: string) => void;
  /** Pays one approved note now, if the bank balance covers it. */
  payVendor: (noteId: string) => PayResult;
  /** Pays every approved note scheduled for today or earlier, as far as the bank balance allows. */
  runDuePayments: () => { paid: number; skipped: number };

  /** Issues the invoice Sales asked for and posts it to the ledger. */
  generateInvoice: (invoiceId: string) => void;
  recordPayment: (invoiceId: string, amount: number, method: PaymentMethod) => void;

  addAsset: (input: NewAsset) => string;
  /** Posts depreciation up to the end of `period`. Returns how many assets were depreciated. */
  runDepreciation: (period: string) => number;
  setAssetStatus: (id: string, status: AssetStatus, note: string) => void;
  recordValuation: (id: string, amount: number, note: string) => void;
  disposeAsset: (id: string, proceeds: number) => void;

  setBudget: (id: string, annual: number) => void;
  addBudgetLine: (input: NewBudgetLine) => void;
};
