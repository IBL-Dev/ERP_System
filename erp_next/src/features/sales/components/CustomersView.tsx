"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { PANEL_CLASS, ROUTES, TIER_FILTERS, TIER_LABEL, TIER_OPTIONS } from "@/common/const";
import type { Column, Customer, CustomerTier, CustomerTierFilter } from "@/common/type";
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
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/format";
import { linesTotal } from "@/lib/pricing";
import { useSales } from "../SalesProvider";
import { invoiceBalance } from "../utils";
import { CustomerLink } from "./CustomerLink";

type FormValues = { name: string; contact: string; email: string; phone: string; tier: CustomerTier; terms: string };
const EMPTY: FormValues = { name: "", contact: "", email: "", phone: "", tier: "standard", terms: "30" };

function AddCustomerForm({ onCancel }: { onCancel: () => void }) {
  const { addCustomer } = useSales();
  const router = useRouter();
  const [v, setV] = useState<FormValues>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const text = (key: keyof FormValues) => (e: React.ChangeEvent<HTMLInputElement>) => setV((p) => ({ ...p, [key]: e.target.value }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const found: typeof errors = {};
    if (!v.name.trim()) found.name = "Enter the company name.";
    if (!v.contact.trim()) found.contact = "Enter a contact person.";
    const terms = Number(v.terms);
    if (!Number.isInteger(terms) || terms < 0) found.terms = "Enter payment terms in days.";
    setErrors(found);
    if (Object.keys(found).length) return;

    const id = addCustomer({
      name: v.name.trim(),
      contact: v.contact.trim(),
      email: v.email.trim() || "-",
      phone: v.phone.trim() || "-",
      tier: v.tier,
      paymentTermsDays: terms,
    });
    router.push(ROUTES.sales.customer(id));
  };

  return (
    <form onSubmit={submit} noValidate className={cn(PANEL_CLASS, "mb-6")}>
      <h2 className="font-semibold">New customer</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Field label="Company name" htmlFor="cust-name" error={errors.name}>
          <Input id="cust-name" value={v.name} onChange={text("name")} invalid={Boolean(errors.name)} />
        </Field>
        <Field label="Contact person" htmlFor="cust-contact" error={errors.contact}>
          <Input id="cust-contact" value={v.contact} onChange={text("contact")} invalid={Boolean(errors.contact)} />
        </Field>
        <Field label="Email" htmlFor="cust-email">
          <Input id="cust-email" type="email" value={v.email} onChange={text("email")} />
        </Field>
        <Field label="Phone" htmlFor="cust-phone">
          <Input id="cust-phone" value={v.phone} onChange={text("phone")} />
        </Field>
        <Field label="Tier" htmlFor="cust-tier">
          <Select id="cust-tier" value={v.tier} options={TIER_OPTIONS} onChange={(tier) => setV((p) => ({ ...p, tier }))} />
        </Field>
        <Field label="Payment terms (days)" htmlFor="cust-terms" error={errors.terms}>
          <Input id="cust-terms" type="number" min={0} step={1} value={v.terms} onChange={text("terms")} invalid={Boolean(errors.terms)} className="tabular-nums" />
        </Field>
      </div>
      <div className="mt-4 flex gap-2">
        <Button type="submit">Create profile</Button>
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

export function CustomersView() {
  const { customers, orders, invoices } = useSales();
  const [query, setQuery] = useState("");
  const [tier, setTier] = useState<CustomerTierFilter>("all");
  const [adding, setAdding] = useState(false);

  const stats = useMemo(() => {
    const map: Record<string, { orders: number; value: number; owed: number }> = {};
    for (const c of customers) map[c.id] = { orders: 0, value: 0, owed: 0 };
    for (const o of orders) if (map[o.customerId]) { map[o.customerId].orders += 1; map[o.customerId].value += linesTotal(o.lines); }
    for (const i of invoices) if (map[i.customerId] && i.status === "issued") map[i.customerId].owed += invoiceBalance(i);
    return map;
  }, [customers, orders, invoices]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return customers.filter(
      (c) => (tier === "all" || c.tier === tier) && (!q || [c.id, c.name, c.contact].some((v) => v.toLowerCase().includes(q))),
    );
  }, [customers, query, tier]);

  const columns: Column<Customer>[] = [
    { key: "id", header: "ID", cell: (c) => c.id },
    { key: "name", header: "Customer", cell: (c) => <CustomerLink id={c.id} showContact /> },
    { key: "tier", header: "Tier", cell: (c) => TIER_LABEL[c.tier] },
    { key: "manager", header: "Account manager", cell: (c) => c.accountManager },
    { key: "terms", header: "Payment terms", align: "right", cell: (c) => `${c.paymentTermsDays} days` },
    { key: "orders", header: "Orders", align: "right", cell: (c) => stats[c.id]?.orders ?? 0 },
    { key: "value", header: "Lifetime value", align: "right", cell: (c) => formatMoney(stats[c.id]?.value ?? 0) },
    { key: "owed", header: "Owes us", align: "right", cell: (c) => formatMoney(stats[c.id]?.owed ?? 0) },
  ];

  const totalOwed = Object.values(stats).reduce((t, s) => t + s.owed, 0);

  return (
    <>
      <PageHeader
        title="Customers"
        code="SAL05"
        description="One profile per customer: contact details, purchase history and every conversation."
        actions={!adding && <Button onClick={() => setAdding(true)}>New customer</Button>}
      />

      <StatGrid columns={3}>
        <StatTile label="Customers" value={customers.length} />
        <StatTile label="Gold tier" value={customers.filter((c) => c.tier === "gold").length} />
        <StatTile label="Owed to us" value={formatMoney(totalOwed)} hint="Issued, unpaid invoices" />
      </StatGrid>

      {adding && <AddCustomerForm onCancel={() => setAdding(false)} />}

      <FilterBar>
        <SearchInput id="cust-search" label="Search customers" value={query} onChange={setQuery} placeholder="Search name, contact or ID" />
        <Select variant="filter" id="cust-tier-filter" label="Tier" value={tier} onChange={setTier} options={TIER_FILTERS} />
      </FilterBar>

      <DataTable caption="Customers" columns={columns} rows={rows} rowKey={(c) => c.id} empty="No customers match your search." />
    </>
  );
}
