"use client";

import Link from "next/link";
import { useState } from "react";
import { LEVEL_META, ROUTES } from "@/common/const";
import type { Column, ReorderSuggestion } from "@/common/type";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatGrid } from "@/components/ui/StatGrid";
import { StatTile } from "@/components/ui/StatTile";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useInventory } from "@/features/inventory/InventoryProvider";
import { stockLevel } from "@/features/inventory/utils";
import { formatMoney, formatNumber } from "@/lib/format";
import { useSupplier } from "../SupplierProvider";
import { reorderSuggestions } from "../utils";
import { SupplierLink } from "./SupplierLink";

export function LowStockView() {
  const { suppliers, contracts, requisitions, requestReorder } = useSupplier();
  const { items } = useInventory();
  const [notice, setNotice] = useState<string | null>(null);

  const rows = reorderSuggestions(items, suppliers, contracts, requisitions);
  const newCost = rows
    .filter((r) => !r.openRequisition && r.offer)
    .reduce((t, r) => t + r.suggestedQty * (r.offer?.price ?? 0), 0);

  const order = (sku: string, name: string) => {
    const result = requestReorder(sku);
    if (result.ok) setNotice(`Requisition ${result.id} created for ${name}. It is waiting for approval.`);
    else setNotice(result.reason === "no-supplier" ? `No active supplier contract covers ${name}.` : `${name} already has an open requisition.`);
  };

  const columns: Column<ReorderSuggestion>[] = [
    {
      key: "item",
      header: "Item",
      cell: (r) => (
        <div>
          <p className="font-medium">{r.item.name}</p>
          <p className="text-xs text-ink-muted">{r.item.sku}</p>
        </div>
      ),
    },
    { key: "level", header: "Level", cell: (r) => <StatusBadge meta={LEVEL_META[stockLevel(r.item)]} /> },
    { key: "available", header: "Available", align: "right", cell: (r) => formatNumber(r.item.qty.available) },
    { key: "min", header: "Minimum", align: "right", cell: (r) => formatNumber(r.item.minStock) },
    { key: "transit", header: "Already on the way", align: "right", cell: (r) => formatNumber(r.item.qty.inTransit) },
    {
      key: "supplier",
      header: "Cheapest supplier",
      cell: (r) =>
        r.offer ? (
          <div>
            <SupplierLink id={r.offer.supplier.id} />
            <p className="text-xs text-ink-muted">{formatMoney(r.offer.price)} per {r.item.uom.replace(/s$/, "")}</p>
          </div>
        ) : (
          <StatusBadge tone="danger">No active contract</StatusBadge>
        ),
    },
    { key: "qty", header: "Suggested order", align: "right", cell: (r) => `${formatNumber(r.suggestedQty)} ${r.item.uom}` },
    { key: "cost", header: "Estimated cost", align: "right", cell: (r) => (r.offer ? formatMoney(r.suggestedQty * r.offer.price) : "-") },
    {
      key: "action",
      header: "Action",
      cell: (r) =>
        r.openRequisition ? (
          <StatusBadge tone="info">{r.openRequisition.id} {r.openRequisition.status === "pending" ? "awaiting approval" : "approved"}</StatusBadge>
        ) : (
          <Button size="sm" disabled={!r.offer} onClick={() => order(r.item.sku, r.item.name)}>Create requisition</Button>
        ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Low stock and reordering"
        code="SUP03"
        description="Items at or below their minimum safety stock in Inventory, with the cheapest supplier under an active contract."
        actions={
          <Link href={ROUTES.supplier.requisitions} className="text-sm text-accent hover:underline">
            Open requisitions
          </Link>
        }
      />

      <StatGrid>
        <StatTile label="Items to reorder" value={rows.length} tone={rows.length ? "warning" : undefined} />
        <StatTile label="Out of stock" value={rows.filter((r) => r.item.qty.available <= 0).length} tone={rows.some((r) => r.item.qty.available <= 0) ? "danger" : undefined} />
        <StatTile label="Already requested" value={rows.filter((r) => r.openRequisition).length} />
        <StatTile label="Cost of new requisitions" value={formatMoney(newCost)} hint="Not yet requested" />
      </StatGrid>

      <Notice>{notice}</Notice>

      <DataTable caption="Low-stock items and suggested orders" columns={columns} rows={rows} rowKey={(r) => r.item.sku} empty="Nothing is below its safety stock." />
      <p className="mt-3 text-xs text-ink-muted">Stock figures are live from Inventory. A requisition needs approval before it can become a purchase order.</p>
    </>
  );
}
