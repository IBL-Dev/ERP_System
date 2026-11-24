"use client";

import Link from "next/link";
import { AGING_BUCKETS, AGING_LABEL, INVOICE_STATUS_META, ROUTES } from "@/common/const";
import type { Column, Invoice } from "@/common/type";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatGrid } from "@/components/ui/StatGrid";
import { StatTile } from "@/components/ui/StatTile";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CustomerLink } from "@/features/sales/components/CustomerLink";
import { useSales } from "@/features/sales/SalesProvider";
import { invoiceBalance, invoiceDisplayStatus } from "@/features/sales/utils";
import { formatDate } from "@/lib/date";
import { formatMoney } from "@/lib/format";
import { useFinance } from "../FinanceProvider";
import { agingBucket } from "../utils";

export function ReceivablesView() {
  const { invoices } = useSales();
  const { generateInvoice } = useFinance();

  const requests = invoices.filter((i) => i.status === "requested");
  const issued = invoices.filter((i) => i.status !== "requested");
  const outstanding = invoices.filter((i) => i.status === "issued");
  const sumBucket = (bucket: (typeof AGING_BUCKETS)[number]) =>
    outstanding.filter((i) => agingBucket(i) === bucket).reduce((t, i) => t + invoiceBalance(i), 0);

  const requestColumns: Column<Invoice>[] = [
    { key: "id", header: "Request", cell: (i) => <span className="font-medium">{i.id}</span> },
    { key: "order", header: "Sales order", cell: (i) => i.orderId },
    { key: "customer", header: "Customer", cell: (i) => <CustomerLink id={i.customerId} /> },
    { key: "requested", header: "Requested", cell: (i) => formatDate(i.requestedOn) },
    { key: "amount", header: "Amount", align: "right", cell: (i) => formatMoney(i.amount) },
    { key: "action", header: "Action", cell: (i) => <Button size="sm" onClick={() => generateInvoice(i.id)}>Issue invoice</Button> },
  ];

  const columns: Column<Invoice>[] = [
    { key: "id", header: "Invoice", cell: (i) => <span className="font-medium">{i.id}</span> },
    { key: "customer", header: "Customer", cell: (i) => <CustomerLink id={i.customerId} /> },
    { key: "issued", header: "Issued", cell: (i) => (i.issuedOn ? formatDate(i.issuedOn) : "-") },
    { key: "due", header: "Due", cell: (i) => (i.dueOn ? formatDate(i.dueOn) : "-") },
    { key: "amount", header: "Amount", align: "right", cell: (i) => formatMoney(i.amount) },
    { key: "paid", header: "Received", align: "right", cell: (i) => formatMoney(i.paidAmount) },
    { key: "balance", header: "Balance", align: "right", cell: (i) => formatMoney(invoiceBalance(i)) },
    {
      key: "aging",
      header: "Aging",
      cell: (i) => (i.status === "issued" ? <StatusBadge tone={agingBucket(i) === "current" ? "success" : agingBucket(i) === "60+" ? "danger" : "warning"}>{AGING_LABEL[agingBucket(i)]}</StatusBadge> : "-"),
    },
    { key: "status", header: "Status", cell: (i) => <StatusBadge meta={INVOICE_STATUS_META[invoiceDisplayStatus(i)]} /> },
  ];

  return (
    <>
      <PageHeader
        title="Customer billing"
        code="FIN06"
        description="Sales asks Finance to invoice shipped orders. Issuing an invoice records the amount customers owe in the ledger."
        actions={
          <Link href={ROUTES.finance.receipts} className="text-sm text-accent hover:underline">
            Record an incoming payment
          </Link>
        }
      />

      <StatGrid>
        {AGING_BUCKETS.map((bucket) => (
          <StatTile key={bucket} label={AGING_LABEL[bucket]} value={formatMoney(sumBucket(bucket))} tone={bucket === "60+" && sumBucket(bucket) ? "danger" : undefined} />
        ))}
      </StatGrid>

      <section aria-labelledby="requests" className="mb-8">
        <h2 id="requests" className="mb-3 font-semibold">Invoice requests from Sales</h2>
        <DataTable caption="Invoice requests from Sales" columns={requestColumns} rows={requests} rowKey={(i) => i.id} empty="No requests waiting. Sales sends one when an order has shipped." />
      </section>

      <section aria-labelledby="invoices">
        <h2 id="invoices" className="mb-3 font-semibold">Customer invoices</h2>
        <DataTable caption="Customer invoices" columns={columns} rows={issued} rowKey={(i) => i.id} empty="No invoices issued yet." />
      </section>
    </>
  );
}
