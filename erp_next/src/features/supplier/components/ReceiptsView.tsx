"use client";

import Link from "next/link";
import { useState } from "react";
import { FINANCE_TEAM, PANEL_CLASS, PAYMENT_NOTE_STATUS_META, PO_STATUS_META, PRICE_TOLERANCE_PCT, ROUTES } from "@/common/const";
import type { Column, PaymentNote, PurchaseOrder } from "@/common/type";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { DescriptionList } from "@/components/ui/DescriptionList";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatGrid } from "@/components/ui/StatGrid";
import { StatTile } from "@/components/ui/StatTile";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useInventory } from "@/features/inventory/InventoryProvider";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/date";
import { formatMoney } from "@/lib/format";
import { useSupplier } from "../SupplierProvider";
import { isLate, noteDisplayStatus, poDisplayStatus, poTotal, poUnits, round2 } from "../utils";
import { SupplierLink } from "./SupplierLink";

/** One order that has reached the warehouse: confirm what was accepted, then tell Finance what to pay. */
function ConfirmReceiptCard({ po, onDone }: { po: PurchaseOrder; onDone: (message: string) => void }) {
  const { confirmReceipt } = useSupplier();
  const { itemsBySku } = useInventory();
  const ordered = poUnits(po);

  const [accepted, setAccepted] = useState(String(ordered));
  const [invoice, setInvoice] = useState(String(poTotal(po)));
  const [error, setError] = useState<string | null>(null);

  const acceptedQty = Number(accepted);
  const invoiceAmount = Number(invoice);
  const validQty = Number.isInteger(acceptedQty) && acceptedQty >= 0 && acceptedQty <= ordered;
  const validInvoice = Number.isFinite(invoiceAmount) && invoiceAmount > 0;
  const expected = validQty ? round2((poTotal(po) * acceptedQty) / ordered) : 0;
  const variance = validQty && validInvoice && expected > 0 ? ((invoiceAmount - expected) / expected) * 100 : null;

  const submit = () => {
    if (!validQty) return setError(`Accepted units must be a whole number from 0 to ${ordered}.`);
    if (!validInvoice) return setError("Enter the supplier invoice amount.");
    setError(null);
    confirmReceipt(po.id, { acceptedQty, invoiceAmount });
    onDone(`${po.id} confirmed. A payment note for ${formatMoney(invoiceAmount)} was sent to ${FINANCE_TEAM}.`);
  };

  return (
    <div className={cn(PANEL_CLASS, "space-y-4")}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold">{po.id}</h3>
        <SupplierLink id={po.supplierId} />
      </div>
      <DescriptionList
        items={[
          ["Items", po.lines.map((l) => `${l.qty} × ${itemsBySku[l.sku]?.name ?? l.sku}`).join(", ")],
          ["Ordered units", ordered],
          ["Order value", formatMoney(poTotal(po))],
        ]}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Units accepted" htmlFor={`acc-${po.id}`} hint="Fewer than ordered lowers order accuracy.">
          <Input id={`acc-${po.id}`} type="number" min={0} max={ordered} step={1} value={accepted} onChange={(e) => setAccepted(e.target.value)} invalid={!validQty} className="tabular-nums" />
        </Field>
        <Field label="Supplier invoice amount" htmlFor={`inv-${po.id}`} hint={`Expected ${formatMoney(expected)} at contract prices.`}>
          <Input id={`inv-${po.id}`} type="number" min={0} step={0.01} value={invoice} onChange={(e) => setInvoice(e.target.value)} invalid={!validInvoice} className="tabular-nums" />
        </Field>
      </div>
      <div aria-live="polite" className="text-sm">
        {variance === null ? null : variance > PRICE_TOLERANCE_PCT ? (
          <StatusBadge tone="danger">Invoice is {variance.toFixed(1)}% above the contract price</StatusBadge>
        ) : (
          <StatusBadge tone="success">Invoice matches the contract price</StatusBadge>
        )}
      </div>
      <Notice tone="danger">{error}</Notice>
      <Button onClick={submit}>Confirm receipt and send payment note</Button>
    </div>
  );
}

export function ReceiptsView() {
  const { orders, paymentNotes } = useSupplier();
  const { itemsBySku, movements } = useInventory();
  const [notice, setNotice] = useState<string | null>(null);

  const arrived = orders.filter((o) => poDisplayStatus(o, movements) === "arrived");
  const onTheWay = orders.filter((o) => poDisplayStatus(o, movements) === "on-the-way");
  const open = paymentNotes.filter((n) => n.status === "sent");
  const overdue = paymentNotes.filter((n) => noteDisplayStatus(n) === "overdue");

  const wayColumns: Column<PurchaseOrder>[] = [
    { key: "id", header: "Order", cell: (o) => <span className="font-medium">{o.id}</span> },
    { key: "supplier", header: "Supplier", cell: (o) => <SupplierLink id={o.supplierId} /> },
    { key: "items", header: "Items", cell: (o) => o.lines.map((l) => `${l.qty} × ${itemsBySku[l.sku]?.name ?? l.sku}`).join(", ") },
    { key: "expected", header: "Expected", cell: (o) => formatDate(o.expectedOn) },
    {
      key: "status",
      header: "Status",
      cell: (o) => (isLate(o, movements) ? <StatusBadge tone="danger">Late</StatusBadge> : <StatusBadge meta={PO_STATUS_META["on-the-way"]} />),
    },
  ];

  const noteColumns: Column<PaymentNote>[] = [
    { key: "id", header: "Payment note", cell: (n) => <span className="font-medium">{n.id}</span> },
    { key: "po", header: "Order", cell: (n) => n.poId },
    { key: "supplier", header: "Supplier", cell: (n) => <SupplierLink id={n.supplierId} /> },
    { key: "amount", header: "Amount", align: "right", cell: (n) => formatMoney(n.amount) },
    { key: "sent", header: "Sent", cell: (n) => formatDate(n.sentOn) },
    { key: "due", header: "Pay by", cell: (n) => formatDate(n.dueOn) },
    { key: "status", header: "Status", cell: (n) => <StatusBadge meta={PAYMENT_NOTE_STATUS_META[noteDisplayStatus(n)]} /> },
  ];

  return (
    <>
      <PageHeader
        title="Goods receipt and payment notes"
        code="SUP07"
        description={`When goods arrive in the warehouse, confirm what was accepted and send ${FINANCE_TEAM} a payment note for the supplier.`}
        actions={
          <Link href={ROUTES.inventory.movements} className="text-sm text-accent hover:underline">
            Receive goods in Inventory
          </Link>
        }
      />

      <StatGrid>
        <StatTile label="Arrived, confirm receipt" value={arrived.length} tone={arrived.length ? "warning" : undefined} />
        <StatTile label="Still on the way" value={onTheWay.length} />
        <StatTile label="Payment notes open" value={open.length} hint={formatMoney(open.reduce((t, n) => t + n.amount, 0))} />
        <StatTile label="Overdue to pay" value={overdue.length} tone={overdue.length ? "danger" : undefined} />
      </StatGrid>

      <Notice>{notice}</Notice>

      <section aria-labelledby="arrived" className="mb-8">
        <h2 id="arrived" className="mb-3 font-semibold">Arrived in the warehouse</h2>
        {arrived.length === 0 ? (
          <p className="text-sm text-ink-muted">
            Nothing is waiting. Orders appear here once Inventory marks the goods as received in Goods flow.
          </p>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {arrived.map((po) => (
              <ConfirmReceiptCard key={po.id} po={po} onDone={setNotice} />
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="way" className="mb-8">
        <h2 id="way" className="mb-3 font-semibold">On the way</h2>
        <DataTable caption="Orders on the way" columns={wayColumns} rows={onTheWay} rowKey={(o) => o.id} empty="No orders on the way." />
      </section>

      <section aria-labelledby="notes">
        <h2 id="notes" className="mb-3 font-semibold">Payment notes to {FINANCE_TEAM}</h2>
        <Notice>
          {FINANCE_TEAM} approves, schedules and pays these in{" "}
          <Link href={ROUTES.finance.payables} className="text-accent hover:underline">Finance, Accounts payable</Link>.
        </Notice>
        <DataTable caption="Supplier payment notes" columns={noteColumns} rows={paymentNotes} rowKey={(n) => n.id} empty="No payment notes yet." />
      </section>
    </>
  );
}
