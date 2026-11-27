"use client";

import Link from "next/link";
import { ROUTES, STAFF_NAMES, ACCOUNT_CODES } from "@/common/const";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { StatGrid } from "@/components/ui/StatGrid";
import { StatTile } from "@/components/ui/StatTile";
import { useSales } from "@/features/sales/SalesProvider";
import { invoiceBalance } from "@/features/sales/utils";
import { useSupplier } from "@/features/supplier/SupplierProvider";
import { formatDate } from "@/lib/date";
import { formatMoney } from "@/lib/format";
import { useFinance } from "../FinanceProvider";
import { approverIdForNote, apStatus, canApproveNote } from "../utils";

export function OverviewView() {
  const { balances, apSteps, meId } = useFinance();
  const { invoices } = useSales();
  const { paymentNotes } = useSupplier();

  const bank = balances[ACCOUNT_CODES.bank]?.net ?? 0;
  const owedToUs = invoices.filter((i) => i.status === "issued").reduce((t, i) => t + invoiceBalance(i), 0);
  const unpaidNotes = paymentNotes.filter((n) => n.status !== "paid");
  const weOwe = unpaidNotes.filter((n) => apStatus(n, apSteps) !== "pending" && apStatus(n, apSteps) !== "rejected").reduce((t, n) => t + n.amount, 0);
  const awaitingMe = paymentNotes.filter((n) => canApproveNote(n, apSteps, meId));
  const pendingAll = paymentNotes.filter((n) => apStatus(n, apSteps) === "pending");
  const requests = invoices.filter((i) => i.status === "requested");

  return (
    <>
      <PageHeader title="Finance overview" code="FIN00" description="Cash, what customers owe us, what we owe suppliers, and what needs approving." />

      <StatGrid columns={5}>
        <StatTile label="Bank balance" value={formatMoney(bank)} href={ROUTES.finance.trialBalance} />
        <StatTile label="Customers owe us" value={formatMoney(owedToUs)} href={ROUTES.finance.receivables} />
        <StatTile label="We owe suppliers" value={formatMoney(weOwe)} hint="Approved, not yet paid" href={ROUTES.finance.payments} />
        <StatTile label="Invoices awaiting me" value={awaitingMe.length} tone={awaitingMe.length ? "warning" : undefined} href={ROUTES.finance.payables} />
        <StatTile label="Requests from Sales" value={requests.length} hint="Invoices to issue" tone={requests.length ? "warning" : undefined} href={ROUTES.finance.receivables} />
      </StatGrid>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          title="Vendor invoices awaiting your approval"
          titleId="approvals"
          actions={
            <Link href={ROUTES.finance.payables} className="text-sm text-accent hover:underline">
              Open vendor invoices
            </Link>
          }
        >
          {awaitingMe.length === 0 ? (
            <p className="mt-4 text-sm text-ink-muted">Nothing to approve right now.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {awaitingMe.map((n) => (
                <li key={n.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <div>
                    <p className="font-medium">{n.id}</p>
                    <p className="text-xs text-ink-muted">Order {n.poId}, due {formatDate(n.dueOn)}</p>
                  </div>
                  <span className="tabular-nums">{formatMoney(n.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Waiting on others" titleId="others">
          <ul className="mt-3 divide-y divide-line text-sm">
            <li className="py-2">
              {pendingAll.length - awaitingMe.length} vendor invoice{pendingAll.length - awaitingMe.length === 1 ? "" : "s"} waiting for another approver
              {pendingAll.some((n) => !canApproveNote(n, apSteps, meId)) &&
                ` (for example ${STAFF_NAMES[approverIdForNote(pendingAll.find((n) => !canApproveNote(n, apSteps, meId))!)]})`}
              .
            </li>
            <li className="py-2">
              {requests.length} invoice request{requests.length === 1 ? "" : "s"} from Sales waiting to be issued.
            </li>
          </ul>
        </Panel>
      </div>
    </>
  );
}
