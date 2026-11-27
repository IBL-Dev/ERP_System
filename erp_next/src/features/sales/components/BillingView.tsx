"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { INVOICE_FILTERS, INVOICE_STATUS_META, ROUTES } from "@/common/const";
import type { Column, Invoice, InvoiceFilter, SalesOrder } from "@/common/type";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
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
import { CustomerLink } from "./CustomerLink";

export function BillingView() {
  const { orders, invoices, signalFinance } = useSales();
  const { movements } = useInventory();
  const [filter, setFilter] = useState<InvoiceFilter>("all");

  const readyToInvoice = orders.filter((o) => !o.invoiceId && fulfillmentOf(o, movements) === "shipped");

  const rows = useMemo(() => invoices.filter((i) => filter === "all" || invoiceDisplayStatus(i) === filter), [invoices, filter]);

  const outstanding = invoices.filter((i) => i.status === "issued").reduce((t, i) => t + invoiceBalance(i), 0);
  const overdue = invoices.filter((i) => invoiceDisplayStatus(i) === "overdue").reduce((t, i) => t + invoiceBalance(i), 0);
  const collected = invoices.reduce((t, i) => t + i.paidAmount, 0);

  const readyColumns: Column<SalesOrder>[] = [
    { key: "id", header: "Order", cell: (o) => <span className="font-medium">{o.id}</span> },
    { key: "customer", header: "Customer", cell: (o) => <CustomerLink id={o.customerId} /> },
    { key: "total", header: "Amount", align: "right", cell: (o) => formatMoney(linesTotal(o.lines)) },
    { key: "action", header: "Action", cell: (o) => <Button size="sm" onClick={() => signalFinance(o.id)}>Signal Finance</Button> },
  ];

  const columns: Column<Invoice>[] = [
    { key: "id", header: "Invoice", cell: (i) => <span className="font-medium">{i.id}</span> },
    { key: "order", header: "Order", cell: (i) => i.orderId },
    { key: "customer", header: "Customer", cell: (i) => <CustomerLink id={i.customerId} /> },
    { key: "amount", header: "Amount", align: "right", cell: (i) => formatMoney(i.amount) },
    { key: "due", header: "Due", cell: (i) => (i.dueOn ? formatDate(i.dueOn) : "-") },
    { key: "balance", header: "Balance", align: "right", cell: (i) => (i.status === "requested" ? "-" : formatMoney(invoiceBalance(i))) },
    { key: "status", header: "Status", cell: (i) => <StatusBadge meta={INVOICE_STATUS_META[invoiceDisplayStatus(i)]} /> },
  ];

  return (
    <>
      <PageHeader
        title="Invoicing and billing"
        code="SAL06"
        description="Sales signals Finance to invoice shipped orders, then follows each invoice until it is paid."
      />

      <StatGrid>
        <StatTile label="Ready to invoice" value={readyToInvoice.length} hint="Shipped, no invoice yet" tone={readyToInvoice.length ? "warning" : undefined} />
        <StatTile label="Outstanding" value={formatMoney(outstanding)} hint="Issued, not yet paid" />
        <StatTile label="Overdue" value={formatMoney(overdue)} tone={overdue ? "danger" : undefined} />
        <StatTile label="Collected" value={formatMoney(collected)} />
      </StatGrid>

      <Notice>
        Finance issues each invoice and records the payments. Follow them in{" "}
        <Link href={ROUTES.finance.receivables} className="text-accent hover:underline">Finance, Accounts receivable</Link>.
      </Notice>

      <section aria-labelledby="ready" className="mb-8">
        <h2 id="ready" className="mb-3 font-semibold">Shipped orders ready to invoice</h2>
        <DataTable caption="Shipped orders without an invoice" columns={readyColumns} rows={readyToInvoice} rowKey={(o) => o.id} empty="Every shipped order has been sent to Finance." />
      </section>

      <section aria-labelledby="invoices">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 id="invoices" className="font-semibold">Invoices and collections</h2>
          <Select variant="filter" id="invoice-filter" label="Show" value={filter} onChange={setFilter} options={INVOICE_FILTERS} />
        </div>
        <DataTable caption="Invoices and payment collection" columns={columns} rows={rows} rowKey={(i) => i.id} empty="No invoices for this selection." />
      </section>
    </>
  );
}
