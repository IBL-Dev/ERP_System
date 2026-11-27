"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  BUDGET_DEPARTMENT_FILTERS,
  BUDGET_KIND_LABEL,
  BUDGET_KIND_OPTIONS,
  BUDGET_STATUS_META,
  DEPARTMENT_LABEL,
  FINANCE_DEPARTMENT_OPTIONS,
  FISCAL_YEAR,
  PANEL_CLASS,
} from "@/common/const";
import type { BudgetDepartmentFilter, BudgetKind, BudgetLine, Column, Department } from "@/common/type";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Field } from "@/components/ui/Field";
import { FilterBar } from "@/components/ui/FilterBar";
import { Input } from "@/components/ui/Input";
import { NumberInput } from "@/components/ui/NumberInput";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Select } from "@/components/ui/Select";
import { StatGrid } from "@/components/ui/StatGrid";
import { StatTile } from "@/components/ui/StatTile";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useSales } from "@/features/sales/SalesProvider";
import { useSupplier } from "@/features/supplier/SupplierProvider";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/format";
import { useFinance } from "../FinanceProvider";
import { budgetActual, budgetStatus, projectedYearEnd } from "../utils";

export function BudgetsView() {
  const { budgets, setBudget, addBudgetLine } = useFinance();
  const { invoices } = useSales();
  const { paymentNotes } = useSupplier();
  const [dept, setDept] = useState<BudgetDepartmentFilter>("all");
  const [adding, setAdding] = useState(false);

  const [department, setDepartment] = useState<Department>("sales");
  const [kind, setKind] = useState<BudgetKind>("expense");
  const [category, setCategory] = useState("");
  const [annual, setAnnual] = useState("");
  const [error, setError] = useState<string | null>(null);

  const rows = useMemo(() => budgets.filter((b) => dept === "all" || b.department === dept), [budgets, dept]);
  const actualOf = (line: BudgetLine) => budgetActual(line, invoices, paymentNotes);

  const sum = (kindOf: BudgetKind, pick: (b: BudgetLine) => number) => rows.filter((b) => b.kind === kindOf).reduce((t, b) => t + pick(b), 0);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const value = Number(annual);
    if (!category.trim()) return setError("Enter a category.");
    if (!Number.isFinite(value) || value <= 0) return setError("Enter the yearly budget.");
    setError(null);
    addBudgetLine({ department, kind, category: category.trim(), annual: value });
    setCategory("");
    setAnnual("");
    setAdding(false);
  };

  const columns: Column<BudgetLine>[] = [
    { key: "dept", header: "Department", cell: (b) => DEPARTMENT_LABEL[b.department] },
    {
      key: "category",
      header: "Category",
      cell: (b) => (
        <div>
          <p className="font-medium">{b.category}</p>
          <p className="text-xs text-ink-muted">{BUDGET_KIND_LABEL[b.kind]}{b.source !== "manual" && ", live from " + (b.source === "sales-invoices" ? "Sales invoices" : "Supplier invoices")}</p>
        </div>
      ),
    },
    {
      key: "annual",
      header: `Budget ${FISCAL_YEAR}`,
      align: "right",
      cell: (b) => <NumberInput value={b.annual} min={0} label={`Yearly budget for ${b.category}`} onCommit={(n) => setBudget(b.id, n)} className="w-28" />,
    },
    { key: "actual", header: "Actual to date", align: "right", cell: (b) => formatMoney(actualOf(b)) },
    {
      key: "used",
      header: "Used",
      cell: (b) => (
        <div className="min-w-32 space-y-1">
          <p className="text-xs tabular-nums">{b.annual > 0 ? Math.round((actualOf(b) / b.annual) * 100) : 0}%</p>
          <ProgressBar label={`${b.category} used`} value={b.annual > 0 ? (actualOf(b) / b.annual) * 100 : 0} tone={b.kind === "expense" && actualOf(b) > b.annual ? "danger" : "accent"} />
        </div>
      ),
    },
    { key: "projected", header: "Projected for the year", align: "right", cell: (b) => formatMoney(projectedYearEnd(actualOf(b))) },
    { key: "status", header: "Outlook", cell: (b) => <StatusBadge meta={BUDGET_STATUS_META[budgetStatus(b, actualOf(b))]} /> },
  ];

  return (
    <>
      <PageHeader
        title="Budgeting"
        code="FIN09"
        description={`Yearly budgets per department for ${FISCAL_YEAR}. The projection extends the spending or income so far across the full year. Sales revenue and supplier purchases update live.`}
        actions={!adding && <Button onClick={() => setAdding(true)}>New budget line</Button>}
      />

      <StatGrid>
        <StatTile label="Revenue budget" value={formatMoney(sum("revenue", (b) => b.annual))} />
        <StatTile label="Projected revenue" value={formatMoney(sum("revenue", (b) => projectedYearEnd(actualOf(b))))} />
        <StatTile label="Expense budget" value={formatMoney(sum("expense", (b) => b.annual))} />
        <StatTile label="Projected expenses" value={formatMoney(sum("expense", (b) => projectedYearEnd(actualOf(b))))} />
      </StatGrid>

      {adding && (
        <form onSubmit={submit} noValidate className={cn(PANEL_CLASS, "mb-6")}>
          <h2 className="font-semibold">New budget line</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Field label="Department" htmlFor="bd-dept">
              <Select id="bd-dept" value={department} options={FINANCE_DEPARTMENT_OPTIONS} onChange={setDepartment} />
            </Field>
            <Field label="Type" htmlFor="bd-kind">
              <Select id="bd-kind" value={kind} options={BUDGET_KIND_OPTIONS} onChange={setKind} />
            </Field>
            <Field label="Category" htmlFor="bd-cat" error={error}>
              <Input id="bd-cat" value={category} onChange={(e) => setCategory(e.target.value)} invalid={Boolean(error)} />
            </Field>
            <Field label="Yearly budget" htmlFor="bd-annual">
              <Input id="bd-annual" type="number" min={0} step={100} value={annual} onChange={(e) => setAnnual(e.target.value)} className="tabular-nums" />
            </Field>
          </div>
          <div className="mt-4 flex gap-2">
            <Button type="submit">Add line</Button>
            <Button variant="secondary" onClick={() => setAdding(false)}>Cancel</Button>
          </div>
        </form>
      )}

      <FilterBar>
        <Select variant="filter" id="bd-filter" label="Department" value={dept} onChange={setDept} options={BUDGET_DEPARTMENT_FILTERS} />
      </FilterBar>

      <DataTable caption="Department budgets" columns={columns} rows={rows} rowKey={(b) => b.id} empty="No budget lines for this department." />
      <p className="mt-3 text-xs text-ink-muted">Edit a budget and press Enter or move to another field to save it. Expenses should stay under budget; revenue should reach it.</p>
    </>
  );
}
