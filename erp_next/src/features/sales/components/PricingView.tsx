"use client";

import { PRICE_LIST, QUOTE_VALIDITY_DAYS, TIER_DISCOUNT_PCT, TIER_LABEL } from "@/common/const";
import type { Column, CustomerTier, StockItem } from "@/common/type";
import { DataTable } from "@/components/ui/DataTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatMoney, formatNumber } from "@/lib/format";
import { useInventory } from "@/features/inventory/InventoryProvider";

type TierRow = { tier: CustomerTier };

const tierColumns: Column<TierRow>[] = [
  { key: "tier", header: "Customer tier", cell: (r) => TIER_LABEL[r.tier] },
  { key: "pct", header: "Extra discount", align: "right", cell: (r) => `${TIER_DISCOUNT_PCT[r.tier]}%` },
];

export function PricingView() {
  const { items } = useInventory();
  const sellable = items.filter((i) => PRICE_LIST[i.sku]);

  const columns: Column<StockItem>[] = [
    { key: "sku", header: "SKU", cell: (i) => i.sku },
    { key: "name", header: "Item", cell: (i) => <span className="font-medium">{i.name}</span> },
    {
      key: "breaks",
      header: "Price breaks (per unit)",
      cell: (i) => (
        <ul className="flex flex-wrap gap-x-4 gap-y-1">
          {PRICE_LIST[i.sku].map((b) => (
            <li key={b.minQty} className="whitespace-nowrap">
              <span className="text-ink-muted">{formatNumber(b.minQty)}+ units: </span>
              <span className="tabular-nums">{formatMoney(b.unitPrice)}</span>
            </li>
          ))}
        </ul>
      ),
    },
    { key: "available", header: "Available now", align: "right", cell: (i) => formatNumber(i.qty.available) },
  ];

  return (
    <>
      <PageHeader
        title="Pricing rules"
        code="SAL02"
        description="How quote prices are worked out. The quantity price break sets the unit price, then the customer tier discount is taken off the line."
      />

      <section aria-labelledby="breaks" className="mb-8">
        <h2 id="breaks" className="mb-3 font-semibold">Quantity price breaks</h2>
        <DataTable caption="Quantity price breaks per item" columns={columns} rows={sellable} rowKey={(i) => i.sku} />
      </section>

      <section aria-labelledby="tiers" className="max-w-md">
        <h2 id="tiers" className="mb-3 font-semibold">Customer tier discounts</h2>
        <DataTable
          caption="Customer tier discounts"
          columns={tierColumns}
          rows={(Object.keys(TIER_LABEL) as CustomerTier[]).map((tier) => ({ tier }))}
          rowKey={(r) => r.tier}
        />
      </section>

      <p className="mt-6 text-xs text-ink-muted">
        Quotes stay valid for {QUOTE_VALIDITY_DAYS} days. These are sample prices. Edit them in common/const/sales.const.ts, or connect a price-list API later.
      </p>
    </>
  );
}
