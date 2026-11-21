"use client";

import { CONTRACT_STATUS_META } from "@/common/const";
import type { Column, SupplierContract } from "@/common/type";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatGrid } from "@/components/ui/StatGrid";
import { StatTile } from "@/components/ui/StatTile";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/date";
import { useSupplier } from "../SupplierProvider";
import { contractStatus } from "../utils";
import { SupplierLink } from "./SupplierLink";

export function ContractsView() {
  const { contracts, renewContract } = useSupplier();
  const sorted = [...contracts].sort((a, b) => a.end.localeCompare(b.end));
  const count = (status: ReturnType<typeof contractStatus>) => contracts.filter((c) => contractStatus(c) === status).length;

  const columns: Column<SupplierContract>[] = [
    { key: "id", header: "Contract", cell: (c) => c.id },
    { key: "supplier", header: "Supplier", cell: (c) => <SupplierLink id={c.supplierId} /> },
    { key: "title", header: "Agreement", cell: (c) => c.title },
    { key: "period", header: "Period", cell: (c) => `${formatDate(c.start)} to ${formatDate(c.end)}` },
    { key: "items", header: "Priced items", align: "right", cell: (c) => Object.keys(c.prices).length },
    { key: "terms", header: "Key terms", cell: (c) => <span className="block max-w-sm whitespace-normal">{c.terms}</span> },
    { key: "status", header: "Status", cell: (c) => <StatusBadge meta={CONTRACT_STATUS_META[contractStatus(c)]} /> },
    {
      key: "action",
      header: "Action",
      cell: (c) => (
        <Button size="sm" variant="secondary" onClick={() => renewContract(c.id)}>Renew for a year</Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Contracts"
        code="SUP02"
        description="Supplier agreements and their agreed prices. An expired contract can no longer be used for new orders."
      />

      <StatGrid columns={3}>
        <StatTile label="Active" value={count("active")} />
        <StatTile label="Expiring soon" value={count("expiring")} tone={count("expiring") ? "warning" : undefined} hint="Within 60 days" />
        <StatTile label="Expired" value={count("expired")} tone={count("expired") ? "danger" : undefined} />
      </StatGrid>

      <DataTable caption="Supplier contracts" columns={columns} rows={sorted} rowKey={(c) => c.id} />
    </>
  );
}
