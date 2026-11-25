"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import {
  CONTRACT_LABEL,
  CONTRACT_TYPE_OPTIONS,
  DEMO_TODAY,
  DEPARTMENT_LABEL,
  DEPARTMENT_OPTIONS,
  PANEL_CLASS,
  ROUTES,
} from "@/common/const";
import type { Column, Contract, Department, Employee, SalaryRecord } from "@/common/type";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { DescriptionList } from "@/components/ui/DescriptionList";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { Select } from "@/components/ui/Select";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/date";
import { formatMoney } from "@/lib/format";
import { useHr } from "../HrProvider";
import { possibleManagers, salaryAt } from "../utils";
import { EmployeeLink } from "./EmployeeLink";

const historyColumns: Column<SalaryRecord>[] = [
  { key: "effective", header: "Effective from", cell: (s) => formatDate(s.effective) },
  { key: "amount", header: "Basic salary / month", align: "right", cell: (s) => formatMoney(s.amount) },
  { key: "reason", header: "Reason", cell: (s) => s.reason },
];

/** "-" is how empty personal details are stored; show it as an empty field. */
const blankIfDash = (value: string) => (value === "-" ? "" : value);
const dashIfBlank = (value: string) => value.trim() || "-";

function PersonalForm({ employee, onDone }: { employee: Employee; onDone: (message: string) => void }) {
  const { updateEmployee } = useHr();
  const [v, setV] = useState({
    name: employee.name,
    email: blankIfDash(employee.email),
    phone: blankIfDash(employee.phone),
    address: blankIfDash(employee.address),
    dateOfBirth: blankIfDash(employee.dateOfBirth),
    emergencyContact: blankIfDash(employee.emergencyContact),
  });
  const [error, setError] = useState<string | null>(null);
  const text = (key: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement>) => setV((p) => ({ ...p, [key]: e.target.value }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!v.name.trim()) return setError("Enter the employee's name.");
    const message = updateEmployee(employee.id, {
      name: v.name.trim(),
      email: dashIfBlank(v.email),
      phone: dashIfBlank(v.phone),
      address: dashIfBlank(v.address),
      dateOfBirth: dashIfBlank(v.dateOfBirth),
      emergencyContact: dashIfBlank(v.emergencyContact),
    });
    if (message) return setError(message);
    onDone("Personal details saved.");
  };

  return (
    <form onSubmit={submit} noValidate className={cn(PANEL_CLASS, "space-y-3")}>
      <h2 className="font-semibold">Edit personal details</h2>
      <Field label="Full name" htmlFor="pd-name" error={error}>
        <Input id="pd-name" value={v.name} onChange={text("name")} invalid={Boolean(error)} />
      </Field>
      <Field label="Email" htmlFor="pd-email">
        <Input id="pd-email" type="email" value={v.email} onChange={text("email")} />
      </Field>
      <Field label="Phone" htmlFor="pd-phone">
        <Input id="pd-phone" value={v.phone} onChange={text("phone")} />
      </Field>
      <Field label="Address" htmlFor="pd-address">
        <Input id="pd-address" value={v.address} onChange={text("address")} />
      </Field>
      <Field label="Date of birth" htmlFor="pd-dob">
        <Input id="pd-dob" type="date" value={v.dateOfBirth} onChange={text("dateOfBirth")} />
      </Field>
      <Field label="Emergency contact" htmlFor="pd-emergency">
        <Input id="pd-emergency" value={v.emergencyContact} onChange={text("emergencyContact")} />
      </Field>
      <div className="flex gap-2">
        <Button type="submit">Save</Button>
        <Button variant="secondary" onClick={() => onDone("")}>Cancel</Button>
      </div>
    </form>
  );
}

function JobForm({ employee, onDone }: { employee: Employee; onDone: (message: string) => void }) {
  const { employees, updateEmployee } = useHr();
  const [v, setV] = useState({
    jobTitle: employee.jobTitle,
    department: employee.department as Department,
    managerId: employee.managerId ?? "",
    contractType: employee.contract.type as Contract["type"],
    contractStart: employee.contract.start,
    contractEnd: employee.contract.end ?? "",
  });
  const [error, setError] = useState<string | null>(null);

  // Nobody can report to themselves or to someone below them.
  const managerOptions = [
    ...(employee.managerId === null ? [{ value: "", label: "No one (top of the organization)" }] : []),
    ...possibleManagers(employees, employee.id).map((m) => ({ value: m.id, label: `${m.name} – ${m.jobTitle}` })),
  ];

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!v.jobTitle.trim()) return setError("Enter a job title.");
    if (!v.contractStart) return setError("Choose the contract start date.");
    const message = updateEmployee(employee.id, {
      jobTitle: v.jobTitle.trim(),
      department: v.department,
      managerId: v.managerId || null,
      contract: { type: v.contractType, start: v.contractStart, end: v.contractEnd || null },
    });
    if (message) return setError(message);
    onDone("Job and contract saved.");
  };

  return (
    <form onSubmit={submit} noValidate className={cn(PANEL_CLASS, "space-y-3")}>
      <h2 className="font-semibold">Edit job and contract</h2>
      <Field label="Job title" htmlFor="jb-title" error={error}>
        <Input id="jb-title" value={v.jobTitle} onChange={(e) => setV((p) => ({ ...p, jobTitle: e.target.value }))} invalid={Boolean(error)} />
      </Field>
      <Field label="Department" htmlFor="jb-dept">
        <Select id="jb-dept" value={v.department} options={DEPARTMENT_OPTIONS} onChange={(department) => setV((p) => ({ ...p, department }))} />
      </Field>
      <Field label="Reports to" htmlFor="jb-manager">
        <Select id="jb-manager" value={v.managerId} options={managerOptions} onChange={(managerId) => setV((p) => ({ ...p, managerId }))} />
      </Field>
      <Field label="Contract type" htmlFor="jb-contract">
        <Select id="jb-contract" value={v.contractType} options={CONTRACT_TYPE_OPTIONS} onChange={(contractType) => setV((p) => ({ ...p, contractType }))} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Contract starts" htmlFor="jb-start">
          <Input id="jb-start" type="date" value={v.contractStart} onChange={(e) => setV((p) => ({ ...p, contractStart: e.target.value }))} />
        </Field>
        <Field label="Contract ends" htmlFor="jb-end" hint="Leave empty if open-ended.">
          <Input id="jb-end" type="date" value={v.contractEnd} onChange={(e) => setV((p) => ({ ...p, contractEnd: e.target.value }))} />
        </Field>
      </div>
      <div className="flex gap-2">
        <Button type="submit">Save</Button>
        <Button variant="secondary" onClick={() => onDone("")}>Cancel</Button>
      </div>
    </form>
  );
}

export function EmployeeDetailView({ id }: { id: string }) {
  const { employees, employeesById, recordSalaryChange } = useHr();
  const employee = employeesById[id];
  const [editing, setEditing] = useState<"personal" | "job" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
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

  const finish = (message: string) => {
    setEditing(null);
    setNotice(message || null);
  };

  const submitSalary = (e: FormEvent) => {
    e.preventDefault();
    const value = Number(amount);
    if (!amount || !Number.isFinite(value) || value <= 0) return setError("Enter a monthly salary above 0.");
    if (!effective) return setError("Choose the date the change takes effect.");
    setError(null);
    recordSalaryChange(employee.id, value, effective, reason.trim() || "Salary change");
    setAmount("");
    setNotice("Salary change recorded.");
  };

  return (
    <>
      <PageHeader
        title={employee.name}
        code={employee.id}
        description={`${employee.jobTitle}, ${DEPARTMENT_LABEL[employee.department]}`}
        actions={<Link href={ROUTES.hr.employees} className="text-sm text-accent hover:underline">All employees</Link>}
      />

      <Notice>{notice}</Notice>

      <div className="grid gap-6 lg:grid-cols-2">
        {editing === "personal" ? (
          <PersonalForm key={employee.id} employee={employee} onDone={finish} />
        ) : (
          <Panel
            title="Personal details"
            titleId="personal"
            actions={<Button size="sm" variant="secondary" onClick={() => { setNotice(null); setEditing("personal"); }}>Edit</Button>}
          >
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
        )}

        {editing === "job" ? (
          <JobForm key={employee.id} employee={employee} onDone={finish} />
        ) : (
          <Panel
            title="Job and contract"
            titleId="job"
            actions={<Button size="sm" variant="secondary" onClick={() => { setNotice(null); setEditing("job"); }}>Edit</Button>}
          >
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
        )}
      </div>

      <section aria-labelledby="salary" className="mt-6">
        <h2 id="salary" className="mb-3 font-semibold">Salary history</h2>
        <div className="grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-start">
          <DataTable caption="Salary history" columns={historyColumns} rows={employee.salaryHistory} rowKey={(s) => `${s.effective}-${s.amount}`} />
          <form onSubmit={submitSalary} noValidate className={cn(PANEL_CLASS, "space-y-3")}>
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
