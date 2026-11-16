"use client";

import { useEffect, useMemo, useState } from "react";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { controlClass } from "@/components/ui/controls";
import { cn } from "@/lib/cn";
import { useInventory } from "../InventoryProvider";
import type { StockItem } from "../types";
import { LEVEL_META, formatNumber, stockLevel } from "../utils";

/** Number input that saves on blur or Enter, and reverts if the value is not a whole number >= 0. */
function NumberCell({ value, label, onCommit }: { value: number; label: string; onCommit: (n: number) => void }) {
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);

  const commit = () => {
    const n = Number(text);
    if (text.trim() !== "" && Number.isInteger(n) && n >= 0) onCommit(n);
    else setText(String(value));
  };

  return (
    <input
      type="number"
      inputMode="numeric"
      min={0}
      step={1}
      aria-label={label}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
      className={cn(controlClass, "h-8 w-24 text-right tabular-nums")}
    />
  );
}

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
        <NumberCell
          value={i.minStock}
          label={`Minimum safety stock for ${i.name}`}
          onCommit={(n) => setThresholds(i.sku, n, i.reorderQty)}
        />
      ),
    },
    {
      key: "reorder",
      header: "Reorder quantity",
      align: "right",
      cell: (i) => (
        <NumberCell
          value={i.reorderQty}
          label={`Reorder quantity for ${i.name}`}
          onCommit={(n) => setThresholds(i.sku, i.minStock, n)}
        />
      ),
    },
    {
      key: "suggest",
      header: "Suggested order",
      align: "right",
      cell: (i) => (stockLevel(i) === "ok" ? <span className="text-ink-muted">–</span> : `${formatNumber(i.reorderQty)} ${i.uom}`),
    },
    {
      key: "alert",
      header: "Alert",
      cell: (i) => <StatusBadge tone={LEVEL_META[stockLevel(i)].tone}>{LEVEL_META[stockLevel(i)].label}</StatusBadge>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Reorder control"
        code="INV05"
        description="Set the minimum safety stock per item. An alert shows when available stock falls to that level or below."
      />

      <p
        role="status"
        className={cn("mb-4 border-l-4 border-warning bg-panel px-3 py-2 text-sm", alertCount === 0 && "hidden")}
      >
        {alertCount} item{alertCount === 1 ? " is" : "s are"} at or below minimum safety stock. Suggested order quantities are
        shown below.
      </p>

      <label className="mb-4 flex w-fit items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={onlyAlerts}
          onChange={(e) => setOnlyAlerts(e.target.checked)}
          className="h-4 w-4 accent-[var(--accent)]"
        />
        Show only items with alerts
      </label>

      <DataTable caption="Safety stock limits and low-stock alerts" columns={columns} rows={rows} rowKey={(i) => i.sku} empty="No alerts. Every item is above its safety stock." />
      <p className="mt-3 text-xs text-ink-muted">Edit a limit and press Enter or move to another field to save it.</p>
    </>
  );
}
