"use client";

import Link from "next/link";
import { ROUTES, STAFF_NAMES } from "@/common/const";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { StatGrid } from "@/components/ui/StatGrid";
import { StatTile } from "@/components/ui/StatTile";
import { useInventory } from "@/features/inventory/InventoryProvider";
import { formatDate } from "@/lib/date";
import { formatMoney } from "@/lib/format";
import { useSupplier } from "../SupplierProvider";
import { canApprove, isLate, poDisplayStatus, reorderSuggestions, requisitionValue } from "../utils";
import { SupplierLink } from "./SupplierLink";

export function OverviewView() {
  const { suppliers, contracts, requisitions, orders, paymentNotes, meId } = useSupplier();
  const { items, movements } = useInventory();

  const toReorder = reorderSuggestions(items, suppliers, contracts, requisitions).filter((s) => !s.openRequisition).length;
  const awaitingMe = requisitions.filter((r) => canApprove(r, meId));
  const arrived = orders.filter((o) => poDisplayStatus(o, movements) === "arrived").length;
  const late = orders.filter((o) => isLate(o, movements));
  const openNotes = paymentNotes.filter((n) => n.status === "sent").length;

  return (
    <>
      <PageHeader title="Supplier overview" code="SUP00" description="What needs buying, approving and confirming today." />

      <StatGrid columns={5}>
        <StatTile label="Active suppliers" value={suppliers.filter((s) => s.status === "active").length} href={ROUTES.supplier.suppliers} />
        <StatTile
          label="Low stock, not requested"
          value={toReorder}
          tone={toReorder ? "warning" : undefined}
          href={ROUTES.supplier.reorder}
        />
        <StatTile
          label="Requisitions awaiting me"
          value={awaitingMe.length}
          tone={awaitingMe.length ? "warning" : undefined}
          href={ROUTES.supplier.requisitions}
        />
        <StatTile
          label="Arrived, confirm receipt"
          value={arrived}
          tone={arrived ? "warning" : undefined}
          href={ROUTES.supplier.receipts}
        />
        <StatTile label="Payment notes open" value={openNotes} hint="Sent to Finance, not paid" href={ROUTES.supplier.receipts} />
      </StatGrid>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          title="Requisitions awaiting your approval"
          titleId="approvals"
          actions={
            <Link href={ROUTES.supplier.requisitions} className="text-sm text-accent hover:underline">
              Open requisitions
            </Link>
          }
        >
          {awaitingMe.length === 0 ? (
            <p className="mt-4 text-sm text-ink-muted">Nothing to approve right now.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {awaitingMe.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <div>
                    <p className="font-medium">{r.id}</p>
                    <p className="text-xs text-ink-muted">
                      {r.qty} × {r.sku}, requested by {r.requestedBy}
                    </p>
                  </div>
                  <span className="tabular-nums">{formatMoney(requisitionValue(r))}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Deliveries running late" titleId="late">
          {late.length === 0 ? (
            <p className="mt-4 text-sm text-ink-muted">Every open order is on schedule.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {late.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <div>
                    <p className="font-medium">{o.id}</p>
                    <SupplierLink id={o.supplierId} />
                  </div>
                  <span className="text-xs text-ink-muted">Expected {formatDate(o.expectedOn)}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-ink-muted">Approvers are the requester&apos;s department head, or {STAFF_NAMES["EMP-1005"]} above the approval limit.</p>
        </Panel>
      </div>
    </>
  );
}
