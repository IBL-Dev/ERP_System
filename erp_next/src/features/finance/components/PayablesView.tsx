"use client";

import { useMemo, useState } from "react";
import { AP_APPROVAL_LIMIT, AP_BUDGET_OWNER_DEPARTMENT, AP_FILTERS, AP_STATUS_META, DEPARTMENT_LABEL, STAFF_NAMES } from "@/common/const";
import type { ApFilter, Column, PaymentNote } from "@/common/type";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { FilterBar } from "@/components/ui/FilterBar";
import { PageHeader } from "@/components/ui/PageHeader";
import { Select } from "@/components/ui/Select";
import { StatGrid } from "@/components/ui/StatGrid";
import { StatTile } from "@/components/ui/StatTile";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SupplierLink } from "@/features/supplier/components/SupplierLink";
import { useSupplier } from "@/features/supplier/SupplierProvider";
import { formatDate } from "@/lib/date";
import { formatMoney } from "@/lib/format";
import { useFinance } from "../FinanceProvider";
import { approverIdForNote, apStatus, canApproveNote } from "../utils";

export function PayablesView() {
  const { apSteps, meId, decideVendorInvoice } = useFinance();
  const { paymentNotes } = useSupplier();
  const [filter, setFilter] = useState<ApFilter>("all");

  const rows = useMemo(() => paymentNotes.filter((n) => filter === "all" || apStatus(n, apSteps) === filter), [paymentNotes, apSteps, filter]);

  const awaitingAll = paymentNotes.filter((n) => apStatus(n, apSteps) === "pending");
  const awaitingMe = paymentNotes.filter((n) => canApproveNote(n, apSteps, meId));
  const toPay = paymentNotes.filter((n) => ["approved", "scheduled"].includes(apStatus(n, apSteps)));

  const columns: Column<PaymentNote>[] = [
    { key: "id", header: "Vendor invoice", cell: (n) => <span className="font-medium">{n.id}</span> },
    { key: "supplier", header: "Supplier", cell: (n) => <SupplierLink id={n.supplierId} /> },
    { key: "po", header: "Purchase order", cell: (n) => n.poId },
    { key: "received", header: "Received", cell: (n) => formatDate(n.sentOn) },
    { key: "due", header: "Due", cell: (n) => formatDate(n.dueOn) },
    { key: "amount", header: "Amount", align: "right", cell: (n) => formatMoney(n.amount) },
    { key: "status", header: "Status", cell: (n) => <StatusBadge meta={AP_STATUS_META[apStatus(n, apSteps)]} /> },
    {
      key: "approval",
      header: "Approval",
      cell: (n) => {
        const status = apStatus(n, apSteps);
        if (status === "pending") {
          // Approval control: only the responsible approver sees the buttons.
          return canApproveNote(n, apSteps, meId) ? (
            <div className="flex gap-2">
              <Button size="sm" onClick={() => decideVendorInvoice(n.id, "approved")}>Approve</Button>
              <Button size="sm" variant="secondary" onClick={() => decideVendorInvoice(n.id, "rejected")}>Reject</Button>
            </div>
          ) : (
            <span className="text-sm text-ink-muted">Awaiting {STAFF_NAMES[approverIdForNote(n)]}</span>
          );
        }
        const step = apSteps[n.id];
        if (status === "paid") return <span className="text-sm text-ink-muted">{n.paidOn ? `Paid ${formatDate(n.paidOn)}` : "Paid"}</span>;
        return <span className="text-sm text-ink-muted">{step ? `${status === "rejected" ? "Rejected" : "Approved"} by ${STAFF_NAMES[step.decidedBy] ?? step.decidedBy}` : "-"}</span>;
      },
    },
  ];

  return (
    <>
      <PageHeader
        title="Vendor invoices"
        code="FIN04"
        description={`Supplier payment notes arrive here once goods are received. The ${DEPARTMENT_LABEL[AP_BUDGET_OWNER_DEPARTMENT]} department head approves them, or the Finance head above ${formatMoney(AP_APPROVAL_LIMIT)}. Approving records the amount owed in the ledger.`}
      />

      <StatGrid columns={3}>
        <StatTile label="Waiting for your approval" value={awaitingMe.length} tone={awaitingMe.length ? "warning" : undefined} />
        <StatTile label="Awaiting any approval" value={awaitingAll.length} />
        <StatTile label="Approved, still to pay" value={formatMoney(toPay.reduce((t, n) => t + n.amount, 0))} />
      </StatGrid>

      <FilterBar>
        <Select variant="filter" id="ap-filter" label="Status" value={filter} onChange={setFilter} options={AP_FILTERS} />
      </FilterBar>

      <DataTable caption="Vendor invoices" columns={columns} rows={rows} rowKey={(n) => n.id} empty="No vendor invoices for this selection." />
    </>
  );
}
