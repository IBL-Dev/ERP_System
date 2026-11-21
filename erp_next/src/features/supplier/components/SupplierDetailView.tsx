"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { CONTRACT_STATUS_META, PANEL_CLASS, PERFORMANCE_TARGETS, PO_STATUS_META, ROUTES, SUPPLIER_STATUS_META } from "@/common/const";
import type { Column, PurchaseOrder } from "@/common/type";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { DescriptionList } from "@/components/ui/DescriptionList";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { Select } from "@/components/ui/Select";
import { StatGrid } from "@/components/ui/StatGrid";
import { StatTile } from "@/components/ui/StatTile";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useInventory } from "@/features/inventory/InventoryProvider";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/date";
import { formatMoney } from "@/lib/format";
import { useSupplier } from "../SupplierProvider";
import { contractStatus, currentContract, poDisplayStatus, poTotal, supplierMetrics } from "../utils";
import { MetricBadge } from "./MetricBadge";

type PriceRow = { sku: string; price: number };

export function SupplierDetailView({ id }: { id: string }) {
  const { suppliersById, contracts, orders, deliveries, setSupplierStatus, setContractPrice, renewContract } = useSupplier();
  const { items, itemsBySku, movements } = useInventory();
  const [sku, setSku] = useState(items[0]?.sku ?? "");
  const [price, setPrice] = useState("");
  const [error, setError] = useState<string | null>(null);

  const supplier = suppliersById[id];
  if (!supplier) {
    return (
      <>
        <PageHeader title="Supplier not found" />
        <p className="text-sm">
          There is no supplier {id}. <Link href={ROUTES.supplier.suppliers} className="text-accent hover:underline">Back to suppliers</Link>
        </p>
      </>
    );
  }

  const contract = currentContract(id, contracts);
  const metrics = supplierMetrics(id, deliveries);
  const myOrders = orders.filter((o) => o.supplierId === id);
  const priceRows: PriceRow[] = contract ? Object.entries(contract.prices).map(([k, p]) => ({ sku: k, price: p })) : [];
  const itemOptions = items.map((i) => ({ value: i.sku, label: `${i.sku} – ${i.name}` }));

  const submitPrice = (e: FormEvent) => {
    e.preventDefault();
    const value = Number(price);
    if (!contract) return;
    if (!Number.isFinite(value) || value <= 0) return setError("Enter a unit price above 0.");
    setError(null);
    setContractPrice(contract.id, sku, value);
    setPrice("");
  };

  const priceColumns: Column<PriceRow>[] = [
    { key: "sku", header: "SKU", cell: (r) => r.sku },
    { key: "item", header: "Item", cell: (r) => itemsBySku[r.sku]?.name ?? "-" },
    { key: "price", header: "Agreed unit price", align: "right", cell: (r) => formatMoney(r.price) },
  ];

  const orderColumns: Column<PurchaseOrder>[] = [
    { key: "id", header: "Order", cell: (o) => <span className="font-medium">{o.id}</span> },
    { key: "created", header: "Created", cell: (o) => formatDate(o.createdOn) },
    { key: "total", header: "Total", align: "right", cell: (o) => formatMoney(poTotal(o)) },
    { key: "status", header: "Status", cell: (o) => <StatusBadge meta={PO_STATUS_META[poDisplayStatus(o, movements)]} /> },
  ];

  return (
    <>
      <PageHeader
        title={supplier.name}
        code={supplier.id}
        description={`${supplier.category}, supplier since ${formatDate(supplier.supplierSince)}`}
        actions={
          <>
            <StatusBadge meta={SUPPLIER_STATUS_META[supplier.status]} />
            <Button variant="secondary" onClick={() => setSupplierStatus(id, supplier.status === "active" ? "on-hold" : "active")}>
              {supplier.status === "active" ? "Put on hold" : "Reactivate"}
            </Button>
            <Link href={ROUTES.supplier.suppliers} className="text-sm text-accent hover:underline">All suppliers</Link>
          </>
        }
      />

      <StatGrid>
        <StatTile label="Deliveries" value={metrics.deliveries} />
        <StatTile label="On-time rate" value={metrics.onTimePct === null ? "-" : `${metrics.onTimePct}%`} hint={`Target ${PERFORMANCE_TARGETS.onTimePct}%`} />
        <StatTile label="Average lead time" value={metrics.avgLeadDays === null ? "-" : `${metrics.avgLeadDays} days`} hint={`Agreed ${supplier.leadTimeDays} days`} />
        <StatTile label="Order accuracy" value={metrics.accuracyPct === null ? "-" : `${metrics.accuracyPct}%`} hint={`Target ${PERFORMANCE_TARGETS.accuracyPct}%`} />
      </StatGrid>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Contact details" titleId="contact">
          <div className="mt-3">
            <DescriptionList
              items={[
                ["Contact", supplier.contact],
                ["Email", supplier.email],
                ["Phone", supplier.phone],
                ["Address", supplier.address],
                ["Payment terms", `${supplier.paymentTermsDays} days`],
                ["Delivery time", `${supplier.leadTimeDays} days`],
                ["On-time rate", <MetricBadge key="m" value={metrics.onTimePct} target={PERFORMANCE_TARGETS.onTimePct} />],
              ]}
            />
          </div>
        </Panel>

        <Panel
          title="Contract"
          titleId="contract"
          actions={contract && <Button size="sm" variant="secondary" onClick={() => renewContract(contract.id)}>Renew for a year</Button>}
        >
          {contract ? (
            <div className="mt-3">
              <DescriptionList
                items={[
                  ["Agreement", contract.title],
                  ["Period", `${formatDate(contract.start)} to ${formatDate(contract.end)}`],
                  ["Status", <StatusBadge key="s" meta={CONTRACT_STATUS_META[contractStatus(contract)]} />],
                  ["Terms", contract.terms],
                ]}
              />
            </div>
          ) : (
            <p className="mt-4 text-sm text-ink-muted">No contract on file.</p>
          )}
        </Panel>
      </div>

      {contract && (
        <section aria-labelledby="prices" className="mt-6">
          <h2 id="prices" className="mb-3 font-semibold">Agreed prices</h2>
          <div className="grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-start">
            <DataTable caption="Agreed unit prices" columns={priceColumns} rows={priceRows} rowKey={(r) => r.sku} empty="No prices agreed yet." />
            <form onSubmit={submitPrice} noValidate className={cn(PANEL_CLASS, "space-y-3")}>
              <h3 className="text-sm font-semibold">Add or change a price</h3>
              <Field label="Item" htmlFor="price-item">
                <Select id="price-item" value={sku} options={itemOptions} onChange={setSku} />
              </Field>
              <Field label="Agreed unit price" htmlFor="price-value" error={error}>
                <Input id="price-value" type="number" min={0} step={0.01} value={price} onChange={(e) => setPrice(e.target.value)} invalid={Boolean(error)} className="tabular-nums" />
              </Field>
              <Button type="submit" size="sm">Save price</Button>
            </form>
          </div>
        </section>
      )}

      <section aria-labelledby="orders" className="mt-6">
        <h2 id="orders" className="mb-3 font-semibold">Purchase orders</h2>
        <DataTable caption="Purchase orders for this supplier" columns={orderColumns} rows={myOrders} rowKey={(o) => o.id} empty="No orders yet." />
      </section>
    </>
  );
}
