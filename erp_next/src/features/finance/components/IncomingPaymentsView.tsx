"use client";

import { useState, type FormEvent } from "react";
import { PANEL_CLASS, PAYMENT_METHOD_LABEL, PAYMENT_METHOD_OPTIONS } from "@/common/const";
import type { Column, PaymentMethod, Receipt } from "@/common/type";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { Select } from "@/components/ui/Select";
import { StatGrid } from "@/components/ui/StatGrid";
import { StatTile } from "@/components/ui/StatTile";
import { CustomerLink } from "@/features/sales/components/CustomerLink";
import { useSales } from "@/features/sales/SalesProvider";
import { invoiceBalance } from "@/features/sales/utils";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/date";
import { formatMoney } from "@/lib/format";
import { useFinance } from "../FinanceProvider";

export function IncomingPaymentsView() {
  const { receipts, recordPayment } = useFinance();
  const { invoices, customersById } = useSales();
  const open = invoices.filter((i) => i.status === "issued" && invoiceBalance(i) > 0);

  const [invoiceId, setInvoiceId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("bank-transfer");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const chosen = open.find((i) => i.id === invoiceId) ?? open[0];
  const balance = chosen ? invoiceBalance(chosen) : 0;
  const invoiceOptions = open.map((i) => ({ value: i.id, label: `${i.id} – ${customersById[i.customerId]?.name ?? i.customerId} (${formatMoney(invoiceBalance(i))} due)` }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!chosen) return setError("There are no issued invoices waiting for payment.");
    const value = amount.trim() === "" ? balance : Number(amount);
    if (!Number.isFinite(value) || value <= 0) return setError("Enter an amount above 0.");
    if (value > balance) return setError(`The invoice only has ${formatMoney(balance)} left to pay.`);
    setError(null);
    recordPayment(chosen.id, value, method);
    setNotice(`Recorded ${formatMoney(value)} for ${chosen.id}${value < balance ? `. ${formatMoney(balance - value)} is still due` : ". The invoice is paid in full"}.`);
    setAmount("");
  };

  const columns: Column<Receipt>[] = [
    { key: "id", header: "Receipt", cell: (r) => <span className="font-medium">{r.id}</span> },
    { key: "date", header: "Received", cell: (r) => formatDate(r.receivedOn) },
    { key: "customer", header: "Customer", cell: (r) => <CustomerLink id={r.customerId} /> },
    { key: "invoice", header: "Invoice", cell: (r) => r.invoiceId },
    { key: "method", header: "Method", cell: (r) => PAYMENT_METHOD_LABEL[r.method] },
    { key: "amount", header: "Amount", align: "right", cell: (r) => formatMoney(r.amount) },
  ];

  const total = receipts.reduce((t, r) => t + r.amount, 0);

  return (
    <>
      <PageHeader
        title="Incoming payments"
        code="FIN07"
        description="Record money received from customers. A part payment leaves the invoice open for the balance. Each receipt is posted to the bank account."
      />

      <StatGrid columns={3}>
        <StatTile label="Received" value={formatMoney(total)} hint={`${receipts.length} receipts`} />
        <StatTile label="Invoices waiting for payment" value={open.length} />
        <StatTile label="Still due" value={formatMoney(open.reduce((t, i) => t + invoiceBalance(i), 0))} />
      </StatGrid>

      <Notice>{notice}</Notice>

      <form onSubmit={submit} noValidate className={cn(PANEL_CLASS, "mb-6")}>
        <h2 className="font-semibold">Record a payment</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Field label="Invoice" htmlFor="rc-invoice">
            <Select id="rc-invoice" value={chosen?.id ?? ""} options={invoiceOptions} onChange={setInvoiceId} />
          </Field>
          <Field label="Amount received" htmlFor="rc-amount" hint={chosen ? `Leave empty for the full ${formatMoney(balance)}.` : undefined} error={error}>
            <Input id="rc-amount" type="number" min={0} step={0.01} value={amount} onChange={(e) => setAmount(e.target.value)} invalid={Boolean(error)} className="tabular-nums" />
          </Field>
          <Field label="Method" htmlFor="rc-method">
            <Select id="rc-method" value={method} options={PAYMENT_METHOD_OPTIONS} onChange={setMethod} />
          </Field>
        </div>
        <div className="mt-4">
          <Button type="submit" disabled={!chosen}>Record payment</Button>
        </div>
      </form>

      <DataTable caption="Receipts" columns={columns} rows={receipts} rowKey={(r) => r.id} empty="No payments received yet." />
    </>
  );
}
