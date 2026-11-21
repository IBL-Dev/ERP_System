"use client";

import { PERFORMANCE_TARGETS, PRICE_TOLERANCE_PCT } from "@/common/const";
import type { Column, DeliveryRecord, Supplier } from "@/common/type";
import { DataTable } from "@/components/ui/DataTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatGrid } from "@/components/ui/StatGrid";
import { StatTile } from "@/components/ui/StatTile";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { daysBetween, formatDate } from "@/lib/date";
import { formatNumber } from "@/lib/format";
import { useSupplier } from "../SupplierProvider";
import { deliveryMetrics, supplierMetrics } from "../utils";
import { MetricBadge } from "./MetricBadge";
import { SupplierLink } from "./SupplierLink";

const pct = (v: number | null) => (v === null ? "-" : `${v}%`);

export function PerformanceView() {
  const { suppliers, deliveries } = useSupplier();
  const overall = deliveryMetrics(deliveries);
  const recent = [...deliveries].sort((a, b) => b.receivedOn.localeCompare(a.receivedOn));

  const scoreColumns: Column<Supplier>[] = [
    { key: "supplier", header: "Supplier", cell: (s) => <SupplierLink id={s.id} /> },
    { key: "n", header: "Deliveries", align: "right", cell: (s) => supplierMetrics(s.id, deliveries).deliveries },
    { key: "ontime", header: "On-time delivery", cell: (s) => <MetricBadge value={supplierMetrics(s.id, deliveries).onTimePct} target={PERFORMANCE_TARGETS.onTimePct} /> },
    {
      key: "lead",
      header: "Lead time",
      align: "right",
      cell: (s) => {
        const m = supplierMetrics(s.id, deliveries);
        return m.avgLeadDays === null ? "-" : `${m.avgLeadDays} days (agreed ${s.leadTimeDays})`;
      },
    },
    { key: "acc", header: "Order accuracy", cell: (s) => <MetricBadge value={supplierMetrics(s.id, deliveries).accuracyPct} target={PERFORMANCE_TARGETS.accuracyPct} /> },
    { key: "price", header: "Pricing compliance", cell: (s) => <MetricBadge value={supplierMetrics(s.id, deliveries).pricingPct} target={PERFORMANCE_TARGETS.pricingPct} /> },
  ];

  const historyColumns: Column<DeliveryRecord>[] = [
    { key: "po", header: "Order", cell: (d) => <span className="font-medium">{d.poId}</span> },
    { key: "supplier", header: "Supplier", cell: (d) => <SupplierLink id={d.supplierId} /> },
    { key: "promised", header: "Promised", cell: (d) => formatDate(d.promisedOn) },
    { key: "received", header: "Received", cell: (d) => formatDate(d.receivedOn) },
    {
      key: "delay",
      header: "Timing",
      cell: (d) => {
        const late = daysBetween(d.promisedOn, d.receivedOn);
        return late > 0 ? <StatusBadge tone="danger">{late} days late</StatusBadge> : <StatusBadge tone="success">On time</StatusBadge>;
      },
    },
    {
      key: "qty",
      header: "Accepted / ordered",
      align: "right",
      cell: (d) => `${formatNumber(d.receivedQty)} / ${formatNumber(d.orderedQty)}`,
    },
    {
      key: "variance",
      header: "Invoice vs contract",
      cell: (d) => {
        const variance = ((d.invoicedValue - d.expectedValue) / d.expectedValue) * 100;
        return variance > PRICE_TOLERANCE_PCT ? (
          <StatusBadge tone="danger">{variance.toFixed(1)}% above contract</StatusBadge>
        ) : (
          <StatusBadge tone="success">Matches contract</StatusBadge>
        );
      },
    },
  ];

  return (
    <>
      <PageHeader
        title="Performance and compliance"
        code="SUP06"
        description="Scorecards worked out from every confirmed delivery: on-time rate, lead time, order accuracy and whether invoices match contract prices."
      />

      <StatGrid>
        <StatTile label="On-time delivery" value={pct(overall.onTimePct)} hint={`Target ${PERFORMANCE_TARGETS.onTimePct}%`} />
        <StatTile label="Average lead time" value={overall.avgLeadDays === null ? "-" : `${overall.avgLeadDays} days`} hint="Order to receipt" />
        <StatTile label="Order accuracy" value={pct(overall.accuracyPct)} hint={`Target ${PERFORMANCE_TARGETS.accuracyPct}%`} />
        <StatTile label="Pricing compliance" value={pct(overall.pricingPct)} hint={`Target ${PERFORMANCE_TARGETS.pricingPct}%`} />
      </StatGrid>

      <section aria-labelledby="scorecard" className="mb-8">
        <h2 id="scorecard" className="mb-3 font-semibold">Supplier scorecard</h2>
        <DataTable caption="Supplier scorecard" columns={scoreColumns} rows={suppliers} rowKey={(s) => s.id} />
        <p className="mt-3 text-xs text-ink-muted">
          Green means at or above target, amber is within 10 points, red is further below. An invoice more than {PRICE_TOLERANCE_PCT}% above the contract price counts as non-compliant.
        </p>
      </section>

      <section aria-labelledby="history">
        <h2 id="history" className="mb-3 font-semibold">Delivery history</h2>
        <DataTable caption="Delivery history" columns={historyColumns} rows={recent} rowKey={(d) => d.id} empty="No deliveries confirmed yet." />
      </section>
    </>
  );
}
