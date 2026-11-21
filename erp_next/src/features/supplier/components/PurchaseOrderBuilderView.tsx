"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DEMO_TODAY, ROUTES } from "@/common/const";
import type { Column, PoLine } from "@/common/type";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { DescriptionList } from "@/components/ui/DescriptionList";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Notice } from "@/components/ui/Notice";
import { NumberInput } from "@/components/ui/NumberInput";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { Select } from "@/components/ui/Select";
import { useInventory } from "@/features/inventory/InventoryProvider";
import { addDays, formatDate } from "@/lib/date";
import { formatMoney, formatNumber } from "@/lib/format";
import { useSupplier } from "../SupplierProvider";
import { contractStatus, currentContract } from "../utils";

type Draft = { sku: string; qty: number };

export function PurchaseOrderBuilderView() {
  const router = useRouter();
  const { suppliers, contracts, suppliersById, createOrder } = useSupplier();
  const { itemsBySku } = useInventory();

  // Only active suppliers whose contract has not expired can be ordered from.
  const orderable = suppliers.filter((s) => {
    const c = currentContract(s.id, contracts);
    return s.status === "active" && c && contractStatus(c) !== "expired" && Object.keys(c.prices).length > 0;
  });

  const [supplierId, setSupplierId] = useState(orderable[0]?.id ?? "");
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [sku, setSku] = useState("");
  const [qty, setQty] = useState("1");
  const [error, setError] = useState<string | null>(null);

  const supplier = suppliersById[supplierId];
  const contract = currentContract(supplierId, contracts);
  const skus = contract ? Object.keys(contract.prices) : [];
  const chosenSku = skus.includes(sku) ? sku : (skus[0] ?? "");

  const supplierOptions = orderable.map((s) => ({ value: s.id, label: s.name }));
  const productOptions = skus.map((k) => ({ value: k, label: `${k} – ${itemsBySku[k]?.name ?? k} (${formatMoney(contract!.prices[k])})` }));

  const lines: PoLine[] = drafts.map((d) => ({ ...d, unitPrice: contract?.prices[d.sku] ?? 0 }));
  const total = lines.reduce((t, l) => t + l.qty * l.unitPrice, 0);

  const addLine = () => {
    const n = Number(qty);
    if (!chosenSku) return setError("This supplier has no priced items.");
    if (!Number.isInteger(n) || n < 1) return setError("Enter a whole quantity of 1 or more.");
    setError(null);
    setDrafts((prev) =>
      prev.some((d) => d.sku === chosenSku) ? prev.map((d) => (d.sku === chosenSku ? { ...d, qty: d.qty + n } : d)) : [...prev, { sku: chosenSku, qty: n }],
    );
    setQty("1");
  };

  const issue = () => {
    if (drafts.length === 0) return setError("Add at least one item.");
    const id = createOrder({ supplierId, lines: drafts });
    if (!id) return setError("The order could not be issued. Check the supplier contract and prices.");
    router.push(ROUTES.supplier.orders);
  };

  const columns: Column<PoLine>[] = [
    {
      key: "item",
      header: "Item",
      cell: (l) => (
        <div>
          <p className="font-medium">{itemsBySku[l.sku]?.name ?? l.sku}</p>
          <p className="text-xs text-ink-muted">{l.sku}</p>
        </div>
      ),
    },
    {
      key: "stock",
      header: "In stock / on the way",
      align: "right",
      cell: (l) => `${formatNumber(itemsBySku[l.sku]?.qty.available ?? 0)} / ${formatNumber(itemsBySku[l.sku]?.qty.inTransit ?? 0)}`,
    },
    {
      key: "qty",
      header: "Qty",
      align: "right",
      cell: (l) => (
        <NumberInput value={l.qty} min={1} label={`Quantity of ${l.sku}`} onCommit={(n) => setDrafts((prev) => prev.map((d) => (d.sku === l.sku ? { ...d, qty: n } : d)))} />
      ),
    },
    { key: "price", header: "Contract price", align: "right", cell: (l) => formatMoney(l.unitPrice) },
    { key: "total", header: "Line total", align: "right", cell: (l) => <strong>{formatMoney(l.qty * l.unitPrice)}</strong> },
    {
      key: "remove",
      header: "Remove",
      cell: (l) => <Button size="sm" variant="secondary" onClick={() => setDrafts((prev) => prev.filter((d) => d.sku !== l.sku))}>Remove</Button>,
    },
  ];

  return (
    <>
      <PageHeader
        title="New purchase order"
        code="SUP05"
        description="Prices come from the supplier's contract. Suppliers on hold or with an expired contract are not listed."
      />

      <Notice tone="danger">{error}</Notice>

      <div className="grid gap-6 xl:grid-cols-[22rem_1fr] xl:items-start">
        <Panel title="Supplier and items" titleId="po-builder">
          <div className="mt-4 space-y-4">
            <Field label="Supplier" htmlFor="po-supplier">
              <Select
                id="po-supplier"
                value={supplierId}
                options={supplierOptions}
                onChange={(id) => {
                  setSupplierId(id);
                  setDrafts([]);
                  setSku("");
                }}
              />
            </Field>
            <Field label="Item" htmlFor="po-item">
              <Select id="po-item" value={chosenSku} options={productOptions} onChange={setSku} />
            </Field>
            <Field label="Quantity" htmlFor="po-qty">
              <Input id="po-qty" type="number" inputMode="numeric" min={1} step={1} value={qty} onChange={(e) => setQty(e.target.value)} className="tabular-nums" />
            </Field>
            <Button variant="secondary" onClick={addLine}>Add to order</Button>
          </div>
        </Panel>

        <div>
          <DataTable caption="Purchase order lines" columns={columns} rows={lines} rowKey={(l) => l.sku} empty="No items yet. Add one on the left." />
          <Panel className="mt-4">
            <DescriptionList
              items={[
                ["Supplier", supplier?.name ?? "-"],
                ["Expected delivery", supplier ? formatDate(addDays(DEMO_TODAY, supplier.leadTimeDays)) : "-"],
                ["Payment terms", supplier ? `${supplier.paymentTermsDays} days` : "-"],
                ["Order total", <strong key="t">{formatMoney(total)}</strong>],
              ]}
            />
            <div className="mt-4">
              <Button onClick={issue} disabled={orderable.length === 0}>Issue purchase order</Button>
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
