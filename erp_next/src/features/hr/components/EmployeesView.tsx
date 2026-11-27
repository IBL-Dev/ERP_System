"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { CONTRACT_LABEL, DEMO_TODAY, DEPARTMENT_FILTERS, DEPARTMENT_HEAD, DEPARTMENT_LABEL, DEPARTMENT_OPTIONS, PANEL_CLASS, ROUTES } from "@/common/const";
import type { Column, Department, DepartmentFilter, Employee } from "@/common/type";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Field } from "@/components/ui/Field";
import { FilterBar } from "@/components/ui/FilterBar";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { Select } from "@/components/ui/Select";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/date";
import { formatMoney } from "@/lib/format";
import { useHr } from "../HrProvider";
import { salaryAt } from "../utils";
import { EmployeeLink } from "./EmployeeLink";

type FormValues = {
  name: string;
  jobTitle: string;
  department: Department;
  managerId: string;
  hireDate: string;
  salary: string;
  email: string;
};

const EMPTY_FORM: FormValues = { name: "", jobTitle: "", department: "inventory", managerId: DEPARTMENT_HEAD.inventory, hireDate: DEMO_TODAY, salary: "", email: "" };

function AddEmployeeForm({ onCancel }: { onCancel: () => void }) {
  const { employees, addEmployee } = useHr();
  const router = useRouter();
  const [v, setV] = useState<FormValues>(EMPTY_FORM);
  // Once someone picks a manager by hand, changing the department no longer overrides it.
  const [managerPicked, setManagerPicked] = useState(false);
  const managerOptions = employees.map((e) => ({ value: e.id, label: `${e.name} – ${e.jobTitle}` }));
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const set = <K extends keyof FormValues>(key: K) => (value: FormValues[K]) => setV((prev) => ({ ...prev, [key]: value }));
  const onText = (key: keyof FormValues) => (e: React.ChangeEvent<HTMLInputElement>) => set(key)(e.target.value as never);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const found: typeof errors = {};
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
      managerId: v.managerId,
      hireDate: v.hireDate,
      salary,
      email: v.email.trim() || "-",
    });
    router.push(ROUTES.hr.employee(id));
  };

  return (
    <form onSubmit={submit} noValidate className={cn(PANEL_CLASS, "mb-6")}>
      <h2 className="font-semibold">New employee</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Field label="Full name" htmlFor="new-name" error={errors.name}>
          <Input id="new-name" value={v.name} onChange={onText("name")} invalid={Boolean(errors.name)} />
        </Field>
        <Field label="Job title" htmlFor="new-title" error={errors.jobTitle}>
          <Input id="new-title" value={v.jobTitle} onChange={onText("jobTitle")} invalid={Boolean(errors.jobTitle)} />
        </Field>
        <Field label="Department" htmlFor="new-dept">
          <Select
            id="new-dept"
            value={v.department}
            options={DEPARTMENT_OPTIONS}
            onChange={(department) =>
              setV((prev) => ({ ...prev, department, managerId: managerPicked ? prev.managerId : DEPARTMENT_HEAD[department] }))
            }
          />
        </Field>
        <Field label="Reports to" htmlFor="new-manager" hint="Starts as the department head. Choose someone else if needed.">
          <Select
            id="new-manager"
            value={v.managerId}
            options={managerOptions}
            onChange={(managerId) => {
              setManagerPicked(true);
              set("managerId")(managerId);
            }}
          />
        </Field>
        <Field label="Hire date" htmlFor="new-hire" error={errors.hireDate}>
          <Input id="new-hire" type="date" value={v.hireDate} onChange={onText("hireDate")} invalid={Boolean(errors.hireDate)} />
        </Field>
        <Field label="Monthly basic salary" htmlFor="new-salary" error={errors.salary}>
          <Input id="new-salary" type="number" min={0} step={50} value={v.salary} onChange={onText("salary")} invalid={Boolean(errors.salary)} className="tabular-nums" />
        </Field>
        <Field label="Work email" htmlFor="new-email">
          <Input id="new-email" type="email" value={v.email} onChange={onText("email")} />
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
  const [dept, setDept] = useState<DepartmentFilter>("all");
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

      <FilterBar>
        <SearchInput id="emp-search" label="Search employees" value={query} onChange={setQuery} placeholder="Search name, ID or job title" />
        <Select variant="filter" id="emp-dept" label="Department" value={dept} onChange={setDept} options={DEPARTMENT_FILTERS} />
      </FilterBar>

      <DataTable caption="Employee records" columns={columns} rows={rows} rowKey={(e) => e.id} empty="No employees match your search." />
    </>
  );
}
