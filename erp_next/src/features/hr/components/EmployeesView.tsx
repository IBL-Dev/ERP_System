"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Field } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/PageHeader";
import { controlClass } from "@/components/ui/controls";
import { DEMO_TODAY, formatDate } from "@/lib/date";
import { cn } from "@/lib/cn";
import { useHr } from "../HrProvider";
import type { Department, Employee } from "../types";
import { CONTRACT_LABEL, DEPARTMENT_LABEL, formatMoney, salaryAt } from "../utils";
import { EmployeeLink } from "./EmployeeLink";

const DEPARTMENTS = Object.keys(DEPARTMENT_LABEL) as Department[];

function AddEmployeeForm({ onCancel }: { onCancel: () => void }) {
  const { addEmployee } = useHr();
  const router = useRouter();
  const [v, setV] = useState({ name: "", jobTitle: "", department: "inventory" as Department, hireDate: DEMO_TODAY, salary: "", email: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (key: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setV((prev) => ({ ...prev, [key]: e.target.value }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const found: Record<string, string> = {};
    if (!v.name.trim()) found.name = "Enter the employee's name.";
    if (!v.jobTitle.trim()) found.jobTitle = "Enter a job title.";
    if (!v.hireDate) found.hireDate = "Choose a hire date.";
    const salary = Number(v.salary);
    if (!v.salary || !Number.isFinite(salary) || salary <= 0) found.salary = "Enter a monthly salary above 0.";
    setErrors(found);
    if (Object.keys(found).length) return;

    const id = addEmployee({
      name: v.name.trim(),
      jobTitle: v.jobTitle.trim(),
      department: v.department,
      hireDate: v.hireDate,
      salary,
      email: v.email.trim() || "-",
    });
    router.push(`/hr/employees/${id}`);
  };

  return (
    <form onSubmit={submit} noValidate className="mb-6 rounded-md border border-line bg-panel p-4">
      <h2 className="font-semibold">New employee</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Field label="Full name" htmlFor="new-name" error={errors.name}>
          <input id="new-name" value={v.name} onChange={set("name")} className={cn(controlClass, "h-9 w-full")} />
        </Field>
        <Field label="Job title" htmlFor="new-title" error={errors.jobTitle}>
          <input id="new-title" value={v.jobTitle} onChange={set("jobTitle")} className={cn(controlClass, "h-9 w-full")} />
        </Field>
        <Field label="Department" htmlFor="new-dept" hint="The department head becomes the manager.">
          <select id="new-dept" value={v.department} onChange={set("department")} className={cn(controlClass, "h-9 w-full")}>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>{DEPARTMENT_LABEL[d]}</option>
            ))}
          </select>
        </Field>
        <Field label="Hire date" htmlFor="new-hire" error={errors.hireDate}>
          <input id="new-hire" type="date" value={v.hireDate} onChange={set("hireDate")} className={cn(controlClass, "h-9 w-full")} />
        </Field>
        <Field label="Monthly basic salary" htmlFor="new-salary" error={errors.salary}>
          <input id="new-salary" type="number" min={0} step={50} value={v.salary} onChange={set("salary")} className={cn(controlClass, "h-9 w-full tabular-nums")} />
        </Field>
        <Field label="Work email" htmlFor="new-email">
          <input id="new-email" type="email" value={v.email} onChange={set("email")} className={cn(controlClass, "h-9 w-full")} />
        </Field>
      </div>
      <div className="mt-4 flex gap-2">
        <Button type="submit">Create record</Button>
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

export function EmployeesView() {
  const { employees, employeesById } = useHr();
  const [query, setQuery] = useState("");
  const [dept, setDept] = useState<Department | "all">("all");
  const [adding, setAdding] = useState(false);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return employees.filter(
      (e) => (dept === "all" || e.department === dept) && (!q || [e.id, e.name, e.jobTitle].some((v) => v.toLowerCase().includes(q))),
    );
  }, [employees, query, dept]);

  const columns: Column<Employee>[] = [
    { key: "id", header: "ID", cell: (e) => e.id },
    { key: "name", header: "Name", cell: (e) => <EmployeeLink id={e.id} showTitle /> },
    { key: "dept", header: "Department", cell: (e) => DEPARTMENT_LABEL[e.department] },
    { key: "manager", header: "Reports to", cell: (e) => (e.managerId ? employeesById[e.managerId]?.name : "-") },
    { key: "hired", header: "Hired", cell: (e) => formatDate(e.hireDate) },
    { key: "contract", header: "Contract", cell: (e) => CONTRACT_LABEL[e.contract.type] },
    { key: "salary", header: "Basic salary / month", align: "right", cell: (e) => formatMoney(salaryAt(e)) },
  ];

  return (
    <>
      <PageHeader
        title="Employee records"
        code="HR01"
        description="One record per person: personal details, job, contract and salary history."
        actions={!adding && <Button onClick={() => setAdding(true)}>New employee</Button>}
      />

      {adding && <AddEmployeeForm onCancel={() => setAdding(false)} />}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label htmlFor="emp-search" className="sr-only">Search employees</label>
        <input id="emp-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, ID or job title" className={cn(controlClass, "h-9 w-64")} />
        <label htmlFor="emp-dept" className="sr-only">Department</label>
        <select id="emp-dept" value={dept} onChange={(e) => setDept(e.target.value as Department | "all")} className={cn(controlClass, "h-9")}>
          <option value="all">All departments</option>
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>{DEPARTMENT_LABEL[d]}</option>
          ))}
        </select>
      </div>

      <DataTable caption="Employee records" columns={columns} rows={rows} rowKey={(e) => e.id} empty="No employees match your search." />
    </>
  );
}
