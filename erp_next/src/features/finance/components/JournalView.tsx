"use client";

import { useMemo, useState, type FormEvent } from "react";
import { DEMO_TODAY, JOURNAL_FILTERS, JOURNAL_SOURCE_LABEL, PANEL_CLASS } from "@/common/const";
import type { Column, JournalEntry, JournalFilter } from "@/common/type";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Field } from "@/components/ui/Field";
import { FilterBar } from "@/components/ui/FilterBar";
import { Input } from "@/components/ui/Input";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { Select } from "@/components/ui/Select";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/date";
import { formatMoney } from "@/lib/format";
import { useFinance } from "../FinanceProvider";
import { entryTotal } from "../utils";

export function JournalView() {
  const { journal, accounts, accountsByCode, postManualEntry } = useFinance();
  const [query, setQuery] = useState("");
  const [source, setSource] = useState<JournalFilter>("all");
  const [date, setDate] = useState(DEMO_TODAY);
  const [description, setDescription] = useState("");
  const [debitAccount, setDebitAccount] = useState("");
  const [creditAccount, setCreditAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const options = accounts.filter((a) => a.active).map((a) => ({ value: a.code, label: `${a.code} – ${a.name}` }));
  const debitValue = debitAccount || options[0]?.value || "";
  const creditValue = creditAccount || options[1]?.value || "";

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...journal]
      .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
      .filter((e) => (source === "all" || e.source === source) && (!q || [e.id, e.description, e.reference].some((v) => v.toLowerCase().includes(q))));
  }, [journal, query, source]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const value = Number(amount);
    if (!description.trim()) return setError("Enter a description.");
    if (debitValue === creditValue) return setError("Debit and credit must be different accounts.");
    if (!Number.isFinite(value) || value <= 0) return setError("Enter an amount above 0.");
    if (!date) return setError("Choose a date.");
    setError(null);
    postManualEntry({ date, description: description.trim(), debitAccount: debitValue, creditAccount: creditValue, amount: value });
    setNotice(`Posted ${formatMoney(value)}: debit ${accountsByCode[debitValue]?.name}, credit ${accountsByCode[creditValue]?.name}.`);
    setDescription("");
    setAmount("");
  };

  const columns: Column<JournalEntry>[] = [
    { key: "id", header: "Entry", cell: (e) => <span className="font-medium">{e.id}</span> },
    { key: "date", header: "Date", cell: (e) => formatDate(e.date) },
    {
      key: "desc",
      header: "Description",
      cell: (e) => (
        <div>
          <p>{e.description}</p>
          <p className="text-xs text-ink-muted">{e.reference}</p>
        </div>
      ),
    },
    { key: "source", header: "Source", cell: (e) => JOURNAL_SOURCE_LABEL[e.source] },
    {
      key: "lines",
      header: "Lines",
      cell: (e) => (
        <ul className="space-y-0.5 text-xs">
          {e.lines.map((l, i) => (
            <li key={`${l.account}-${i}`} className="whitespace-nowrap tabular-nums">
              <span className="text-ink-muted">{l.debit > 0 ? "Debit " : "Credit "}</span>
              {l.account} {accountsByCode[l.account]?.name ?? ""}: {formatMoney(l.debit > 0 ? l.debit : l.credit)}
            </li>
          ))}
        </ul>
      ),
    },
    { key: "amount", header: "Amount", align: "right", cell: (e) => formatMoney(entryTotal(e)) },
  ];

  return (
    <>
      <PageHeader
        title="Journal entries"
        code="FIN02"
        description="Every transaction as balanced debits and credits. Other departments post here automatically; you can also post an entry by hand."
      />

      <Notice>{notice}</Notice>

      <form onSubmit={submit} noValidate className={cn(PANEL_CLASS, "mb-6")}>
        <h2 className="font-semibold">Post a manual entry</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <Field label="Date" htmlFor="je-date">
            <Input id="je-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Description" htmlFor="je-desc">
            <Input id="je-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
          <Field label="Debit account" htmlFor="je-debit">
            <Select id="je-debit" value={debitValue} options={options} onChange={setDebitAccount} />
          </Field>
          <Field label="Credit account" htmlFor="je-credit">
            <Select id="je-credit" value={creditValue} options={options} onChange={setCreditAccount} />
          </Field>
          <Field label="Amount" htmlFor="je-amount" error={error}>
            <Input id="je-amount" type="number" min={0} step={0.01} value={amount} onChange={(e) => setAmount(e.target.value)} invalid={Boolean(error)} className="tabular-nums" />
          </Field>
        </div>
        <div className="mt-4">
          <Button type="submit">Post entry</Button>
        </div>
      </form>

      <FilterBar>
        <SearchInput id="je-search" label="Search entries" value={query} onChange={setQuery} placeholder="Search entry, description or reference" />
        <Select variant="filter" id="je-source" label="Source" value={source} onChange={setSource} options={JOURNAL_FILTERS} />
      </FilterBar>

      <DataTable caption="Journal entries" columns={columns} rows={rows} rowKey={(e) => e.id} empty="No entries match your search." />
    </>
  );
}
