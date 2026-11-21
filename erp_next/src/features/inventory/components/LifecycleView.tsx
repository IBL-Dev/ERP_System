"use client";

import { useMemo, useState } from "react";
import { EXPIRY_WARNING_DAYS, LIFECYCLE_FILTERS, STATUS_META } from "@/common/const";
import type { Column, LifecycleFilter, TrackedUnit } from "@/common/type";
import { DataTable } from "@/components/ui/DataTable";
import { FilterBar } from "@/components/ui/FilterBar";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { Select } from "@/components/ui/Select";
import { StatGrid } from "@/components/ui/StatGrid";
import { StatTile } from "@/components/ui/StatTile";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/date";
import { formatNumber } from "@/lib/format";
import { useInventory } from "../InventoryProvider";
import { daysUntil, expiryState } from "../utils";

function ExpiryCell({ date }: { date: string | null }) {
  if (!date) return <span className="text-ink-muted">No expiry</span>;
  const days = daysUntil(date);
  const state = expiryState(date);
  return (
    <div>
      <p>{formatDate(date)}</p>
      {state === "expired" ? (
        <StatusBadge tone="danger">Expired {Math.abs(days)} days ago</StatusBadge>
      ) : (
        <StatusBadge tone={state === "soon" ? "warning" : "success"}>{days} days left</StatusBadge>
      )}
    </div>
  );
}

export function LifecycleView() {
  const { units, itemsBySku } = useInventory();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<LifecycleFilter>("all");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return units.filter((u) => {
      const state = expiryState(u.expiryDate);
      if (filter === "serial" && u.kind !== "serial") return false;
      if (filter === "lot" && u.kind !== "lot") return false;
      if (filter === "soon" && state !== "soon") return false;
      if (filter === "expired" && state !== "expired") return false;
      const name = itemsBySku[u.sku]?.name ?? "";
      return !q || [u.id, u.sku, name].some((v) => v.toLowerCase().includes(q));
    });
  }, [units, itemsBySku, query, filter]);

  const columns: Column<TrackedUnit>[] = [
    { key: "id", header: "Serial / lot number", cell: (u) => <span className="font-medium">{u.id}</span> },
    {
      key: "item",
      header: "Item",
      cell: (u) => (
        <div>
          <p>{itemsBySku[u.sku]?.name ?? u.sku}</p>
          <p className="text-xs text-ink-muted">{u.sku}</p>
        </div>
      ),
    },
    { key: "kind", header: "Tracking", cell: (u) => (u.kind === "serial" ? "Serial number" : "Lot with expiry") },
    { key: "qty", header: "Qty", align: "right", cell: (u) => formatNumber(u.qty) },
    { key: "received", header: "Received", cell: (u) => formatDate(u.receivedOn) },
    { key: "expiry", header: "Expiry date", cell: (u) => <ExpiryCell date={u.expiryDate} /> },
    { key: "status", header: "Status", cell: (u) => <StatusBadge meta={STATUS_META[u.status]} /> },
  ];

  const serialCount = units.filter((u) => u.kind === "serial").length;
  const soonCount = units.filter((u) => expiryState(u.expiryDate) === "soon").length;
  const expiredCount = units.filter((u) => expiryState(u.expiryDate) === "expired").length;

  return (
    <>
      <PageHeader title="Item lifecycle" code="INV02" description="Follow each serial-numbered unit and each expiring lot from receipt to expiry." />

      <StatGrid columns={3}>
        <StatTile label="Serial-tracked units" value={serialCount} hint="Each has a unique serial number" />
        <StatTile label="Expiring soon" value={soonCount} hint={`Within ${EXPIRY_WARNING_DAYS} days`} tone={soonCount ? "warning" : undefined} />
        <StatTile label="Expired" value={expiredCount} hint="Remove from stock" tone={expiredCount ? "danger" : undefined} />
      </StatGrid>

      <FilterBar>
        <SearchInput id="life-search" label="Search serial or lot numbers" value={query} onChange={setQuery} placeholder="Search serial, lot or item" />
        <Select variant="filter" id="life-filter" label="Filter" value={filter} onChange={setFilter} options={LIFECYCLE_FILTERS} />
      </FilterBar>

      <DataTable caption="Serial numbers and expiry dates" columns={columns} rows={rows} rowKey={(u) => u.id} empty="No tracked units match your filter." />
      <p className="mt-3 text-xs text-ink-muted">Days left are counted from the demo date, 16 Nov 2026.</p>
    </>
  );
}
