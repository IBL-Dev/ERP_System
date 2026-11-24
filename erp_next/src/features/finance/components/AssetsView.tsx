"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { ASSET_CATEGORY_OPTIONS, ASSET_FILTERS, ASSET_STATUS_META, DEMO_TODAY, DEPARTMENT_LABEL, FINANCE_DEPARTMENT_OPTIONS, PANEL_CLASS, ROUTES } from "@/common/const";
import type { AssetFilter, Column, Department, FixedAsset } from "@/common/type";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Field } from "@/components/ui/Field";
import { FilterBar } from "@/components/ui/FilterBar";
import { Input } from "@/components/ui/Input";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { Select } from "@/components/ui/Select";
import { StatGrid } from "@/components/ui/StatGrid";
import { StatTile } from "@/components/ui/StatTile";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/cn";
import { formatDate, monthOf } from "@/lib/date";
import { accumulatedThrough } from "@/lib/depreciation";
import { formatMoney } from "@/lib/format";
import { useFinance } from "../FinanceProvider";
import { bookValue, isFullyDepreciated, latestValuation, round2 } from "../utils";

type CategoryRow = { category: string; count: number; cost: number; book: number; market: number };

export function AssetsView() {
  const { assets, runDepreciation, addAsset } = useFinance();
  const [filter, setFilter] = useState<AssetFilter>("all");
  const [notice, setNotice] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const period = monthOf(DEMO_TODAY);
  const live = assets.filter((a) => a.status !== "disposed");
  const depreciationDue = live.some((a) => round2(accumulatedThrough(a, period) - a.accumulated) > 0);

  const rows = useMemo(() => assets.filter((a) => filter === "all" || a.status === filter), [assets, filter]);

  const byCategory: CategoryRow[] = useMemo(() => {
    const map = new Map<string, CategoryRow>();
    for (const a of live) {
      const row = map.get(a.category) ?? { category: a.category, count: 0, cost: 0, book: 0, market: 0 };
      row.count += 1;
      row.cost += a.cost;
      row.book += bookValue(a);
      row.market += latestValuation(a)?.amount ?? bookValue(a);
      map.set(a.category, row);
    }
    return [...map.values()];
  }, [live]);

  const post = () => {
    const count = runDepreciation(period);
    setNotice(count ? `Posted depreciation for ${count} asset${count === 1 ? "" : "s"} up to ${period}.` : `Depreciation is already up to date for ${period}.`);
  };

  // ---- new asset form ----
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Warehouse equipment");
  const [department, setDepartment] = useState<Department>("inventory");
  const [acquiredOn, setAcquiredOn] = useState(DEMO_TODAY);
  const [cost, setCost] = useState("");
  const [salvage, setSalvage] = useState("0");
  const [life, setLife] = useState("5");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const c = Number(cost);
    const s = Number(salvage);
    const l = Number(life);
    if (!name.trim()) return setError("Enter the asset name.");
    if (!Number.isFinite(c) || c <= 0) return setError("Enter the purchase cost.");
    if (!Number.isFinite(s) || s < 0 || s >= c) return setError("Salvage value must be 0 or more, and less than the cost.");
    if (!Number.isInteger(l) || l < 1) return setError("Enter the useful life in whole years.");
    setError(null);
    const id = addAsset({ name: name.trim(), category, department, acquiredOn, cost: c, salvage: s, lifeYears: l });
    setNotice(`Asset ${id} added and posted to the ledger.`);
    setName("");
    setCost("");
    setAdding(false);
  };

  const columns: Column<FixedAsset>[] = [
    {
      key: "id",
      header: "Asset",
      cell: (a) => (
        <div>
          <Link href={ROUTES.finance.asset(a.id)} className="font-medium text-accent hover:underline">{a.id}</Link>
          <p className="text-xs text-ink-muted">{a.name}</p>
        </div>
      ),
    },
    { key: "category", header: "Category", cell: (a) => a.category },
    { key: "dept", header: "Department", cell: (a) => DEPARTMENT_LABEL[a.department] },
    { key: "acquired", header: "Acquired", cell: (a) => formatDate(a.acquiredOn) },
    { key: "cost", header: "Cost", align: "right", cell: (a) => formatMoney(a.cost) },
    { key: "acc", header: "Depreciated", align: "right", cell: (a) => formatMoney(a.accumulated) },
    { key: "book", header: "Book value", align: "right", cell: (a) => <strong>{formatMoney(a.status === "disposed" ? 0 : bookValue(a))}</strong> },
    {
      key: "status",
      header: "Status",
      cell: (a) => (
        <div>
          <StatusBadge meta={ASSET_STATUS_META[a.status]} />
          {a.status !== "disposed" && isFullyDepreciated(a) && <p className="text-xs text-ink-muted">Fully depreciated</p>}
        </div>
      ),
    },
  ];

  const categoryColumns: Column<CategoryRow>[] = [
    { key: "cat", header: "Category", cell: (r) => r.category },
    { key: "n", header: "Assets", align: "right", cell: (r) => r.count },
    { key: "cost", header: "Cost", align: "right", cell: (r) => formatMoney(r.cost) },
    { key: "book", header: "Book value", align: "right", cell: (r) => formatMoney(r.book) },
    { key: "market", header: "Estimated market value", align: "right", cell: (r) => formatMoney(r.market) },
  ];

  const totals = live.reduce((t, a) => ({ cost: t.cost + a.cost, acc: t.acc + a.accumulated }), { cost: 0, acc: 0 });

  return (
    <>
      <PageHeader
        title="Asset management"
        code="FIN08"
        description="Property that is not inventory: what it cost, how much has been depreciated, what it is worth and where it is in its life."
        actions={
          <>
            <Button variant="secondary" onClick={post} disabled={!depreciationDue}>Post depreciation to {period}</Button>
            {!adding && <Button onClick={() => setAdding(true)}>New asset</Button>}
          </>
        }
      />

      <StatGrid>
        <StatTile label="Assets in use" value={live.length} />
        <StatTile label="Cost" value={formatMoney(totals.cost)} />
        <StatTile label="Depreciated so far" value={formatMoney(totals.acc)} />
        <StatTile label="Book value" value={formatMoney(totals.cost - totals.acc)} />
      </StatGrid>

      <Notice>{notice}</Notice>

      {adding && (
        <form onSubmit={submit} noValidate className={cn(PANEL_CLASS, "mb-6")}>
          <h2 className="font-semibold">New asset</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Field label="Name" htmlFor="as-name" error={error}>
              <Input id="as-name" value={name} onChange={(e) => setName(e.target.value)} invalid={Boolean(error)} />
            </Field>
            <Field label="Category" htmlFor="as-cat">
              <Select id="as-cat" value={category} options={ASSET_CATEGORY_OPTIONS} onChange={setCategory} />
            </Field>
            <Field label="Department" htmlFor="as-dept">
              <Select id="as-dept" value={department} options={FINANCE_DEPARTMENT_OPTIONS} onChange={setDepartment} />
            </Field>
            <Field label="Acquired on" htmlFor="as-date">
              <Input id="as-date" type="date" value={acquiredOn} onChange={(e) => setAcquiredOn(e.target.value)} />
            </Field>
            <Field label="Cost" htmlFor="as-cost">
              <Input id="as-cost" type="number" min={0} step={0.01} value={cost} onChange={(e) => setCost(e.target.value)} className="tabular-nums" />
            </Field>
            <Field label="Salvage value" htmlFor="as-salvage">
              <Input id="as-salvage" type="number" min={0} step={0.01} value={salvage} onChange={(e) => setSalvage(e.target.value)} className="tabular-nums" />
            </Field>
            <Field label="Useful life (years)" htmlFor="as-life">
              <Input id="as-life" type="number" min={1} step={1} value={life} onChange={(e) => setLife(e.target.value)} className="tabular-nums" />
            </Field>
          </div>
          <div className="mt-4 flex gap-2">
            <Button type="submit">Add asset</Button>
            <Button variant="secondary" onClick={() => setAdding(false)}>Cancel</Button>
          </div>
        </form>
      )}

      <section aria-labelledby="valuation" className="mb-8">
        <h2 id="valuation" className="mb-3 font-semibold">Valuation by category</h2>
        <DataTable caption="Asset valuation by category" columns={categoryColumns} rows={byCategory} rowKey={(r) => r.category} empty="No assets in use." />
        <p className="mt-3 text-xs text-ink-muted">Estimated market value uses the latest valuation recorded on an asset, or its book value when there is none.</p>
      </section>

      <section aria-labelledby="register">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 id="register" className="font-semibold">Asset register</h2>
          <FilterBar>
            <Select variant="filter" id="as-filter" label="Status" value={filter} onChange={setFilter} options={ASSET_FILTERS} />
          </FilterBar>
        </div>
        <DataTable caption="Asset register" columns={columns} rows={rows} rowKey={(a) => a.id} empty="No assets for this selection." />
      </section>
    </>
  );
}
