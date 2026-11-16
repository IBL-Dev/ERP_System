"use client";

import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Field } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/PageHeader";
import { controlClass } from "@/components/ui/controls";
import { DEMO_TODAY, formatDate } from "@/lib/date";
import { cn } from "@/lib/cn";
import { useHr } from "../HrProvider";
import type { SalaryRecord } from "../types";
import { CONTRACT_LABEL, DEPARTMENT_LABEL, formatMoney, salaryAt } from "../utils";
import { EmployeeLink } from "./EmployeeLink";

function Details({ title, rows }: { title: string; rows: [string, ReactNode][] }) {
  return (
    <section className="rounded-md border border-line bg-panel p-4">
      <h2 className="font-semibold">{title}</h2>
      <dl className="mt-3 grid grid-cols-[9rem_1fr] gap-x-3 gap-y-2 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-ink-muted">{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function EmployeeDetailView({ id }: { id: string }) {
  const { employees, employeesById, recordSalaryChange } = useHr();
  const employee = employeesById[id];
  const [amount, setAmount] = useState("");
  const [effective, setEffective] = useState(DEMO_TODAY);
  const [reason, setReason] = useState("Annual review");
  const [error, setError] = useState<string | null>(null);

  if (!employee) {
    return (
      <>
        <PageHeader title="Employee not found" />
        <p className="text-sm">
          There is no employee with ID {id}.{" "}
          <Link href="/hr/employees" className="text-accent hover:underline">Back to employee records</Link>
        </p>
      </>
    );
  }

  const manager = employee.managerId ? employeesById[employee.managerId] : undefined;
  const reports = employees.filter((e) => e.managerId === employee.id);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const value = Number(amount);
    if (!amount || !Number.isFinite(value) || value <= 0) return setError("Enter a monthly salary above 0.");
    if (!effective) return setError("Choose the date the change takes effect.");
    setError(null);
    recordSalaryChange(employee.id, value, effective, reason.trim() || "Salary change");
    setAmount("");
  };

  const historyColumns: Column<SalaryRecord>[] = [
    { key: "effective", header: "Effective from", cell: (s) => formatDate(s.effective) },
    { key: "amount", header: "Basic salary / month", align: "right", cell: (s) => formatMoney(s.amount) },
    { key: "reason", header: "Reason", cell: (s) => s.reason },
  ];

  return (
    <>
      <PageHeader
        title={employee.name}
        code={employee.id}
        description={`${employee.jobTitle}, ${DEPARTMENT_LABEL[employee.department]}`}
        actions={<Link href="/hr/employees" className="text-sm text-accent hover:underline">All employees</Link>}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Details
          title="Personal details"
          rows={[
            ["Email", employee.email],
            ["Phone", employee.phone],
            ["Address", employee.address],
            ["Date of birth", employee.dateOfBirth === "-" ? "-" : formatDate(employee.dateOfBirth)],
            ["Emergency contact", employee.emergencyContact],
          ]}
        />
        <Details
          title="Job and contract"
          rows={[
            ["Job title", employee.jobTitle],
            ["Department", DEPARTMENT_LABEL[employee.department]],
            ["Reports to", manager ? <EmployeeLink key="m" id={manager.id} /> : "-"],
            ["Hire date", formatDate(employee.hireDate)],
            ["Contract", CONTRACT_LABEL[employee.contract.type]],
            ["Contract period", `${formatDate(employee.contract.start)} to ${employee.contract.end ? formatDate(employee.contract.end) : "open-ended"}`],
            ["Basic salary", `${formatMoney(salaryAt(employee))} / month`],
          ]}
        />
      </div>

      <section aria-labelledby="salary" className="mt-6">
        <h2 id="salary" className="mb-3 font-semibold">Salary history</h2>
        <div className="grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-start">
          <DataTable caption="Salary history" columns={historyColumns} rows={employee.salaryHistory} rowKey={(s) => `${s.effective}-${s.amount}`} />
          <form onSubmit={submit} noValidate className="space-y-3 rounded-md border border-line bg-panel p-4">
            <h3 className="text-sm font-semibold">Record a salary change</h3>
            <Field label="New monthly salary" htmlFor="sal-amount" error={error}>
              <input id="sal-amount" type="number" min={0} step={50} value={amount} onChange={(e) => setAmount(e.target.value)} className={cn(controlClass, "h-9 w-full tabular-nums")} />
            </Field>
            <Field label="Effective from" htmlFor="sal-date">
              <input id="sal-date" type="date" value={effective} onChange={(e) => setEffective(e.target.value)} className={cn(controlClass, "h-9 w-full")} />
            </Field>
            <Field label="Reason" htmlFor="sal-reason">
              <input id="sal-reason" value={reason} onChange={(e) => setReason(e.target.value)} className={cn(controlClass, "h-9 w-full")} />
            </Field>
            <Button type="submit" size="sm">Save change</Button>
          </form>
        </div>
      </section>

      {reports.length > 0 && (
        <section aria-labelledby="reports" className="mt-6">
          <h2 id="reports" className="mb-3 font-semibold">Direct reports</h2>
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {reports.map((r) => (
              <li key={r.id} className="rounded-md border border-line bg-panel p-3">
                <EmployeeLink id={r.id} showTitle />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
