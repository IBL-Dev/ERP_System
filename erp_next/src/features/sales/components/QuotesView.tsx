"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { QUOTE_FILTERS, QUOTE_STATUS_META, ROUTES } from "@/common/const";
import type { Column, Quote, QuoteFilter } from "@/common/type";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { FilterBar } from "@/components/ui/FilterBar";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { Select } from "@/components/ui/Select";
import { StatGrid } from "@/components/ui/StatGrid";
import { StatTile } from "@/components/ui/StatTile";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/date";
import { formatMoney } from "@/lib/format";
import { linesTotal } from "@/lib/pricing";
import { useSales } from "../SalesProvider";
import { CustomerLink } from "./CustomerLink";

export function QuotesView() {
  const router = useRouter();
  const { quotes, customersById } = useSales();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<QuoteFilter>("all");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return quotes.filter(
      (quote) =>
        (status === "all" || quote.status === status) &&
        (!q || [quote.id, customersById[quote.customerId]?.name ?? ""].some((v) => v.toLowerCase().includes(q))),
    );
  }, [quotes, customersById, query, status]);

  const waiting = quotes.filter((q) => q.status === "sent").length;
  const approved = quotes.filter((q) => q.status === "approved").length;
  const pipeline = quotes.filter((q) => q.status === "sent" || q.status === "approved").reduce((t, q) => t + linesTotal(q.lines), 0);

  const columns: Column<Quote>[] = [
    {
      key: "id",
      header: "Quote",
      cell: (q) => (
        <Link href={ROUTES.sales.quote(q.id)} className="font-medium text-accent hover:underline">
          {q.id}
        </Link>
      ),
    },
    { key: "customer", header: "Customer", cell: (q) => <CustomerLink id={q.customerId} /> },
    { key: "created", header: "Created", cell: (q) => formatDate(q.createdOn) },
    { key: "valid", header: "Valid until", cell: (q) => formatDate(q.validUntil) },
    { key: "lines", header: "Lines", align: "right", cell: (q) => q.lines.length },
    { key: "total", header: "Total", align: "right", cell: (q) => formatMoney(linesTotal(q.lines)) },
    { key: "status", header: "Status", cell: (q) => <StatusBadge meta={QUOTE_STATUS_META[q.status]} /> },
  ];

  return (
    <>
      <PageHeader
        title="Quotes"
        code="SAL01"
        description="Prices come from quantity price breaks plus the customer's tier discount. Stock shown on a quote is live."
        actions={<Button onClick={() => router.push(ROUTES.sales.newQuote)}>New quote</Button>}
      />

      <StatGrid columns={3}>
        <StatTile label="Waiting for the customer" value={waiting} />
        <StatTile label="Approved, ready to convert" value={approved} />
        <StatTile label="Open pipeline" value={formatMoney(pipeline)} hint="Sent and approved quotes" />
      </StatGrid>

      <FilterBar>
        <SearchInput id="quote-search" label="Search quotes" value={query} onChange={setQuery} placeholder="Search quote number or customer" />
        <Select variant="filter" id="quote-status" label="Status" value={status} onChange={setStatus} options={QUOTE_FILTERS} />
      </FilterBar>

      <DataTable caption="Quotes" columns={columns} rows={rows} rowKey={(q) => q.id} empty="No quotes match your search." />
    </>
  );
}
