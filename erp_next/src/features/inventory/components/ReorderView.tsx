"use client";

import { useMemo, useState } from "react";
import { LEVEL_META } from "@/common/const";
import type { Column, StockItem } from "@/common/type";
import { DataTable } from "@/components/ui/DataTable";
import { FilterBar } from "@/components/ui/FilterBar";
import { Notice } from "@/components/ui/Notice";
import { NumberInput } from "@/components/ui/NumberInput";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatNumber } from "@/lib/format";
import { useInventory } from "../InventoryProvider";
import { stockLevel } from "../utils";

export function ReorderView() {
  const { items, setThresholds } = useInventory();
  const [onlyAlerts, setOnlyAlerts] = useState(false);

  const alertCount = items.filter((i) => stockLevel(i) !== "ok").length;

  const rows = useMemo(() => {
    const severity = { out: 0, low: 1, ok: 2 } as const;
    return items
      .filter((i) => !onlyAlerts || stockLevel(i) !== "ok")
      .sort((a, b) => severity[stockLevel(a)] - severity[stockLevel(b)] || a.name.localeCompare(b.name));
  }, [items, onlyAlerts]);

  const columns: Column<StockItem>[] = [
    { key: "sku", header: "SKU", cell: (i) => i.sku },
    { key: "name", header: "Item", cell: (i) => <span className="font-medium">{i.name}</span> },
    { key: "available", header: "Available", align: "right", cell: (i) => formatNumber(i.qty.available) },
    { key: "transit", header: "In transit", align: "right", cell: (i) => formatNumber(i.qty.inTransit) },
    {
      key: "min",
      header: "Minimum safety stock",
      align: "right",
      cell: (i) => (
        <NumberInput value={i.minStock} label={`Minimum safety stock for ${i.name}`} onCommit={(n) => setThresholds(i.sku, n, i.reorderQty)} />
      ),
    },
    {
      key: "reorder",
      header: "Reorder quantity",
      align: "right",
      cell: (i) => (
        <NumberInput value={i.reorderQty} label={`Reorder quantity for ${i.name}`} onCommit={(n) => setThresholds(i.sku, i.minStock, n)} />
      ),
    },
    {
      key: "suggest",
      header: "Suggested order",
      align: "right",
      cell: (i) => (stockLevel(i) === "ok" ? <span className="text-ink-muted">–</span> : `${formatNumber(i.reorderQty)} ${i.uom}`),
    },
    { key: "alert", header: "Alert", cell: (i) => <StatusBadge meta={LEVEL_META[stockLevel(i)]} /> },
  ];

  return (
    <>
      <PageHeader
        title="Reorder control"
        code="INV05"
        description="Set the minimum safety stock per item. An alert shows when available stock falls to that level or below."
      />

      <Notice tone="warning">
        {alertCount > 0 &&
          `${alertCount} item${alertCount === 1 ? " is" : "s are"} at or below minimum safety stock. Suggested order quantities are shown below.`}
      </Notice>

      <FilterBar>
        <label className="flex w-fit items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={onlyAlerts}
            onChange={(e) => setOnlyAlerts(e.target.checked)}
            className="h-4 w-4 accent-[var(--accent)]"
          />
          Show only items with alerts
        </label>
      </FilterBar>

      <DataTable caption="Safety stock limits and low-stock alerts" columns={columns} rows={rows} rowKey={(i) => i.sku} empty="No alerts. Every item is above its safety stock." />
      <p className="mt-3 text-xs text-ink-muted">Edit a limit and press Enter or move to another field to save it.</p>
    </>
  );
}
