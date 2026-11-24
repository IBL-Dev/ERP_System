"use client";

import { useMemo, useState, type FormEvent } from "react";
import { ACCOUNT_TYPE_FILTERS, ACCOUNT_TYPE_LABEL, ACCOUNT_TYPE_OPTIONS, PANEL_CLASS } from "@/common/const";
import type { Account, AccountType, AccountTypeFilter, Column } from "@/common/type";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Field } from "@/components/ui/Field";
import { FilterBar } from "@/components/ui/FilterBar";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { Select } from "@/components/ui/Select";
import { StatGrid } from "@/components/ui/StatGrid";
import { StatTile } from "@/components/ui/StatTile";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/format";
import { useFinance } from "../FinanceProvider";
import { naturalBalance } from "../utils";

export function AccountsView() {
  const { accounts, balances, addAccount, setAccountActive } = useFinance();
  const [query, setQuery] = useState("");
  const [type, setType] = useState<AccountTypeFilter>("all");
  const [adding, setAdding] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [newType, setNewType] = useState<AccountType>("expense");
  const [error, setError] = useState<string | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return accounts.filter((a) => (type === "all" || a.type === type) && (!q || a.code.includes(q) || a.name.toLowerCase().includes(q)));
  }, [accounts, query, type]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const message = addAccount({ code: code.trim(), name, type: newType });
    setError(message);
    if (!message) {
      setCode("");
      setName("");
      setAdding(false);
    }
  };

  const columns: Column<Account>[] = [
    { key: "code", header: "Code", cell: (a) => <span className="font-medium">{a.code}</span> },
    { key: "name", header: "Account", cell: (a) => a.name },
    { key: "type", header: "Type", cell: (a) => ACCOUNT_TYPE_LABEL[a.type] },
    { key: "balance", header: "Balance", align: "right", cell: (a) => formatMoney(naturalBalance(a, balances[a.code])) },
    { key: "status", header: "Status", cell: (a) => <StatusBadge tone={a.active ? "success" : "neutral"}>{a.active ? "Active" : "Inactive"}</StatusBadge> },
    {
      key: "action",
      header: "Action",
      cell: (a) => (
        <Button size="sm" variant="secondary" onClick={() => setAccountActive(a.code, !a.active)}>
          {a.active ? "Deactivate" : "Reactivate"}
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Chart of accounts"
        code="FIN01"
        description="The master list of ledger accounts. Every financial transaction is posted to these accounts. Inactive accounts cannot be posted to."
        actions={!adding && <Button onClick={() => setAdding(true)}>New account</Button>}
      />

      <StatGrid columns={3}>
        <StatTile label="Accounts" value={accounts.length} />
        <StatTile label="Active" value={accounts.filter((a) => a.active).length} />
        <StatTile label="Inactive" value={accounts.filter((a) => !a.active).length} />
      </StatGrid>

      {adding && (
        <form onSubmit={submit} noValidate className={cn(PANEL_CLASS, "mb-6")}>
          <h2 className="font-semibold">New account</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Field label="Code (4 digits)" htmlFor="acc-code" error={error}>
              <Input id="acc-code" value={code} onChange={(e) => setCode(e.target.value)} invalid={Boolean(error)} className="tabular-nums" />
            </Field>
            <Field label="Name" htmlFor="acc-name">
              <Input id="acc-name" value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Type" htmlFor="acc-type">
              <Select id="acc-type" value={newType} options={ACCOUNT_TYPE_OPTIONS} onChange={setNewType} />
            </Field>
          </div>
          <div className="mt-4 flex gap-2">
            <Button type="submit">Add account</Button>
            <Button variant="secondary" onClick={() => setAdding(false)}>Cancel</Button>
          </div>
        </form>
      )}

      <FilterBar>
        <SearchInput id="acc-search" label="Search accounts" value={query} onChange={setQuery} placeholder="Search code or name" />
        <Select variant="filter" id="acc-filter" label="Type" value={type} onChange={setType} options={ACCOUNT_TYPE_FILTERS} />
      </FilterBar>

      <DataTable caption="Chart of accounts" columns={columns} rows={rows} rowKey={(a) => a.code} empty="No accounts match your search." />
    </>
  );
}
