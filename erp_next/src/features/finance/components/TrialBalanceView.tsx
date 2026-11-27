"use client";

import { useState } from "react";
import { ACCOUNT_CODES, ACCOUNT_TYPE_LABEL, JOURNAL_SOURCE_LABEL } from "@/common/const";
import type { Account, Column, LedgerRow } from "@/common/type";
import { DataTable } from "@/components/ui/DataTable";
import { Field } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/PageHeader";
import { Select } from "@/components/ui/Select";
import { StatGrid } from "@/components/ui/StatGrid";
import { StatTile } from "@/components/ui/StatTile";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/date";
import { formatMoney } from "@/lib/format";
import { useFinance } from "../FinanceProvider";
import { isDebitNormal, ledgerRows, round2 } from "../utils";

export function TrialBalanceView() {
  const { accounts, balances, journal, accountsByCode } = useFinance();
  const [code, setCode] = useState<string>(ACCOUNT_CODES.bank);

  const active = accounts.filter((a) => balances[a.code]);
  const totalDebit = round2(active.reduce((t, a) => t + Math.max(balances[a.code].net, 0), 0));
  const totalCredit = round2(active.reduce((t, a) => t + Math.max(-balances[a.code].net, 0), 0));
  const balanced = totalDebit === totalCredit;

  const columns: Column<Account>[] = [
    { key: "code", header: "Code", cell: (a) => <span className="font-medium">{a.code}</span> },
    { key: "name", header: "Account", cell: (a) => a.name },
    { key: "type", header: "Type", cell: (a) => ACCOUNT_TYPE_LABEL[a.type] },
    { key: "debit", header: "Debit", align: "right", cell: (a) => (balances[a.code].net > 0 ? formatMoney(balances[a.code].net) : "-") },
    { key: "credit", header: "Credit", align: "right", cell: (a) => (balances[a.code].net < 0 ? formatMoney(-balances[a.code].net) : "-") },
  ];

  // Account ledger: every posting to one account, oldest first, with a running balance.
  const account = accountsByCode[code];
  const postings = ledgerRows(journal).filter((r) => r.line.account === code).reverse();
  let running = 0;
  const withBalance = postings.map((row) => {
    running = round2(running + (account && isDebitNormal(account) ? row.line.debit - row.line.credit : row.line.credit - row.line.debit));
    return { row, balance: running };
  });
  const ledgerColumns: Column<{ row: LedgerRow; balance: number }>[] = [
    { key: "date", header: "Date", cell: (r) => formatDate(r.row.entry.date) },
    { key: "entry", header: "Entry", cell: (r) => r.row.entry.id },
    { key: "desc", header: "Description", cell: (r) => r.row.entry.description },
    { key: "source", header: "Source", cell: (r) => JOURNAL_SOURCE_LABEL[r.row.entry.source] },
    { key: "debit", header: "Debit", align: "right", cell: (r) => (r.row.line.debit ? formatMoney(r.row.line.debit) : "-") },
    { key: "credit", header: "Credit", align: "right", cell: (r) => (r.row.line.credit ? formatMoney(r.row.line.credit) : "-") },
    { key: "balance", header: "Balance", align: "right", cell: (r) => formatMoney(r.balance) },
  ];

  return (
    <>
      <PageHeader title="Trial balance" code="FIN03" description="Debit and credit totals per account. Total debits must always equal total credits." />

      <StatGrid columns={3}>
        <StatTile label="Total debits" value={formatMoney(totalDebit)} />
        <StatTile label="Total credits" value={formatMoney(totalCredit)} />
        <div className="rounded-md border border-line bg-panel p-4">
          <p className="text-sm text-ink-muted">Ledger check</p>
          <p className="mt-2">
            <StatusBadge tone={balanced ? "success" : "danger"}>{balanced ? "Balanced" : `Out by ${formatMoney(Math.abs(totalDebit - totalCredit))}`}</StatusBadge>
          </p>
        </div>
      </StatGrid>

      <DataTable caption="Trial balance" columns={columns} rows={active} rowKey={(a) => a.code} empty="Nothing has been posted yet." />

      <section aria-labelledby="ledger" className="mt-8">
        <h2 id="ledger" className="mb-3 font-semibold">Account ledger</h2>
        <div className="mb-4 max-w-sm">
          <Field label="Account" htmlFor="ledger-account">
            <Select id="ledger-account" value={code} onChange={setCode} options={accounts.map((a) => ({ value: a.code, label: `${a.code} – ${a.name}` }))} />
          </Field>
        </div>
        <DataTable caption="Account ledger" columns={ledgerColumns} rows={withBalance} rowKey={(r) => `${r.row.entry.id}-${r.row.line.account}-${r.row.line.debit}-${r.row.line.credit}`} empty="No postings to this account." />
      </section>
    </>
  );
}
