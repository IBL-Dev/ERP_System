"use client";

import Link from "next/link";
import { FULFILLMENT_META, FULFILLMENT_STAGES, ROUTES } from "@/common/const";
import type { Column, HandoffNotice } from "@/common/type";
import { DataTable } from "@/components/ui/DataTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatGrid } from "@/components/ui/StatGrid";
import { StatTile } from "@/components/ui/StatTile";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/date";
import { useInventory } from "@/features/inventory/InventoryProvider";
import { useSales } from "../SalesProvider";
import { fulfillmentOf } from "../utils";
import { CustomerLink } from "./CustomerLink";

export function FulfillmentView() {
  const { handoffs, ordersById } = useSales();
  const { movements } = useInventory();

  const stageOf = (notice: HandoffNotice) => {
    const order = ordersById[notice.orderId];
    return order ? fulfillmentOf(order, movements) : "open";
  };
  const count = (stage: (typeof FULFILLMENT_STAGES)[number]) => handoffs.filter((h) => stageOf(h) === stage).length;

  const columns: Column<HandoffNotice>[] = [
    { key: "at", header: "Sent", cell: (h) => formatDate(h.at) },
    { key: "order", header: "Order", cell: (h) => <span className="font-medium">{h.orderId}</span> },
    { key: "customer", header: "Customer", cell: (h) => (ordersById[h.orderId] ? <CustomerLink id={ordersById[h.orderId].customerId} /> : "-") },
    { key: "message", header: "Notification", cell: (h) => h.message },
    {
      key: "status",
      header: "Inventory status",
      cell: (h) => {
        const stage = stageOf(h);
        const step = FULFILLMENT_STAGES.indexOf(stage);
        return (
          <div className="min-w-40 space-y-1">
            <StatusBadge meta={FULFILLMENT_META[stage]} />
            <ProgressBar
              label={`${h.orderId} fulfillment progress`}
              value={((step + 1) / FULFILLMENT_STAGES.length) * 100}
              tone={stage === "shipped" ? "success" : "info"}
            />
          </div>
        );
      },
    },
  ];

  return (
    <>
      <PageHeader
        title="Fulfillment handoff"
        code="SAL04"
        description="The moment an order is placed, the Inventory team is notified and the stock is reserved. This log follows each order until it ships."
        actions={
          <Link href={ROUTES.inventory.movements} className="text-sm text-accent hover:underline">
            Open Goods flow in Inventory
          </Link>
        }
      />

      <StatGrid>
        <StatTile label="Notifications sent" value={handoffs.length} />
        <StatTile label="Waiting to be picked" value={count("open")} tone={count("open") ? "warning" : undefined} />
        <StatTile label="Being prepared" value={count("picked") + count("packed")} hint="Picked or packed" />
        <StatTile label="Shipped" value={count("shipped")} />
      </StatGrid>

      <DataTable caption="Handoff notifications to Inventory" columns={columns} rows={handoffs} rowKey={(h) => h.id} empty="No orders have been handed off yet." />
    </>
  );
}
