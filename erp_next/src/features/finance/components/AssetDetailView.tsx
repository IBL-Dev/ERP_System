"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ASSET_EVENT_LABEL, ASSET_STATUS_META, DEPARTMENT_LABEL, PANEL_CLASS, ROUTES } from "@/common/const";
import type { AssetEvent, AssetValuation, Column, ScheduleRow } from "@/common/type";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { DescriptionList } from "@/components/ui/DescriptionList";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { StatGrid } from "@/components/ui/StatGrid";
import { StatTile } from "@/components/ui/StatTile";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/date";
import { formatMoney } from "@/lib/format";
import { useFinance } from "../FinanceProvider";
import { bookValue, depreciationSchedule, latestValuation, monthlyFor, round2 } from "../utils";

const scheduleColumns: Column<ScheduleRow>[] = [
  { key: "year", header: "Year", cell: (r) => r.year },
  { key: "dep", header: "Depreciation", align: "right", cell: (r) => formatMoney(r.depreciation) },
  { key: "closing", header: "Value at year end", align: "right", cell: (r) => formatMoney(r.closingValue) },
];

const valuationColumns: Column<AssetValuation>[] = [
  { key: "date", header: "Date", cell: (v) => formatDate(v.date) },
  { key: "amount", header: "Valued at", align: "right", cell: (v) => formatMoney(v.amount) },
  { key: "note", header: "Note", cell: (v) => v.note },
];

export function AssetDetailView({ id }: { id: string }) {
  const { assets, setAssetStatus, recordValuation, disposeAsset } = useFinance();
  const asset = assets.find((a) => a.id === id);

  const [valuation, setValuation] = useState("");
  const [valuationNote, setValuationNote] = useState("");
  const [proceeds, setProceeds] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (!asset) {
    return (
      <>
        <PageHeader title="Asset not found" />
        <p className="text-sm">
          There is no asset {id}. <Link href={ROUTES.finance.assets} className="text-accent hover:underline">Back to asset management</Link>
        </p>
      </>
    );
  }

  const disposed = asset.status === "disposed";
  const book = bookValue(asset);
  const latest = latestValuation(asset);
  const proceedsValue = Number(proceeds);
  const gain = Number.isFinite(proceedsValue) ? round2(proceedsValue - book) : 0;

  const submitValuation = (e: FormEvent) => {
    e.preventDefault();
    const value = Number(valuation);
    if (!Number.isFinite(value) || value <= 0) return setError("Enter the valuation amount.");
    setError(null);
    recordValuation(asset.id, value, valuationNote.trim() || "Valuation");
    setValuation("");
    setValuationNote("");
    setNotice("Valuation recorded.");
  };

  const dispose = () => {
    if (!Number.isFinite(proceedsValue) || proceedsValue < 0) return setError("Enter the sale proceeds (0 if scrapped).");
    setError(null);
    disposeAsset(asset.id, proceedsValue);
    setNotice(`Asset disposed. ${gain >= 0 ? "Gain" : "Loss"} of ${formatMoney(Math.abs(gain))} posted to the ledger.`);
  };

  const eventColumns: Column<AssetEvent>[] = [
    { key: "date", header: "Date", cell: (e) => formatDate(e.date) },
    { key: "type", header: "Event", cell: (e) => ASSET_EVENT_LABEL[e.type] },
    { key: "note", header: "Note", cell: (e) => e.note },
  ];

  return (
    <>
      <PageHeader
        title={asset.name}
        code={asset.id}
        description={`${asset.category}, ${DEPARTMENT_LABEL[asset.department]} department`}
        actions={
          <>
            <StatusBadge meta={ASSET_STATUS_META[asset.status]} />
            {asset.status === "in-service" && <Button variant="secondary" onClick={() => setAssetStatus(asset.id, "maintenance", "Sent for service")}>Send for maintenance</Button>}
            {asset.status === "maintenance" && <Button variant="secondary" onClick={() => setAssetStatus(asset.id, "in-service", "Back in service")}>Return to service</Button>}
            <Link href={ROUTES.finance.assets} className="text-sm text-accent hover:underline">All assets</Link>
          </>
        }
      />

      <StatGrid>
        <StatTile label="Cost" value={formatMoney(asset.cost)} />
        <StatTile label="Depreciated so far" value={formatMoney(asset.accumulated)} />
        <StatTile label="Book value" value={formatMoney(disposed ? 0 : book)} />
        <StatTile label="Latest valuation" value={latest ? formatMoney(latest.amount) : "-"} hint={latest ? formatDate(latest.date) : "None recorded"} />
      </StatGrid>

      <Notice>{notice}</Notice>
      <Notice tone="danger">{error}</Notice>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Details" titleId="details">
          <div className="mt-3">
            <DescriptionList
              items={[
                ["Acquired", formatDate(asset.acquiredOn)],
                ["Useful life", `${asset.lifeYears} years`],
                ["Salvage value", formatMoney(asset.salvage)],
                ["Monthly depreciation", formatMoney(monthlyFor(asset))],
                ["Depreciated through", asset.depreciatedThrough],
                ["Disposed", disposed && asset.disposedOn ? `${formatDate(asset.disposedOn)}, for ${formatMoney(asset.proceeds ?? 0)}` : "No"],
              ]}
            />
          </div>
        </Panel>

        <Panel title="Lifecycle" titleId="life">
          <div className="mt-3">
            <DataTable caption="Asset lifecycle events" columns={eventColumns} rows={[...asset.events].sort((a, b) => b.date.localeCompare(a.date))} rowKey={(e) => `${e.date}-${e.type}-${e.note}`} />
          </div>
        </Panel>
      </div>

      <section aria-labelledby="valuations" className="mt-6">
        <h2 id="valuations" className="mb-3 font-semibold">Valuations</h2>
        <div className="grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-start">
          <DataTable caption="Valuations" columns={valuationColumns} rows={[...asset.valuations].sort((a, b) => b.date.localeCompare(a.date))} rowKey={(v) => `${v.date}-${v.amount}`} empty="No valuations recorded." />
          {!disposed && (
            <form onSubmit={submitValuation} noValidate className={cn(PANEL_CLASS, "space-y-3")}>
              <h3 className="text-sm font-semibold">Record a valuation</h3>
              <Field label="Valued at" htmlFor="val-amount">
                <Input id="val-amount" type="number" min={0} step={0.01} value={valuation} onChange={(e) => setValuation(e.target.value)} className="tabular-nums" />
              </Field>
              <Field label="Note" htmlFor="val-note" hint="For example, who valued it.">
                <Input id="val-note" value={valuationNote} onChange={(e) => setValuationNote(e.target.value)} />
              </Field>
              <Button type="submit" size="sm">Save valuation</Button>
            </form>
          )}
        </div>
      </section>

      <section aria-labelledby="schedule" className="mt-6">
        <h2 id="schedule" className="mb-3 font-semibold">Depreciation schedule</h2>
        <DataTable caption="Depreciation schedule" columns={scheduleColumns} rows={depreciationSchedule(asset)} rowKey={(r) => String(r.year)} empty="Not depreciated." />
      </section>

      {!disposed && (
        <section aria-labelledby="dispose" className="mt-6 max-w-md">
          <h2 id="dispose" className="mb-3 font-semibold">Dispose of this asset</h2>
          <div className={cn(PANEL_CLASS, "space-y-3")}>
            <Field label="Sale proceeds" htmlFor="dispose-proceeds" hint="Enter 0 if the asset is scrapped.">
              <Input id="dispose-proceeds" type="number" min={0} step={0.01} value={proceeds} onChange={(e) => setProceeds(e.target.value)} className="tabular-nums" />
            </Field>
            <p aria-live="polite" className="text-sm">
              Book value {formatMoney(book)}: this would be a{" "}
              <StatusBadge tone={gain >= 0 ? "success" : "warning"}>{gain >= 0 ? "gain" : "loss"} of {formatMoney(Math.abs(gain))}</StatusBadge>.
            </p>
            <Button variant="secondary" onClick={dispose}>Dispose and post to ledger</Button>
          </div>
        </section>
      )}
    </>
  );
}
