import { addDays } from "@/lib/date";
import { buildQuoteLine, linesTotal } from "@/lib/pricing";
import type {
  CommunicationLog,
  Customer,
  CustomerTier,
  HandoffNotice,
  Invoice,
  Quote,
  SalesOrder,
  SalesState,
} from "../../type";
import { FULFILLMENT_TEAM, QUOTE_VALIDITY_DAYS } from "../sales.const";

// Mock data. Replace with an API service later; the rest of the feature only reads SalesState.

function customer(
  n: number,
  name: string,
  contact: string,
  tier: CustomerTier,
  paymentTermsDays: number,
  accountManager: string,
  customerSince: string,
): Customer {
  const slug = name.toLowerCase().replace(/[^a-z ]/g, "").replace(/ /g, "");
  return {
    id: `C-${String(n).padStart(3, "0")}`,
    name,
    contact,
    email: `${contact.toLowerCase().replace(/[^a-z ]/g, "").replace(/ /g, ".")}@${slug}.example`,
    phone: `555-03${String(n).padStart(2, "0")}`,
    address: `${100 + n * 7} Commerce Avenue`,
    tier,
    accountManager,
    paymentTermsDays,
    customerSince,
  };
}

const CUSTOMERS: Customer[] = [
  customer(1, "Harbor Logistics", "Maya Collins", "gold", 30, "Elena Petrova", "2021-03-12"),
  customer(2, "Brightfield Retail", "Owen Park", "silver", 14, "Zara Ahmed", "2023-06-01"),
  customer(3, "Orion Medical Supplies", "Leila Haddad", "silver", 30, "Elena Petrova", "2022-09-20"),
  customer(4, "Summit Foods", "Jonas Weber", "standard", 14, "Zara Ahmed", "2025-01-15"),
  customer(5, "Kestrel Electronics", "Ravi Menon", "gold", 45, "Elena Petrova", "2020-11-02"),
  customer(6, "Greenleaf Cafes", "Hannah Brooks", "standard", 30, "Zara Ahmed", "2024-04-08"),
];

const byId = Object.fromEntries(CUSTOMERS.map((c) => [c.id, c]));

// Orders that match the goods-flow documents already in the Inventory mock data.
// [order id, customer, sku, qty, placed on]
const ORDER_SEEDS: [string, string, string, number, string][] = [
  ["SO-6980", "C-001", "BC-2000", 10, "2026-10-02"],
  ["SO-6985", "C-006", "SG-L", 100, "2026-10-10"],
  ["SO-6990", "C-005", "LP-1400", 4, "2026-11-03"],
  ["SO-7001", "C-001", "BC-2000", 8, "2026-11-09"],
  ["SO-7002", "C-005", "LP-1400", 6, "2026-11-09"],
  ["SO-7003", "C-002", "LB-100", 120, "2026-11-10"],
  ["SO-7004", "C-001", "CT-4030", 200, "2026-11-10"],
  ["SO-7005", "C-004", "WF-500", 4, "2026-11-11"],
  ["SO-7006", "C-003", "HS-500", 40, "2026-11-12"],
  ["SO-7007", "C-006", "SG-L", 60, "2026-11-12"],
  ["SO-7008", "C-005", "FL-48", 1, "2026-11-13"],
];

const QUOTES: Quote[] = [];
const ORDERS: SalesOrder[] = [];
const HANDOFFS: HandoffNotice[] = [];

ORDER_SEEDS.forEach(([orderId, customerId, sku, qty, placedOn], i) => {
  const lines = [buildQuoteLine(sku, qty, byId[customerId].tier)];
  const quoteId = `Q-${2001 + i}`;
  const createdOn = addDays(placedOn, -3);
  QUOTES.push({ id: quoteId, customerId, createdOn, validUntil: addDays(createdOn, QUOTE_VALIDITY_DAYS), status: "converted", lines, orderId });
  ORDERS.push({ id: orderId, customerId, quoteId, placedOn, lines, movementIds: [orderId], invoiceId: null });
  HANDOFFS.push({
    id: `H-${i + 1}`,
    orderId,
    team: FULFILLMENT_TEAM,
    message: `${FULFILLMENT_TEAM} team notified to pick, pack and ship ${orderId} (1 line, ${qty} units).`,
    at: placedOn,
  });
});

function openQuote(n: number, customerId: string, status: Quote["status"], createdOn: string, picks: [string, number][]): Quote {
  return {
    id: `Q-${n}`,
    customerId,
    createdOn,
    validUntil: addDays(createdOn, QUOTE_VALIDITY_DAYS),
    status,
    lines: picks.map(([sku, qty]) => buildQuoteLine(sku, qty, byId[customerId].tier)),
    orderId: null,
  };
}

QUOTES.push(
  openQuote(2012, "C-001", "approved", "2026-11-12", [["BC-2000", 12], ["LB-100", 200]]),
  openQuote(2013, "C-005", "approved", "2026-11-13", [["LP-1400", 25]]), // more than is in stock: shows the stock check
  openQuote(2014, "C-003", "sent", "2026-11-14", [["HS-500", 100]]),
  openQuote(2015, "C-002", "draft", "2026-11-16", [["CT-4030", 300]]),
  openQuote(2016, "C-004", "rejected", "2026-10-20", [["WF-500", 50]]),
);

// ---------- invoices for orders that already shipped ----------
const invoiceFor = (orderId: string, id: string, partial: Partial<Invoice>): Invoice => {
  const order = ORDERS.find((o) => o.id === orderId)!;
  return {
    id,
    orderId,
    customerId: order.customerId,
    amount: linesTotal(order.lines),
    requestedOn: order.placedOn,
    issuedOn: null,
    dueOn: null,
    paidAmount: 0,
    status: "requested",
    ...partial,
  };
};

const INVOICES: Invoice[] = [
  invoiceFor("SO-6980", "I-9001", { requestedOn: "2026-10-04", issuedOn: "2026-10-04", dueOn: addDays("2026-10-04", byId["C-001"].paymentTermsDays), status: "issued" }),
  invoiceFor("SO-6985", "I-9002", { requestedOn: "2026-10-12", issuedOn: "2026-10-12", dueOn: addDays("2026-10-12", byId["C-006"].paymentTermsDays), status: "paid" }),
  invoiceFor("SO-6990", "I-9003", { requestedOn: "2026-11-06", status: "requested" }),
];
INVOICES[1].paidAmount = INVOICES[1].amount;
for (const inv of INVOICES) {
  const order = ORDERS.find((o) => o.id === inv.orderId);
  if (order) order.invoiceId = inv.id;
}

const log = (n: number, customerId: string, type: CommunicationLog["type"], by: string, at: string, summary: string): CommunicationLog => ({
  id: `CL-${n}`,
  customerId,
  type,
  by,
  at,
  summary,
});

const COMMUNICATIONS: CommunicationLog[] = [
  log(1, "C-001", "call", "Elena Petrova", "2026-11-12", "Agreed volume pricing for 12 scanners and 200 label rolls. Quote Q-2012 approved."),
  log(2, "C-001", "email", "Elena Petrova", "2026-10-20", "Sent reminder for invoice I-9001. Customer promised payment this week."),
  log(3, "C-005", "meeting", "Elena Petrova", "2026-11-13", "Asked for 25 laptops for a site rollout. Checking stock and delivery dates."),
  log(4, "C-005", "note", "Zara Ahmed", "2026-11-04", "Prefers delivery to the second warehouse door; call ahead."),
  log(5, "C-003", "email", "Elena Petrova", "2026-11-14", "Sent quote Q-2014 for 100 bottles of sanitizer. Waiting for confirmation."),
  log(6, "C-002", "call", "Zara Ahmed", "2026-11-16", "Discussed carton volumes for the holiday season. Draft quote Q-2015 prepared."),
  log(7, "C-004", "email", "Zara Ahmed", "2026-10-22", "Customer rejected the pallet wrap film quote as too expensive."),
  log(8, "C-006", "call", "Zara Ahmed", "2026-11-12", "Confirmed delivery window for 60 pairs of gloves."),
];

export const INITIAL_STATE: SalesState = {
  customers: CUSTOMERS,
  quotes: QUOTES,
  orders: ORDERS,
  handoffs: HANDOFFS.reverse(),
  communications: COMMUNICATIONS,
  invoices: INVOICES,
};

