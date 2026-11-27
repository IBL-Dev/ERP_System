"use client";

import { useState } from "react";
import { PANEL_CLASS, REASON_LABEL, REASON_OPTIONS } from "@/common/const";
import type { Adjustment, AdjustmentReason, Column } from "@/common/type";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { Select } from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/date";
import { formatNumber } from "@/lib/format";
import { useInventory } from "../InventoryProvider";

const signed = (n: number) => `${n > 0 ? "+" : ""}${formatNumber(n)}`;

export function PhysicalCountView() {
  const { items, itemsBySku, adjustments, postCount } = useInventory();
  const [sku, setSku] = useState(items[0]?.sku ?? "");
  const [counted, setCounted] = useState("");
  const [reason, setReason] = useState<AdjustmentReason>("cycle-count");
  const [notice, setNotice] = useState<string | null>(null);

  const item = itemsBySku[sku];
  const system = item?.qty.available ?? 0;
  const itemOptions = items.map((i) => ({ value: i.sku, label: `${i.sku} – ${i.name}` }));

  const raw = counted.trim() === "" ? null : Number(counted);
  const countedQty = raw !== null && Number.isInteger(raw) && raw >= 0 ? raw : null;
  const variance = countedQty === null ? null : countedQty - system;

  let reasonError: string | null = null;
  if (variance !== null && variance > 0 && (reason === "lost" || reason === "damaged")) {
    reasonError = 'A higher count needs the reason "Found stock" or "Cycle count correction".';
  } else if (variance !== null && variance < 0 && reason === "found") {
    reasonError = 'A lower count needs the reason "Lost or missing", "Damaged" or "Cycle count correction".';
  }
  const canPost = countedQty !== null && variance !== 0 && !reasonError;

  const post = () => {
    if (!item || countedQty === null || !canPost) return;
    postCount({ sku, countedQty, reason });
    setNotice(`Posted. ${item.name} now shows ${formatNumber(countedQty)} ${item.uom} available.`);
    setCounted("");
  };

  const columns: Column<Adjustment>[] = [
    { key: "id", header: "Document", cell: (a) => <span className="font-medium">{a.id}</span> },
    { key: "item", header: "Item", cell: (a) => itemsBySku[a.sku]?.name ?? a.sku },
    { key: "system", header: "System", align: "right", cell: (a) => formatNumber(a.systemQty) },
    { key: "counted", header: "Counted", align: "right", cell: (a) => formatNumber(a.countedQty) },
    {
      key: "variance",
      header: "Difference",
      align: "right",
      cell: (a) => <StatusBadge tone={a.variance < 0 ? "danger" : "success"}>{signed(a.variance)}</StatusBadge>,
    },
    { key: "reason", header: "Reason", cell: (a) => REASON_LABEL[a.reason] },
    { key: "at", header: "Posted", cell: (a) => formatDateTime(a.at) },
  ];

  return (
    <>
      <PageHeader
        title="Physical count"
        code="INV04"
        description="Compare what you counted on the shelf with the system quantity and post the difference."
      />

      <Notice>{notice}</Notice>

      <div className="grid gap-6 lg:grid-cols-[22rem_1fr] lg:items-start">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            post();
          }}
          className={cn(PANEL_CLASS, "space-y-4")}
        >
          <h2 className="font-semibold">New count</h2>

          <Field label="Item" htmlFor="count-item">
            <Select
              id="count-item"
              value={sku}
              options={itemOptions}
              onChange={(value) => {
                setSku(value);
                setCounted("");
                setNotice(null);
              }}
            />
          </Field>

          <p className="text-sm">
            System quantity (available): <strong className="tabular-nums">{formatNumber(system)}</strong> {item?.uom}
          </p>

          <Field
            label="Counted quantity"
            htmlFor="count-qty"
            error={counted.trim() !== "" && countedQty === null ? "Enter a whole number, 0 or higher." : null}
          >
            <Input
              id="count-qty"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={counted}
              onChange={(e) => setCounted(e.target.value)}
              className="tabular-nums"
            />
          </Field>

          <div aria-live="polite" className="text-sm">
            {variance === null ? (
              <span className="text-ink-muted">Enter a count to see the difference.</span>
            ) : variance === 0 ? (
              <StatusBadge tone="success">Matches the system, nothing to post</StatusBadge>
            ) : (
              <span>
                Difference: <StatusBadge tone={variance < 0 ? "danger" : "success"}>{signed(variance)}</StatusBadge>
              </span>
            )}
          </div>

          <Field label="Reason" htmlFor="count-reason" error={reasonError}>
            <Select id="count-reason" value={reason} options={REASON_OPTIONS} onChange={setReason} />
          </Field>

          <Button type="submit" disabled={!canPost}>
            Post adjustment
          </Button>
        </form>

        <section aria-labelledby="recent">
          <h2 id="recent" className="mb-3 font-semibold">Recent adjustments</h2>
          <DataTable caption="Posted count adjustments" columns={columns} rows={adjustments} rowKey={(a) => a.id} empty="No adjustments posted yet." />
        </section>
      </div>
    </>
  );
}
