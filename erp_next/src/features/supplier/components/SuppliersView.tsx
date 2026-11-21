"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { CONTRACT_STATUS_META, PANEL_CLASS, PERFORMANCE_TARGETS, ROUTES, SUPPLIER_FILTERS, SUPPLIER_STATUS_META } from "@/common/const";
import type { Column, Supplier, SupplierFilter } from "@/common/type";
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
import { useSupplier } from "../SupplierProvider";
import { contractStatus, currentContract, supplierMetrics } from "../utils";
import { MetricBadge } from "./MetricBadge";
import { SupplierLink } from "./SupplierLink";

type FormValues = { name: string; contact: string; email: string; phone: string; category: string; terms: string; lead: string };
const EMPTY: FormValues = { name: "", contact: "", email: "", phone: "", category: "", terms: "30", lead: "14" };

function AddSupplierForm({ onCancel }: { onCancel: () => void }) {
  const { addSupplier } = useSupplier();
  const router = useRouter();
  const [v, setV] = useState<FormValues>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const text = (key: keyof FormValues) => (e: React.ChangeEvent<HTMLInputElement>) => setV((p) => ({ ...p, [key]: e.target.value }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const found: typeof errors = {};
    if (!v.name.trim()) found.name = "Enter the supplier name.";
    if (!v.contact.trim()) found.contact = "Enter a contact person.";
    const terms = Number(v.terms);
    const lead = Number(v.lead);
    if (!Number.isInteger(terms) || terms < 0) found.terms = "Enter payment terms in days.";
    if (!Number.isInteger(lead) || lead < 0) found.lead = "Enter the delivery time in days.";
    setErrors(found);
    if (Object.keys(found).length) return;

    const id = addSupplier({
      name: v.name.trim(),
      contact: v.contact.trim(),
      email: v.email.trim() || "-",
      phone: v.phone.trim() || "-",
      category: v.category.trim() || "-",
      paymentTermsDays: terms,
      leadTimeDays: lead,
    });
    router.push(ROUTES.supplier.supplier(id));
  };

  return (
    <form onSubmit={submit} noValidate className={cn(PANEL_CLASS, "mb-6")}>
      <h2 className="font-semibold">New supplier</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Field label="Supplier name" htmlFor="sup-name" error={errors.name}>
          <Input id="sup-name" value={v.name} onChange={text("name")} invalid={Boolean(errors.name)} />
        </Field>
        <Field label="Contact person" htmlFor="sup-contact" error={errors.contact}>
          <Input id="sup-contact" value={v.contact} onChange={text("contact")} invalid={Boolean(errors.contact)} />
        </Field>
        <Field label="Category" htmlFor="sup-category">
          <Input id="sup-category" value={v.category} onChange={text("category")} />
        </Field>
        <Field label="Email" htmlFor="sup-email">
          <Input id="sup-email" type="email" value={v.email} onChange={text("email")} />
        </Field>
        <Field label="Phone" htmlFor="sup-phone">
          <Input id="sup-phone" value={v.phone} onChange={text("phone")} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Payment terms (days)" htmlFor="sup-terms" error={errors.terms}>
            <Input id="sup-terms" type="number" min={0} step={1} value={v.terms} onChange={text("terms")} invalid={Boolean(errors.terms)} className="tabular-nums" />
          </Field>
          <Field label="Delivery time (days)" htmlFor="sup-lead" error={errors.lead}>
            <Input id="sup-lead" type="number" min={0} step={1} value={v.lead} onChange={text("lead")} invalid={Boolean(errors.lead)} className="tabular-nums" />
          </Field>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <Button type="submit">Create supplier</Button>
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

export function SuppliersView() {
  const { suppliers, contracts, deliveries } = useSupplier();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<SupplierFilter>("all");
  const [adding, setAdding] = useState(false);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return suppliers.filter(
      (s) => (status === "all" || s.status === status) && (!q || [s.id, s.name, s.contact, s.category].some((v) => v.toLowerCase().includes(q))),
    );
  }, [suppliers, query, status]);

  const columns: Column<Supplier>[] = [
    { key: "id", header: "ID", cell: (s) => s.id },
    { key: "name", header: "Supplier", cell: (s) => <SupplierLink id={s.id} showContact /> },
    { key: "category", header: "Category", cell: (s) => s.category },
    { key: "status", header: "Status", cell: (s) => <StatusBadge meta={SUPPLIER_STATUS_META[s.status]} /> },
    {
      key: "contract",
      header: "Contract",
      cell: (s) => {
        const c = currentContract(s.id, contracts);
        return c ? <StatusBadge meta={CONTRACT_STATUS_META[contractStatus(c)]} /> : <span className="text-ink-muted">No contract</span>;
      },
    },
    { key: "lead", header: "Delivery time", align: "right", cell: (s) => `${s.leadTimeDays} days` },
    { key: "terms", header: "Payment terms", align: "right", cell: (s) => `${s.paymentTermsDays} days` },
    { key: "ontime", header: "On-time", cell: (s) => <MetricBadge value={supplierMetrics(s.id, deliveries).onTimePct} target={PERFORMANCE_TARGETS.onTimePct} /> },
  ];

  const expiring = suppliers.filter((s) => {
    const c = currentContract(s.id, contracts);
    return c && contractStatus(c) !== "active";
  }).length;

  return (
    <>
      <PageHeader
        title="Suppliers"
        code="SUP01"
        description="One profile per supplier: contact details, contract and prices, orders and performance."
        actions={!adding && <Button onClick={() => setAdding(true)}>New supplier</Button>}
      />

      <StatGrid columns={3}>
        <StatTile label="Suppliers" value={suppliers.length} />
        <StatTile label="Active" value={suppliers.filter((s) => s.status === "active").length} />
        <StatTile label="Contracts expiring or expired" value={expiring} tone={expiring ? "warning" : undefined} />
      </StatGrid>

      {adding && <AddSupplierForm onCancel={() => setAdding(false)} />}

      <FilterBar>
        <SearchInput id="sup-search" label="Search suppliers" value={query} onChange={setQuery} placeholder="Search name, contact or category" />
        <Select variant="filter" id="sup-status" label="Status" value={status} onChange={setStatus} options={SUPPLIER_FILTERS} />
      </FilterBar>

      <DataTable caption="Suppliers" columns={columns} rows={rows} rowKey={(s) => s.id} empty="No suppliers match your search." />
    </>
  );
}
