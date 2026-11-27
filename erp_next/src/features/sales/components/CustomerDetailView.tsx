"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import {
  COMMUNICATION_LABEL,
  COMMUNICATION_OPTIONS,
  FULFILLMENT_META,
  INVOICE_STATUS_META,
  QUOTE_STATUS_META,
  ROUTES,
  TIER_LABEL,
} from "@/common/const";
import type { Column, CommunicationType, Quote, SalesOrder } from "@/common/type";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { DescriptionList } from "@/components/ui/DescriptionList";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { Select } from "@/components/ui/Select";
import { StatGrid } from "@/components/ui/StatGrid";
import { StatTile } from "@/components/ui/StatTile";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/date";
import { formatMoney } from "@/lib/format";
import { linesTotal } from "@/lib/pricing";
import { useInventory } from "@/features/inventory/InventoryProvider";
import { useSales } from "../SalesProvider";
import { fulfillmentOf, invoiceBalance, invoiceDisplayStatus } from "../utils";

export function CustomerDetailView({ id }: { id: string }) {
  const { customersById, orders, quotes, invoices, communications, logCommunication } = useSales();
  const { movements } = useInventory();
  const [type, setType] = useState<CommunicationType>("call");
  const [summary, setSummary] = useState("");
  const [error, setError] = useState<string | null>(null);

  const customer = customersById[id];
  if (!customer) {
    return (
      <>
        <PageHeader title="Customer not found" />
        <p className="text-sm">
          There is no customer {id}. <Link href={ROUTES.sales.customers} className="text-accent hover:underline">Back to customers</Link>
        </p>
      </>
    );
  }

  const myOrders = orders.filter((o) => o.customerId === id);
  const myQuotes = quotes.filter((q) => q.customerId === id);
  const myInvoices = invoices.filter((i) => i.customerId === id);
  const log = communications.filter((c) => c.customerId === id);

  const lifetime = myOrders.reduce((t, o) => t + linesTotal(o.lines), 0);
  const owed = myInvoices.filter((i) => i.status === "issued").reduce((t, i) => t + invoiceBalance(i), 0);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!summary.trim()) return setError("Write a short summary.");
    setError(null);
    logCommunication(id, type, summary.trim());
    setSummary("");
  };

  const orderColumns: Column<SalesOrder>[] = [
    { key: "id", header: "Order", cell: (o) => <span className="font-medium">{o.id}</span> },
    { key: "placed", header: "Placed", cell: (o) => formatDate(o.placedOn) },
    { key: "total", header: "Total", align: "right", cell: (o) => formatMoney(linesTotal(o.lines)) },
    { key: "fulfillment", header: "Fulfillment", cell: (o) => <StatusBadge meta={FULFILLMENT_META[fulfillmentOf(o, movements)]} /> },
    {
      key: "billing",
      header: "Billing",
      cell: (o) => {
        const inv = invoices.find((i) => i.id === o.invoiceId);
        return inv ? <StatusBadge meta={INVOICE_STATUS_META[invoiceDisplayStatus(inv)]} /> : <span className="text-ink-muted">Not invoiced</span>;
      },
    },
  ];

  const quoteColumns: Column<Quote>[] = [
    {
      key: "id",
      header: "Quote",
      cell: (q) => (
        <Link href={ROUTES.sales.quote(q.id)} className="font-medium text-accent hover:underline">
          {q.id}
        </Link>
      ),
    },
    { key: "created", header: "Created", cell: (q) => formatDate(q.createdOn) },
    { key: "total", header: "Total", align: "right", cell: (q) => formatMoney(linesTotal(q.lines)) },
    { key: "status", header: "Status", cell: (q) => <StatusBadge meta={QUOTE_STATUS_META[q.status]} /> },
  ];

  return (
    <>
      <PageHeader
        title={customer.name}
        code={customer.id}
        description={`${TIER_LABEL[customer.tier]} customer since ${formatDate(customer.customerSince)}`}
        actions={<Link href={ROUTES.sales.customers} className="text-sm text-accent hover:underline">All customers</Link>}
      />

      <StatGrid columns={3}>
        <StatTile label="Lifetime value" value={formatMoney(lifetime)} />
        <StatTile label="Orders" value={myOrders.length} />
        <StatTile label="Owes us" value={formatMoney(owed)} tone={owed ? "warning" : undefined} />
      </StatGrid>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Profile" titleId="profile">
          <div className="mt-3">
            <DescriptionList
              items={[
                ["Contact", customer.contact],
                ["Email", customer.email],
                ["Phone", customer.phone],
                ["Address", customer.address],
                ["Tier", TIER_LABEL[customer.tier]],
                ["Account manager", customer.accountManager],
                ["Payment terms", `${customer.paymentTermsDays} days`],
              ]}
            />
          </div>
        </Panel>

        <Panel title="Communication log" titleId="comms">
          <form onSubmit={submit} noValidate className="mt-3 grid gap-3 sm:grid-cols-[9rem_1fr_auto] sm:items-start">
            <Field label="Type" htmlFor="log-type">
              <Select id="log-type" value={type} options={COMMUNICATION_OPTIONS} onChange={setType} />
            </Field>
            <Field label="Summary" htmlFor="log-summary" error={error}>
              <Input id="log-summary" value={summary} onChange={(e) => setSummary(e.target.value)} invalid={Boolean(error)} />
            </Field>
            <div className="sm:pt-6">
              <Button type="submit">Add</Button>
            </div>
          </form>
          {log.length === 0 ? (
            <p className="mt-4 text-sm text-ink-muted">Nothing logged yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {log.map((entry) => (
                <li key={entry.id} className="py-2 text-sm">
                  <p>
                    <span className="font-medium">{COMMUNICATION_LABEL[entry.type]}</span>
                    <span className="text-ink-muted">
                      {" "}
                      · {entry.by} · {formatDate(entry.at)}
                    </span>
                  </p>
                  <p>{entry.summary}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <section aria-labelledby="history" className="mt-6">
        <h2 id="history" className="mb-3 font-semibold">Purchase history</h2>
        <DataTable caption="Purchase history" columns={orderColumns} rows={myOrders} rowKey={(o) => o.id} empty="No orders yet." />
      </section>

      <section aria-labelledby="quotes" className="mt-6">
        <h2 id="quotes" className="mb-3 font-semibold">Quotes</h2>
        <DataTable caption="Quotes for this customer" columns={quoteColumns} rows={myQuotes} rowKey={(q) => q.id} empty="No quotes yet." />
      </section>
    </>
  );
}
