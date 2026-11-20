"use client";

import Link from "next/link";
import { ROUTES } from "@/common/const";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { StatGrid } from "@/components/ui/StatGrid";
import { StatTile } from "@/components/ui/StatTile";
import { formatDate } from "@/lib/date";
import { formatMoney } from "@/lib/format";
import { linesTotal } from "@/lib/pricing";
import { useInventory } from "@/features/inventory/InventoryProvider";
import { useSales } from "../SalesProvider";
import { fulfillmentOf, invoiceBalance, invoiceDisplayStatus } from "../utils";
import { CustomerLink } from "./CustomerLink";

export function OverviewView() {
  const { customers, quotes, orders, invoices, handoffs } = useSales();
  const { movements } = useInventory();

  const openQuotes = quotes.filter((q) => q.status === "draft" || q.status === "sent").length;
  const approved = quotes.filter((q) => q.status === "approved");
  const toShip = orders.filter((o) => fulfillmentOf(o, movements) !== "shipped").length;
  const overdue = invoices.filter((i) => invoiceDisplayStatus(i) === "overdue").reduce((t, i) => t + invoiceBalance(i), 0);

  return (
    <>
      <PageHeader title="Sales overview" code="SAL00" description="Quotes, orders waiting to ship and money still to collect." />

      <StatGrid>
        <StatTile label="Open quotes" value={openQuotes} hint="Draft or waiting for the customer" href={ROUTES.sales.quotes} />
        <StatTile label="Orders still to ship" value={toShip} hint="With the Inventory team" href={ROUTES.sales.fulfillment} />
        <StatTile label="Overdue receivables" value={formatMoney(overdue)} tone={overdue ? "danger" : undefined} href={ROUTES.sales.billing} />
        <StatTile label="Customers" value={customers.length} href={ROUTES.sales.customers} />
      </StatGrid>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          title="Approved quotes ready to convert"
          titleId="approved"
          actions={
            <Link href={ROUTES.sales.quotes} className="text-sm text-accent hover:underline">
              All quotes
            </Link>
          }
        >
          {approved.length === 0 ? (
            <p className="mt-4 text-sm text-ink-muted">No approved quotes are waiting.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {approved.map((q) => (
                <li key={q.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <div>
                    <Link href={ROUTES.sales.quote(q.id)} className="font-medium text-accent hover:underline">
                      {q.id}
                    </Link>
                    <CustomerLink id={q.customerId} />
                  </div>
                  <span className="tabular-nums">{formatMoney(linesTotal(q.lines))}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Latest handoffs to Inventory"
          titleId="handoffs"
          actions={
            <Link href={ROUTES.sales.fulfillment} className="text-sm text-accent hover:underline">
              Open handoff log
            </Link>
          }
        >
          <ul className="mt-3 divide-y divide-line">
            {handoffs.slice(0, 4).map((h) => (
              <li key={h.id} className="py-2 text-sm">
                <p>{h.message}</p>
                <p className="text-xs text-ink-muted">{formatDate(h.at)}</p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
