"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { PO_FILTERS, PO_STATUS_META, ROUTES } from "@/common/const";
import type { Column, PurchaseOrder, PurchaseOrderFilter } from "@/common/type";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { FilterBar } from "@/components/ui/FilterBar";
import { PageHeader } from "@/components/ui/PageHeader";
import { Select } from "@/components/ui/Select";
import { StatGrid } from "@/components/ui/StatGrid";
import { StatTile } from "@/components/ui/StatTile";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useInventory } from "@/features/inventory/InventoryProvider";
import { formatDate } from "@/lib/date";
import { formatMoney } from "@/lib/format";
import { useSupplier } from "../SupplierProvider";
import { isLate, poDisplayStatus, poTotal, poUnits } from "../utils";
import { SupplierLink } from "./SupplierLink";

export function PurchaseOrdersView() {
  const router = useRouter();
  const { orders } = useSupplier();
  const { itemsBySku, movements } = useInventory();
  const [filter, setFilter] = useState<PurchaseOrderFilter>("all");

  const rows = useMemo(
    () => orders.filter((o) => filter === "all" || poDisplayStatus(o, movements) === filter),
    [orders, movements, filter],
  );

  const open = orders.filter((o) => o.status === "issued");
  const late = orders.filter((o) => isLate(o, movements)).length;
  const arrived = orders.filter((o) => poDisplayStatus(o, movements) === "arrived").length;

  const columns: Column<PurchaseOrder>[] = [
    { key: "id", header: "Order", cell: (o) => <span className="font-medium">{o.id}</span> },
    { key: "supplier", header: "Supplier", cell: (o) => <SupplierLink id={o.supplierId} /> },
    { key: "items", header: "Items", cell: (o) => o.lines.map((l) => itemsBySku[l.sku]?.name ?? l.sku).join(", ") },
    { key: "units", header: "Units", align: "right", cell: (o) => poUnits(o) },
    { key: "total", header: "Total", align: "right", cell: (o) => formatMoney(poTotal(o)) },
    { key: "created", header: "Ordered", cell: (o) => formatDate(o.createdOn) },
    {
      key: "expected",
      header: "Expected",
      cell: (o) => (
        <div>
          <p>{formatDate(o.expectedOn)}</p>
          {isLate(o, movements) && <StatusBadge tone="danger">Late</StatusBadge>}
        </div>
      ),
    },
    { key: "status", header: "Status", cell: (o) => <StatusBadge meta={PO_STATUS_META[poDisplayStatus(o, movements)]} /> },
  ];

  return (
    <>
      <PageHeader
        title="Purchase orders"
        code="SUP05"
        description="Issuing an order at contract prices tells Inventory to expect the goods. Status follows the warehouse."
        actions={<Button onClick={() => router.push(ROUTES.supplier.newOrder)}>New purchase order</Button>}
      />

      <StatGrid>
        <StatTile label="Open orders" value={open.length} />
        <StatTile label="Open value" value={formatMoney(open.reduce((t, o) => t + poTotal(o), 0))} />
        <StatTile label="Late deliveries" value={late} tone={late ? "danger" : undefined} />
        <StatTile label="Arrived, confirm receipt" value={arrived} tone={arrived ? "warning" : undefined} />
      </StatGrid>

      <FilterBar>
        <Select variant="filter" id="po-filter" label="Status" value={filter} onChange={setFilter} options={PO_FILTERS} />
      </FilterBar>

      <DataTable caption="Purchase orders" columns={columns} rows={rows} rowKey={(o) => o.id} empty="No orders for this selection." />
    </>
  );
}
