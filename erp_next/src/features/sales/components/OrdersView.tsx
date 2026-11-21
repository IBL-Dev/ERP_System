"use client";

import { useMemo, useState } from "react";
import { FULFILLMENT_META, INVOICE_STATUS_META, ORDER_FILTERS } from "@/common/const";
import type { Column, OrderFilter, SalesOrder } from "@/common/type";
import { DataTable } from "@/components/ui/DataTable";
import { FilterBar } from "@/components/ui/FilterBar";
import { PageHeader } from "@/components/ui/PageHeader";
import { Select } from "@/components/ui/Select";
import { StatGrid } from "@/components/ui/StatGrid";
import { StatTile } from "@/components/ui/StatTile";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/date";
import { formatMoney } from "@/lib/format";
import { linesTotal } from "@/lib/pricing";
import { useInventory } from "@/features/inventory/InventoryProvider";
import { useSales } from "../SalesProvider";
import { fulfillmentOf, invoiceDisplayStatus } from "../utils";
import { CustomerLink } from "./CustomerLink";

export function OrdersView() {
  const { orders, invoices } = useSales();
  const { movements } = useInventory();
  const [filter, setFilter] = useState<OrderFilter>("all");

  const rows = useMemo(
    () =>
      orders.filter((o) => {
        const shipped = fulfillmentOf(o, movements) === "shipped";
        return filter === "all" || (filter === "shipped" ? shipped : !shipped);
      }),
    [orders, movements, filter],
  );

  const toShip = orders.filter((o) => fulfillmentOf(o, movements) !== "shipped").length;
  const value = orders.reduce((t, o) => t + linesTotal(o.lines), 0);

  const columns: Column<SalesOrder>[] = [
    { key: "id", header: "Order", cell: (o) => <span className="font-medium">{o.id}</span> },
    { key: "customer", header: "Customer", cell: (o) => <CustomerLink id={o.customerId} /> },
    { key: "quote", header: "From quote", cell: (o) => o.quoteId ?? "-" },
    { key: "placed", header: "Placed", cell: (o) => formatDate(o.placedOn) },
    { key: "units", header: "Units", align: "right", cell: (o) => o.lines.reduce((t, l) => t + l.qty, 0) },
    { key: "total", header: "Total", align: "right", cell: (o) => formatMoney(linesTotal(o.lines)) },
    { key: "fulfillment", header: "Fulfillment", cell: (o) => <StatusBadge meta={FULFILLMENT_META[fulfillmentOf(o, movements)]} /> },
    {
      key: "billing",
      header: "Billing",
      cell: (o) => {
        const invoice = invoices.find((i) => i.id === o.invoiceId);
        return invoice ? <StatusBadge meta={INVOICE_STATUS_META[invoiceDisplayStatus(invoice)]} /> : <span className="text-ink-muted">Not invoiced</span>;
      },
    },
  ];

  return (
    <>
      <PageHeader
        title="Sales orders"
        code="SAL03"
        description="Orders are created from approved quotes. Placing an order checks live stock, reserves it and notifies the Inventory team."
      />

      <StatGrid columns={3}>
        <StatTile label="Orders" value={orders.length} />
        <StatTile label="Still to ship" value={toShip} />
        <StatTile label="Order value" value={formatMoney(value)} />
      </StatGrid>

      <FilterBar>
        <Select variant="filter" id="order-filter" label="Show" value={filter} onChange={setFilter} options={ORDER_FILTERS} />
      </FilterBar>

      <DataTable caption="Sales orders" columns={columns} rows={rows} rowKey={(o) => o.id} empty="No orders for this selection." />
      <p className="mt-3 text-xs text-ink-muted">To place an order, open an approved quote under Quotes and choose Place sales order.</p>
    </>
  );
}
