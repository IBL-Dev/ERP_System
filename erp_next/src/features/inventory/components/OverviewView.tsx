"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatTile } from "@/components/ui/StatTile";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useInventory } from "../InventoryProvider";
import {
  LEVEL_META,
  STATUS_META,
  STOCK_STATUSES,
  expiryState,
  formatNumber,
  nextStage,
  stockLevel,
  sumStatus,
} from "../utils";

export function OverviewView() {
  const { items, units, movements } = useInventory();

  const alerts = items.filter((i) => stockLevel(i) !== "ok").sort((a, b) => a.qty.available - b.qty.available);
  const expiryAlerts = units.filter((u) => ["soon", "expired"].includes(expiryState(u.expiryDate))).length;
  const openMovements = movements.filter((m) => nextStage(m) !== null).length;

  const grandTotal = STOCK_STATUSES.reduce((t, s) => t + sumStatus(items, s), 0);

  return (
    <>
      <PageHeader
        title="Inventory overview"
        code="INV00"
        description="Where stock stands today and what needs attention."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatTile label="Items" value={items.length} hint="Active SKUs" href="/inventory/stock" />
        <StatTile label="Units available" value={formatNumber(sumStatus(items, "available"))} hint="Ready to sell" href="/inventory/stock" />
        <StatTile
          label="Low-stock alerts"
          value={alerts.length}
          hint="At or below safety stock"
          tone={alerts.length ? "danger" : undefined}
          href="/inventory/reorder"
        />
        <StatTile
          label="Expiry alerts"
          value={expiryAlerts}
          hint="Expired or due within 30 days"
          tone={expiryAlerts ? "warning" : undefined}
          href="/inventory/lifecycle"
        />
        <StatTile label="Open movements" value={openMovements} hint="Receipts and orders in progress" href="/inventory/movements" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="by-status" className="rounded-md border border-line bg-panel p-4">
          <h2 id="by-status" className="font-semibold">Stock by status</h2>
          <ul className="mt-4 space-y-3">
            {STOCK_STATUSES.map((status) => {
              const total = sumStatus(items, status);
              const pct = grandTotal ? Math.round((total / grandTotal) * 100) : 0;
              return (
                <li key={status}>
                  <div className="flex items-center justify-between text-sm">
                    <StatusBadge tone={STATUS_META[status].tone}>{STATUS_META[status].label}</StatusBadge>
                    <span className="tabular-nums">{formatNumber(total)} units</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-hover" aria-hidden>
                    <div className={`h-full ${STATUS_META[status].bar}`} style={{ width: `${pct}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-labelledby="alerts" className="rounded-md border border-line bg-panel p-4">
          <div className="flex items-center justify-between">
            <h2 id="alerts" className="font-semibold">Low-stock alerts</h2>
            <Link href="/inventory/reorder" className="text-sm text-accent hover:underline">
              Open reorder control
            </Link>
          </div>
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
                  <StatusBadge tone={LEVEL_META[stockLevel(item)].tone}>{LEVEL_META[stockLevel(item)].label}</StatusBadge>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
