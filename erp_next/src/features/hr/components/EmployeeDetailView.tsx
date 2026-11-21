"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { CONTRACT_LABEL, DEMO_TODAY, DEPARTMENT_LABEL, PANEL_CLASS, ROUTES } from "@/common/const";
import type { Column, SalaryRecord } from "@/common/type";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { DescriptionList } from "@/components/ui/DescriptionList";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/date";
import { formatMoney } from "@/lib/format";
import { useHr } from "../HrProvider";
import { salaryAt } from "../utils";
import { EmployeeLink } from "./EmployeeLink";

const historyColumns: Column<SalaryRecord>[] = [
  { key: "effective", header: "Effective from", cell: (s) => formatDate(s.effective) },
  { key: "amount", header: "Basic salary / month", align: "right", cell: (s) => formatMoney(s.amount) },
  { key: "reason", header: "Reason", cell: (s) => s.reason },
];

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
          <Link href={ROUTES.hr.employees} className="text-accent hover:underline">Back to employee records</Link>
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

  return (
    <>
      <PageHeader
        title={employee.name}
        code={employee.id}
        description={`${employee.jobTitle}, ${DEPARTMENT_LABEL[employee.department]}`}
        actions={<Link href={ROUTES.hr.employees} className="text-sm text-accent hover:underline">All employees</Link>}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Personal details" titleId="personal">
          <div className="mt-3">
            <DescriptionList
              items={[
                ["Email", employee.email],
                ["Phone", employee.phone],
                ["Address", employee.address],
                ["Date of birth", employee.dateOfBirth === "-" ? "-" : formatDate(employee.dateOfBirth)],
                ["Emergency contact", employee.emergencyContact],
              ]}
            />
          </div>
        </Panel>
        <Panel title="Job and contract" titleId="job">
          <div className="mt-3">
            <DescriptionList
              items={[
                ["Job title", employee.jobTitle],
                ["Department", DEPARTMENT_LABEL[employee.department]],
                ["Reports to", manager ? <EmployeeLink id={manager.id} /> : "-"],
                ["Hire date", formatDate(employee.hireDate)],
                ["Contract", CONTRACT_LABEL[employee.contract.type]],
                ["Contract period", `${formatDate(employee.contract.start)} to ${employee.contract.end ? formatDate(employee.contract.end) : "open-ended"}`],
                ["Basic salary", `${formatMoney(salaryAt(employee))} / month`],
              ]}
            />
          </div>
        </Panel>
      </div>

      <section aria-labelledby="salary" className="mt-6">
        <h2 id="salary" className="mb-3 font-semibold">Salary history</h2>
        <div className="grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-start">
          <DataTable caption="Salary history" columns={historyColumns} rows={employee.salaryHistory} rowKey={(s) => `${s.effective}-${s.amount}`} />
          <form onSubmit={submit} noValidate className={cn(PANEL_CLASS, "space-y-3")}>
            <h3 className="text-sm font-semibold">Record a salary change</h3>
            <Field label="New monthly salary" htmlFor="sal-amount" error={error}>
              <Input id="sal-amount" type="number" min={0} step={50} value={amount} onChange={(e) => setAmount(e.target.value)} invalid={Boolean(error)} className="tabular-nums" />
            </Field>
            <Field label="Effective from" htmlFor="sal-date">
              <Input id="sal-date" type="date" value={effective} onChange={(e) => setEffective(e.target.value)} />
            </Field>
            <Field label="Reason" htmlFor="sal-reason">
              <Input id="sal-reason" value={reason} onChange={(e) => setReason(e.target.value)} />
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
              <li key={r.id} className={cn(PANEL_CLASS, "p-3")}>
                <EmployeeLink id={r.id} showTitle />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
