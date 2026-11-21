"use client";

import { useMemo, useState } from "react";
import { LEVEL_META, STATUS_META, STOCK_LEVEL_FILTERS, STOCK_STATUSES } from "@/common/const";
import type { Column, StockItem, StockLevelFilter } from "@/common/type";
import { DataTable } from "@/components/ui/DataTable";
import { FilterBar } from "@/components/ui/FilterBar";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { Select } from "@/components/ui/Select";
import { StatGrid } from "@/components/ui/StatGrid";
import { StatTile } from "@/components/ui/StatTile";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatNumber } from "@/lib/format";
import { useInventory } from "../InventoryProvider";
import { stockLevel, sumStatus, totalQty } from "../utils";

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
  { key: "level", header: "Level", cell: (i) => <StatusBadge meta={LEVEL_META[stockLevel(i)]} /> },
];

export function StockLevelsView() {
  const { items } = useInventory();
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<StockLevelFilter>("all");

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

      <StatGrid>
        {STOCK_STATUSES.map((status) => (
          <StatTile key={status} label={STATUS_META[status].label} value={formatNumber(sumStatus(items, status))} hint="Units across all items" />
        ))}
      </StatGrid>

      <FilterBar>
        <SearchInput id="stock-search" label="Search items" value={query} onChange={setQuery} placeholder="Search SKU, item or location" />
        <Select variant="filter" id="stock-level" label="Stock level" value={level} onChange={setLevel} options={STOCK_LEVEL_FILTERS} />
      </FilterBar>

      <DataTable caption="Stock levels by item and status" columns={columns} rows={rows} rowKey={(i) => i.sku} empty="No items match your search." />
    </>
  );
}
