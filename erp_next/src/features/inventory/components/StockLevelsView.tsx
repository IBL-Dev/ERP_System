"use client";

import { useMemo, useState } from "react";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatTile } from "@/components/ui/StatTile";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { controlClass } from "@/components/ui/controls";
import { cn } from "@/lib/cn";
import { useInventory } from "../InventoryProvider";
import type { StockItem } from "../types";
import { LEVEL_META, STATUS_META, STOCK_STATUSES, formatNumber, stockLevel, sumStatus, totalQty } from "../utils";

type LevelFilter = "all" | "alerts" | "out";

const columns: Column<StockItem>[] = [
  { key: "sku", header: "SKU", cell: (i) => i.sku },
  {
    key: "name",
    header: "Item",
    cell: (i) => (
      <div>
        <p className="font-medium">{i.name}</p>
        <p className="text-xs text-ink-muted">Location {i.location}</p>
      </div>
    ),
  },
  ...STOCK_STATUSES.map<Column<StockItem>>((status) => ({
    key: status,
    header: STATUS_META[status].label,
    align: "right",
    cell: (i) => formatNumber(i.qty[status]),
  })),
  { key: "total", header: "Total", align: "right", cell: (i) => <strong>{formatNumber(totalQty(i))}</strong> },
  { key: "uom", header: "Unit", cell: (i) => i.uom },
  {
    key: "level",
    header: "Level",
    cell: (i) => <StatusBadge tone={LEVEL_META[stockLevel(i)].tone}>{LEVEL_META[stockLevel(i)].label}</StatusBadge>,
  },
];

export function StockLevelsView() {
  const { items } = useInventory();
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<LevelFilter>("all");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((i) => {
      const l = stockLevel(i);
      if (level === "alerts" && l === "ok") return false;
      if (level === "out" && l !== "out") return false;
      return !q || [i.sku, i.name, i.location].some((v) => v.toLowerCase().includes(q));
    });
  }, [items, query, level]);

  return (
    <>
      <PageHeader
        title="Stock levels"
        code="INV01"
        description="Exact quantity of every item, split by status. Figures change as soon as a movement or count is posted."
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STOCK_STATUSES.map((status) => (
          <StatTile
            key={status}
            label={STATUS_META[status].label}
            value={formatNumber(sumStatus(items, status))}
            hint="Units across all items"
          />
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label htmlFor="stock-search" className="sr-only">Search items</label>
        <input
          id="stock-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search SKU, item or location"
          className={cn(controlClass, "h-9 w-64")}
        />
        <label htmlFor="stock-level" className="sr-only">Stock level</label>
        <select
          id="stock-level"
          value={level}
          onChange={(e) => setLevel(e.target.value as LevelFilter)}
          className={cn(controlClass, "h-9")}
        >
          <option value="all">All items</option>
          <option value="alerts">Low or out of stock</option>
          <option value="out">Out of stock</option>
        </select>
      </div>

      <DataTable caption="Stock levels by item and status" columns={columns} rows={rows} rowKey={(i) => i.sku} empty="No items match your search." />
    </>
  );
}
