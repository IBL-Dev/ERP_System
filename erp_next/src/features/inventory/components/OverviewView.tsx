"use client";

import Link from "next/link";
import { LEVEL_META, ROUTES, STATUS_META, STOCK_STATUSES } from "@/common/const";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatGrid } from "@/components/ui/StatGrid";
import { StatTile } from "@/components/ui/StatTile";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatNumber } from "@/lib/format";
import { useInventory } from "../InventoryProvider";
import { expiryState, nextStage, stockLevel, sumStatus } from "../utils";

export function OverviewView() {
  const { items, units, movements } = useInventory();

  const alerts = items.filter((i) => stockLevel(i) !== "ok").sort((a, b) => a.qty.available - b.qty.available);
  const expiryAlerts = units.filter((u) => ["soon", "expired"].includes(expiryState(u.expiryDate))).length;
  const openMovements = movements.filter((m) => nextStage(m) !== null).length;

  const grandTotal = STOCK_STATUSES.reduce((t, s) => t + sumStatus(items, s), 0);

  return (
    <>
      <PageHeader title="Inventory overview" code="INV00" description="Where stock stands today and what needs attention." />

      <StatGrid columns={5}>
        <StatTile label="Items" value={items.length} hint="Active SKUs" href={ROUTES.inventory.stock} />
        <StatTile label="Units available" value={formatNumber(sumStatus(items, "available"))} hint="Ready to sell" href={ROUTES.inventory.stock} />
        <StatTile
          label="Low-stock alerts"
          value={alerts.length}
          hint="At or below safety stock"
          tone={alerts.length ? "danger" : undefined}
          href={ROUTES.inventory.reorder}
        />
        <StatTile
          label="Expiry alerts"
          value={expiryAlerts}
          hint="Expired or due within 30 days"
          tone={expiryAlerts ? "warning" : undefined}
          href={ROUTES.inventory.lifecycle}
        />
        <StatTile label="Open movements" value={openMovements} hint="Receipts and orders in progress" href={ROUTES.inventory.movements} />
      </StatGrid>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Stock by status" titleId="by-status">
          <ul className="mt-4 space-y-3">
            {STOCK_STATUSES.map((status) => {
              const total = sumStatus(items, status);
              const meta = STATUS_META[status];
              return (
                <li key={status}>
                  <div className="flex items-center justify-between text-sm">
                    <StatusBadge meta={meta} />
                    <span className="tabular-nums">{formatNumber(total)} units</span>
                  </div>
                  <ProgressBar
                    className="mt-1"
                    label={`${meta.label} share of all units`}
                    value={grandTotal ? (total / grandTotal) * 100 : 0}
                    tone={meta.tone === "neutral" ? "accent" : meta.tone}
                  />
                </li>
              );
            })}
          </ul>
        </Panel>

        <Panel
          title="Low-stock alerts"
          titleId="alerts"
          actions={
            <Link href={ROUTES.inventory.reorder} className="text-sm text-accent hover:underline">
              Open reorder control
            </Link>
          }
        >
          {alerts.length === 0 ? (
            <p className="mt-4 text-sm text-ink-muted">Every item is above its safety stock.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {alerts.slice(0, 6).map((item) => (
                <li key={item.sku} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{item.name}</p>
                    <p className="text-xs text-ink-muted">
                      {formatNumber(item.qty.available)} available, minimum {formatNumber(item.minStock)}
                    </p>
                  </div>
                  <StatusBadge meta={LEVEL_META[stockLevel(item)]} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
