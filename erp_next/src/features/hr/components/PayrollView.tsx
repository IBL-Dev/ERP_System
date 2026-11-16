"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatTile } from "@/components/ui/StatTile";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/cn";
import { useHr } from "../HrProvider";
import { PAYROLL_RULES, computePayslip, type Payslip } from "../payroll";
import { formatMoney } from "../utils";
import { EmployeeLink } from "./EmployeeLink";

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={cn("flex justify-between gap-4 py-1.5 text-sm", strong && "border-t border-line font-semibold")}>
      <dt>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}

export function PayrollView() {
  const { employees, employeesById, attendance, leave, payrollFinalized, finalizePayroll } = useHr();
  const [selected, setSelected] = useState<string | null>(null);

  const slips = useMemo(() => employees.map((e) => computePayslip(e, attendance, leave)), [employees, attendance, leave]);
  const sum = (pick: (p: Payslip) => number) => slips.reduce((total, p) => total + pick(p), 0);

  const slip = slips.find((p) => p.employeeId === selected);
  const slipOwner = slip ? employeesById[slip.employeeId] : undefined;

  const columns: Column<Payslip>[] = [
    { key: "emp", header: "Employee", cell: (p) => <EmployeeLink id={p.employeeId} /> },
    { key: "basic", header: "Basic", align: "right", cell: (p) => formatMoney(p.basic) },
    { key: "allow", header: "Allowance", align: "right", cell: (p) => formatMoney(p.allowance) },
    {
      key: "ot",
      header: "Overtime",
      align: "right",
      cell: (p) => (
        <div>
          <p>{formatMoney(p.overtimePay)}</p>
          {p.overtimeHours > 0 && <p className="text-xs text-ink-muted">{p.overtimeHours} h</p>}
        </div>
      ),
    },
    { key: "gross", header: "Gross", align: "right", cell: (p) => formatMoney(p.gross) },
    { key: "pension", header: "Pension", align: "right", cell: (p) => formatMoney(p.pension) },
    { key: "tax", header: "Income tax", align: "right", cell: (p) => formatMoney(p.tax) },
    { key: "unpaid", header: "Unpaid leave", align: "right", cell: (p) => (p.unpaidLeave ? formatMoney(p.unpaidLeave) : "-") },
    { key: "net", header: "Net pay", align: "right", cell: (p) => <strong>{formatMoney(p.net)}</strong> },
    {
      key: "slip",
      header: "Payslip",
      cell: (p) => (
        <Button size="sm" variant="secondary" aria-pressed={selected === p.employeeId} onClick={() => setSelected(selected === p.employeeId ? null : p.employeeId)}>
          {selected === p.employeeId ? "Hide" : "View"}
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={`Payroll, ${PAYROLL_RULES.periodLabel}`}
        code="HR08"
        description="Monthly salary calculation with deductions and tax. Overtime comes from the attendance logs and unpaid leave from approved leave."
        actions={
          <>
            <StatusBadge tone={payrollFinalized ? "success" : "warning"}>{payrollFinalized ? "Finalized" : "Draft"}</StatusBadge>
            <Button onClick={finalizePayroll} disabled={payrollFinalized}>Finalize payroll</Button>
          </>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Employees paid" value={slips.length} />
        <StatTile label="Gross pay" value={formatMoney(sum((p) => p.gross))} />
        <StatTile label="Deductions and tax" value={formatMoney(sum((p) => p.totalDeductions))} hint={`of which tax ${formatMoney(sum((p) => p.tax))}`} />
        <StatTile label="Net pay" value={formatMoney(sum((p) => p.net))} />
      </div>

      <DataTable caption="Payroll calculation by employee" columns={columns} rows={slips} rowKey={(p) => p.employeeId} />

      {slip && slipOwner && (
        <section aria-labelledby="payslip" className="mt-6 rounded-md border border-line bg-panel p-4">
          <h2 id="payslip" className="font-semibold">
            Payslip: {slipOwner.name}, {PAYROLL_RULES.periodLabel}
          </h2>
          <div className="mt-3 grid gap-8 md:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold text-ink-muted">Earnings</h3>
              <dl>
                <Line label="Basic salary" value={formatMoney(slip.basic)} />
                <Line label="Allowance" value={formatMoney(slip.allowance)} />
                <Line label={`Overtime (${slip.overtimeHours} h at ${PAYROLL_RULES.overtimeMultiplier}x)`} value={formatMoney(slip.overtimePay)} />
                <Line label="Gross pay" value={formatMoney(slip.gross)} strong />
              </dl>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-ink-muted">Deductions</h3>
              <dl>
                <Line label={`Unpaid leave (${slip.unpaidLeaveDays} days)`} value={formatMoney(slip.unpaidLeave)} />
                <Line label={`Pension fund (${PAYROLL_RULES.pensionRate * 100}% of basic)`} value={formatMoney(slip.pension)} />
                <Line label={`Income tax (on ${formatMoney(slip.taxable)})`} value={formatMoney(slip.tax)} />
                <Line label="Total deductions" value={formatMoney(slip.totalDeductions)} strong />
              </dl>
            </div>
          </div>
          <p className="mt-4 text-lg font-semibold">Net pay: {formatMoney(slip.net)}</p>
        </section>
      )}

      <details className="mt-6 rounded-md border border-line bg-panel p-4 text-sm">
        <summary className="cursor-pointer font-semibold">Sample rules used in this calculation</summary>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          <li>Working days in the period: {PAYROLL_RULES.workingDays}, {PAYROLL_RULES.hoursPerDay} hours a day.</li>
          <li>Overtime is paid at {PAYROLL_RULES.overtimeMultiplier} times the hourly rate (basic salary divided by working hours).</li>
          <li>Fixed monthly allowance: {formatMoney(PAYROLL_RULES.allowance)}.</li>
          <li>Pension fund: {PAYROLL_RULES.pensionRate * 100}% of basic salary, deducted before tax.</li>
          <li>
            Income tax on monthly taxable income (gross minus unpaid leave and pension):{" "}
            {PAYROLL_RULES.taxSlabs.map((s, i, all) => `${i === 0 ? "" : `${formatMoney(all[i - 1].upTo)} to `}${Number.isFinite(s.upTo) ? formatMoney(s.upTo) : "above"}: ${s.rate * 100}%`).join(", ")}.
          </li>
        </ul>
        <p className="mt-3 text-ink-muted">These are sample values. Edit them in features/hr/payroll.ts to match your country and company.</p>
      </details>
    </>
  );
}
