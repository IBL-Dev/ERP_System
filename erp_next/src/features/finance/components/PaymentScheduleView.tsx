"use client";

import { useState } from "react";
import { ACCOUNT_CODES, DEMO_TODAY } from "@/common/const";
import type { Column, PaymentNote } from "@/common/type";
import { AP_STATUS_META } from "@/common/const";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Input } from "@/components/ui/Input";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatGrid } from "@/components/ui/StatGrid";
import { StatTile } from "@/components/ui/StatTile";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SupplierLink } from "@/features/supplier/components/SupplierLink";
import { useSupplier } from "@/features/supplier/SupplierProvider";
import { formatDate } from "@/lib/date";
import { formatMoney } from "@/lib/format";
import { useFinance } from "../FinanceProvider";
import { apStatus } from "../utils";

function ScheduleCell({ note }: { note: PaymentNote }) {
  const { apSteps, scheduleVendorPayment } = useFinance();
  const [date, setDate] = useState(apSteps[note.id]?.scheduledOn ?? note.dueOn);
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={`sched-${note.id}`} className="sr-only">Payment date for {note.id}</label>
      <Input id={`sched-${note.id}`} type="date" controlSize="sm" fullWidth={false} value={date} onChange={(e) => setDate(e.target.value)} />
      <Button size="sm" variant="secondary" onClick={() => date && scheduleVendorPayment(note.id, date)}>Schedule</Button>
    </div>
  );
}

export function PaymentScheduleView() {
  const { apSteps, balances, payVendor, runDuePayments } = useFinance();
  const { paymentNotes } = useSupplier();
  const [notice, setNotice] = useState<string | null>(null);
  const [danger, setDanger] = useState(false);

  const bank = balances[ACCOUNT_CODES.bank]?.net ?? 0;
  const open = paymentNotes.filter((n) => ["approved", "scheduled"].includes(apStatus(n, apSteps))).sort((a, b) => a.dueOn.localeCompare(b.dueOn));
  const paid = paymentNotes.filter((n) => n.status === "paid").sort((a, b) => (b.paidOn ?? "").localeCompare(a.paidOn ?? ""));
  const dueNow = open.filter((n) => (apSteps[n.id]?.scheduledOn ?? "9999") <= DEMO_TODAY);
  const overdue = open.filter((n) => n.dueOn < DEMO_TODAY);
  const sum = (notes: PaymentNote[]) => notes.reduce((t, n) => t + n.amount, 0);

  const runDue = () => {
    const { paid: ok, skipped } = runDuePayments();
    setDanger(skipped > 0);
    setNotice(ok + skipped === 0 ? "No scheduled payments are due." : `Paid ${ok} supplier invoice${ok === 1 ? "" : "s"}${skipped ? `. ${skipped} skipped because the bank balance is too low` : ""}.`);
  };

  const payNow = (n: PaymentNote) => {
    const result = payVendor(n.id);
    setDanger(!result.ok);
    setNotice(result.ok ? `${n.id} paid: ${formatMoney(n.amount)}.` : result.reason === "cash" ? `The bank balance (${formatMoney(bank)}) does not cover ${formatMoney(n.amount)}.` : `${n.id} cannot be paid yet.`);
  };

  const columns: Column<PaymentNote>[] = [
    { key: "id", header: "Vendor invoice", cell: (n) => <span className="font-medium">{n.id}</span> },
    { key: "supplier", header: "Supplier", cell: (n) => <SupplierLink id={n.supplierId} /> },
    {
      key: "due",
      header: "Due",
      cell: (n) => (
        <div>
          <p>{formatDate(n.dueOn)}</p>
          {n.dueOn < DEMO_TODAY && <StatusBadge tone="danger">Overdue</StatusBadge>}
        </div>
      ),
    },
    { key: "amount", header: "Amount", align: "right", cell: (n) => formatMoney(n.amount) },
    { key: "schedule", header: "Pay on", cell: (n) => <ScheduleCell note={n} /> },
    { key: "status", header: "Status", cell: (n) => <StatusBadge meta={AP_STATUS_META[apStatus(n, apSteps)]} /> },
    { key: "pay", header: "Action", cell: (n) => <Button size="sm" onClick={() => payNow(n)}>Pay now</Button> },
  ];

  const paidColumns: Column<PaymentNote>[] = [
    { key: "id", header: "Vendor invoice", cell: (n) => <span className="font-medium">{n.id}</span> },
    { key: "supplier", header: "Supplier", cell: (n) => <SupplierLink id={n.supplierId} /> },
    { key: "amount", header: "Amount", align: "right", cell: (n) => formatMoney(n.amount) },
    { key: "paid", header: "Paid on", cell: (n) => (n.paidOn ? formatDate(n.paidOn) : "-") },
  ];

  return (
    <>
      <PageHeader
        title="Payment schedule"
        code="FIN05"
        description="Approved vendor invoices waiting to be paid. Schedule each one, or pay now. A payment is refused if the bank balance cannot cover it."
        actions={<Button onClick={runDue}>Run due payments</Button>}
      />

      <StatGrid>
        <StatTile label="Bank balance" value={formatMoney(bank)} />
        <StatTile label="Approved to pay" value={formatMoney(sum(open))} />
        <StatTile label="Scheduled up to today" value={formatMoney(sum(dueNow))} hint="Paid by Run due payments" />
        <StatTile label="Past due date" value={formatMoney(sum(overdue))} tone={overdue.length ? "danger" : undefined} />
      </StatGrid>

      <Notice tone={danger ? "warning" : "info"}>{notice}</Notice>

      <section aria-labelledby="open" className="mb-8">
        <h2 id="open" className="mb-3 font-semibold">Waiting to be paid</h2>
        <DataTable caption="Approved vendor invoices waiting to be paid" columns={columns} rows={open} rowKey={(n) => n.id} empty="Nothing is waiting. Approve vendor invoices first." />
      </section>

      <section aria-labelledby="paid">
        <h2 id="paid" className="mb-3 font-semibold">Paid</h2>
        <DataTable caption="Paid vendor invoices" columns={paidColumns} rows={paid} rowKey={(n) => n.id} empty="No payments yet." />
      </section>
    </>
  );
}
