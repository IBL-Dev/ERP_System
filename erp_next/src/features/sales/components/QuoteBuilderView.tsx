"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PRICE_LIST, ROUTES, TIER_DISCOUNT_PCT, TIER_LABEL } from "@/common/const";
import type { Column, QuoteLine } from "@/common/type";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { DescriptionList } from "@/components/ui/DescriptionList";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Notice } from "@/components/ui/Notice";
import { NumberInput } from "@/components/ui/NumberInput";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { Select } from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatMoney, formatNumber } from "@/lib/format";
import { buildQuoteLine, lineTotal, linesSubtotal, linesTotal, priceBreakFor } from "@/lib/pricing";
import { useInventory } from "@/features/inventory/InventoryProvider";
import { useSales } from "../SalesProvider";
import { checkAvailability } from "../utils";

type Draft = { sku: string; qty: number };

export function QuoteBuilderView() {
  const router = useRouter();
  const { customers, customersById, createQuote } = useSales();
  const { items, itemsBySku } = useInventory();

  const sellable = items.filter((i) => PRICE_LIST[i.sku]);
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? "");
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [sku, setSku] = useState(sellable[0]?.sku ?? "");
  const [qty, setQty] = useState("1");
  const [error, setError] = useState<string | null>(null);

  const customer = customersById[customerId];
  const tier = customer?.tier ?? "standard";
  const lines = drafts.map((d) => buildQuoteLine(d.sku, d.qty, tier));
  const stock = Object.fromEntries(checkAvailability(lines, itemsBySku).map((l) => [l.sku, l]));

  const customerOptions = customers.map((c) => ({ value: c.id, label: `${c.name} (${TIER_LABEL[c.tier]})` }));
  const productOptions = sellable.map((i) => ({ value: i.sku, label: `${i.sku} – ${i.name} (${formatNumber(i.qty.available)} available now)` }));

  const addLine = () => {
    const n = Number(qty);
    if (!sku) return setError("Choose a product.");
    if (!Number.isInteger(n) || n < 1) return setError("Enter a whole quantity of 1 or more.");
    setError(null);
    setDrafts((prev) =>
      prev.some((d) => d.sku === sku) ? prev.map((d) => (d.sku === sku ? { ...d, qty: d.qty + n } : d)) : [...prev, { sku, qty: n }],
    );
    setQty("1");
  };

  const save = (send: boolean) => {
    if (!customerId) return setError("Choose a customer.");
    if (drafts.length === 0) return setError("Add at least one product.");
    const id = createQuote({ customerId, lines: drafts, send });
    router.push(ROUTES.sales.quote(id));
  };

  const columns: Column<QuoteLine>[] = [
    {
      key: "item",
      header: "Item",
      cell: (l) => (
        <div>
          <p className="font-medium">{itemsBySku[l.sku]?.name ?? l.sku}</p>
          <p className="text-xs text-ink-muted">{l.sku}</p>
        </div>
      ),
    },
    {
      key: "qty",
      header: "Qty",
      align: "right",
      cell: (l) => (
        <NumberInput
          value={l.qty}
          min={1}
          label={`Quantity of ${l.sku}`}
          onCommit={(n) => setDrafts((prev) => prev.map((d) => (d.sku === l.sku ? { ...d, qty: n } : d)))}
        />
      ),
    },
    {
      key: "price",
      header: "Unit price",
      align: "right",
      cell: (l) => (
        <div>
          <p>{formatMoney(l.unitPrice)}</p>
          <p className="text-xs text-ink-muted">from {priceBreakFor(l.sku, l.qty)?.minQty} units</p>
        </div>
      ),
    },
    { key: "disc", header: "Tier discount", align: "right", cell: (l) => `${l.discountPct}%` },
    { key: "total", header: "Line total", align: "right", cell: (l) => <strong>{formatMoney(lineTotal(l))}</strong> },
    {
      key: "stock",
      header: "Stock now",
      cell: (l) => {
        const s = stock[l.sku];
        return s?.ok ? (
          <StatusBadge tone="success">{formatNumber(s.available)} available</StatusBadge>
        ) : (
          <StatusBadge tone="warning">Only {formatNumber(s?.available ?? 0)} available</StatusBadge>
        );
      },
    },
    {
      key: "remove",
      header: "Remove",
      cell: (l) => (
        <Button size="sm" variant="secondary" onClick={() => setDrafts((prev) => prev.filter((d) => d.sku !== l.sku))}>
          Remove
        </Button>
      ),
    },
  ];

  const subtotal = linesSubtotal(lines);
  const total = linesTotal(lines);
  const anyShort = Object.values(stock).some((s) => !s.ok);

  return (
    <>
      <PageHeader
        title="New quote"
        code="SAL01"
        description="Pick a customer and add products. Unit prices follow the quantity price breaks, and the customer's tier discount is applied on top."
      />

      <Notice tone="danger">{error}</Notice>

      <div className="grid gap-6 xl:grid-cols-[22rem_1fr] xl:items-start">
        <Panel title="Customer and products" titleId="builder">
          <div className="mt-4 space-y-4">
            <Field label="Customer" htmlFor="quote-customer" hint={customer ? `${TIER_LABEL[tier]} tier: ${TIER_DISCOUNT_PCT[tier]}% discount` : undefined}>
              <Select id="quote-customer" value={customerId} options={customerOptions} onChange={setCustomerId} />
            </Field>
            <Field label="Product" htmlFor="quote-product">
              <Select id="quote-product" value={sku} options={productOptions} onChange={setSku} />
            </Field>
            <Field label="Quantity" htmlFor="quote-qty">
              <Input id="quote-qty" type="number" inputMode="numeric" min={1} step={1} value={qty} onChange={(e) => setQty(e.target.value)} className="tabular-nums" />
            </Field>
            <Button variant="secondary" onClick={addLine}>Add to quote</Button>
          </div>
        </Panel>

        <div>
          <DataTable caption="Quote lines" columns={columns} rows={lines} rowKey={(l) => l.sku} empty="No products yet. Add one on the left." />

          {anyShort && (
            <p className="mt-3 text-sm text-ink-muted">
              A stock shortage does not block a quote, but the order cannot be placed until enough stock is available.
            </p>
          )}

          <Panel className="mt-4">
            <DescriptionList
              items={[
                ["Subtotal", formatMoney(subtotal)],
                [`${TIER_LABEL[tier]} discount (${TIER_DISCOUNT_PCT[tier]}%)`, `-${formatMoney(subtotal - total)}`],
                ["Quote total", <strong key="t">{formatMoney(total)}</strong>],
              ]}
            />
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => save(false)}>Save as draft</Button>
              <Button onClick={() => save(true)}>Save and send to customer</Button>
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
