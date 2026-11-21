"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { QUOTE_STATUS_META, ROUTES, TIER_LABEL } from "@/common/const";
import type { AvailabilityLine, Column, QuoteLine } from "@/common/type";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { DescriptionList } from "@/components/ui/DescriptionList";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/date";
import { formatMoney, formatNumber } from "@/lib/format";
import { lineTotal, linesSubtotal, linesTotal } from "@/lib/pricing";
import { useInventory } from "@/features/inventory/InventoryProvider";
import { useSales } from "../SalesProvider";
import { checkAvailability } from "../utils";
import { CustomerLink } from "./CustomerLink";

export function QuoteDetailView({ id }: { id: string }) {
  const router = useRouter();
  const { quotesById, customersById, sendQuote, decideQuote, convertQuote } = useSales();
  const { itemsBySku } = useInventory();
  const [error, setError] = useState<string | null>(null);

  const quote = quotesById[id];
  if (!quote) {
    return (
      <>
        <PageHeader title="Quote not found" />
        <p className="text-sm">
          There is no quote {id}. <Link href={ROUTES.sales.quotes} className="text-accent hover:underline">Back to quotes</Link>
        </p>
      </>
    );
  }

  const customer = customersById[quote.customerId];
  const availability = checkAvailability(quote.lines, itemsBySku);
  const stock: Record<string, AvailabilityLine> = Object.fromEntries(availability.map((l) => [l.sku, l]));
  const shortages = availability.filter((l) => !l.ok);
  const subtotal = linesSubtotal(quote.lines);
  const total = linesTotal(quote.lines);

  const place = () => {
    const result = convertQuote(quote.id);
    if (result.ok) return router.push(ROUTES.sales.orders);
    setError(
      result.reason === "stock"
        ? "There is not enough stock to place this order right now."
        : "Only an approved quote can be converted to an order.",
    );
  };

  const columns: Column<QuoteLine>[] = [
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
    { key: "qty", header: "Qty", align: "right", cell: (l) => formatNumber(l.qty) },
    { key: "price", header: "Unit price", align: "right", cell: (l) => formatMoney(l.unitPrice) },
    { key: "disc", header: "Tier discount", align: "right", cell: (l) => `${l.discountPct}%` },
    { key: "total", header: "Line total", align: "right", cell: (l) => <strong>{formatMoney(lineTotal(l))}</strong> },
    {
      key: "stock",
      header: "Stock now",
      cell: (l) => {
        const s = stock[l.sku];
        if (!s) return "-";
        return s.ok ? (
          <StatusBadge tone="success">{formatNumber(s.available)} available</StatusBadge>
        ) : (
          <div>
            <StatusBadge tone="danger">Short by {formatNumber(s.shortBy)}</StatusBadge>
            <p className="text-xs text-ink-muted">
              {formatNumber(s.available)} available{s.inTransit ? `, ${formatNumber(s.inTransit)} on the way` : ""}
            </p>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <PageHeader
        title={`Quote ${quote.id}`}
        code="SAL01"
        description={customer ? `For ${customer.name}` : undefined}
        actions={
          <>
            <StatusBadge meta={QUOTE_STATUS_META[quote.status]} />
            {quote.status === "draft" && <Button onClick={() => sendQuote(quote.id)}>Send to customer</Button>}
            {quote.status === "sent" && (
              <>
                <Button onClick={() => decideQuote(quote.id, "approved")}>Mark approved</Button>
                <Button variant="secondary" onClick={() => decideQuote(quote.id, "rejected")}>Mark rejected</Button>
              </>
            )}
            {quote.status === "approved" && (
              <Button onClick={place} disabled={shortages.length > 0}>Place sales order</Button>
            )}
          </>
        }
      />

      <Notice tone="danger">{error}</Notice>
      <Notice tone="warning">
        {quote.status === "approved" && shortages.length > 0 &&
          `This order cannot be placed yet: ${shortages
            .map((s) => `${itemsBySku[s.sku]?.name ?? s.sku} needs ${formatNumber(s.qty)} but only ${formatNumber(s.available)} are available`)
            .join("; ")}.`}
      </Notice>

      <div className="grid gap-6 xl:grid-cols-[1fr_22rem] xl:items-start">
        <DataTable caption="Quote lines" columns={columns} rows={quote.lines} rowKey={(l) => l.sku} />

        <Panel title="Summary" titleId="summary">
          <div className="mt-3">
            <DescriptionList
              items={[
                ["Customer", <CustomerLink key="c" id={quote.customerId} />],
                ["Tier", customer ? TIER_LABEL[customer.tier] : "-"],
                ["Created", formatDate(quote.createdOn)],
                ["Valid until", formatDate(quote.validUntil)],
                ["Subtotal", formatMoney(subtotal)],
                ["Tier discount", `-${formatMoney(subtotal - total)}`],
                ["Total", <strong key="t">{formatMoney(total)}</strong>],
                [
                  "Sales order",
                  quote.orderId ? (
                    <Link key="o" href={ROUTES.sales.orders} className="text-accent hover:underline">{quote.orderId}</Link>
                  ) : (
                    "Not placed"
                  ),
                ],
              ]}
            />
          </div>
        </Panel>
      </div>
      <p className="mt-3 text-xs text-ink-muted">Prices are saved when the quote is created. Stock is checked live each time you open this page.</p>
    </>
  );
}
