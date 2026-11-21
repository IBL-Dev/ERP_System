"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { REQUISITION_APPROVAL_LIMIT, REQUISITION_FILTERS, REQUISITION_STATUS_META, ROUTES, STAFF_NAMES } from "@/common/const";
import type { Column, Requisition, RequisitionFilter } from "@/common/type";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { FilterBar } from "@/components/ui/FilterBar";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { Select } from "@/components/ui/Select";
import { StatGrid } from "@/components/ui/StatGrid";
import { StatTile } from "@/components/ui/StatTile";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useInventory } from "@/features/inventory/InventoryProvider";
import { formatDate } from "@/lib/date";
import { formatMoney, formatNumber } from "@/lib/format";
import { useSupplier } from "../SupplierProvider";
import { approverIdFor, canApprove, requisitionValue } from "../utils";
import { SupplierLink } from "./SupplierLink";

export function RequisitionsView() {
  const { requisitions, meId, decideRequisition, createOrder } = useSupplier();
  const { itemsBySku } = useInventory();
  const [filter, setFilter] = useState<RequisitionFilter>("all");
  const [notice, setNotice] = useState<string | null>(null);

  const rows = useMemo(() => requisitions.filter((r) => filter === "all" || r.status === filter), [requisitions, filter]);

  const awaitingMe = requisitions.filter((r) => canApprove(r, meId)).length;
  const pending = requisitions.filter((r) => r.status === "pending").length;
  const approved = requisitions.filter((r) => r.status === "approved").length;

  const makeOrder = (r: Requisition) => {
    const id = createOrder({ supplierId: r.supplierId, lines: [{ sku: r.sku, qty: r.qty }], requisitionId: r.id });
    setNotice(id ? `Purchase order ${id} issued. Inventory has been told to expect the goods.` : "The purchase order could not be created. Check the supplier contract.");
  };

  const columns: Column<Requisition>[] = [
    { key: "id", header: "Requisition", cell: (r) => <span className="font-medium">{r.id}</span> },
    {
      key: "item",
      header: "Item",
      cell: (r) => (
        <div>
          <p>{itemsBySku[r.sku]?.name ?? r.sku}</p>
          <p className="text-xs text-ink-muted">{r.sku}</p>
        </div>
      ),
    },
    { key: "qty", header: "Qty", align: "right", cell: (r) => formatNumber(r.qty) },
    { key: "supplier", header: "Supplier", cell: (r) => <SupplierLink id={r.supplierId} /> },
    { key: "value", header: "Value", align: "right", cell: (r) => formatMoney(requisitionValue(r)) },
    {
      key: "by",
      header: "Requested by",
      cell: (r) => (
        <div>
          <p>{r.requestedBy}</p>
          <p className="text-xs text-ink-muted">{formatDate(r.createdOn)}</p>
        </div>
      ),
    },
    { key: "status", header: "Status", cell: (r) => <StatusBadge meta={REQUISITION_STATUS_META[r.status]} /> },
    {
      key: "action",
      header: "Next step",
      cell: (r) => {
        if (r.status === "pending") {
          // Approval control: only the responsible approver sees the buttons.
          return canApprove(r, meId) ? (
            <div className="flex gap-2">
              <Button size="sm" onClick={() => decideRequisition(r.id, "approved")}>Approve</Button>
              <Button size="sm" variant="secondary" onClick={() => decideRequisition(r.id, "rejected")}>Reject</Button>
            </div>
          ) : (
            <span className="text-sm text-ink-muted">Awaiting {STAFF_NAMES[approverIdFor(r)]}</span>
          );
        }
        if (r.status === "approved") return <Button size="sm" onClick={() => makeOrder(r)}>Create purchase order</Button>;
        if (r.status === "ordered") return <span className="text-sm text-ink-muted">{r.poId}</span>;
        return <span className="text-sm text-ink-muted">Rejected by {r.decidedBy ? STAFF_NAMES[r.decidedBy] : "-"}</span>;
      },
    },
  ];

  return (
    <>
      <PageHeader
        title="Purchase requisitions"
        code="SUP04"
        description={`A requisition is an internal request to buy. The requester's department head approves it, or the Supplier department head when it is above ${formatMoney(REQUISITION_APPROVAL_LIMIT)}.`}
        actions={
          <Link href={ROUTES.supplier.reorder} className="text-sm text-accent hover:underline">
            Low stock list
          </Link>
        }
      />

      <StatGrid columns={3}>
        <StatTile label="Waiting for your decision" value={awaitingMe} tone={awaitingMe ? "warning" : undefined} />
        <StatTile label="Awaiting approval" value={pending} hint="Everyone's requests" />
        <StatTile label="Approved, ready to order" value={approved} />
      </StatGrid>

      <Notice>{notice}</Notice>

      <FilterBar>
        <Select variant="filter" id="pr-filter" label="Status" value={filter} onChange={setFilter} options={REQUISITION_FILTERS} />
      </FilterBar>

      <DataTable caption="Purchase requisitions" columns={columns} rows={rows} rowKey={(r) => r.id} empty="No requisitions for this selection." />
    </>
  );
}
