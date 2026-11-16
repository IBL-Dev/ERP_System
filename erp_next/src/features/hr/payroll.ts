import type { AttendanceRecord, Employee, LeaveRequest } from "./types";
import { overtimeMinutes, salaryAt } from "./utils";

/**
 * SAMPLE payroll rules. Rates and slabs differ by country and company:
 * replace these values with your own (later they can come from a settings screen or API).
 */
export const PAYROLL_RULES = {
  periodLabel: "November 2026",
  periodStart: "2026-11-01",
  periodEnd: "2026-11-30",
  workingDays: 21,
  hoursPerDay: 8,
  overtimeMultiplier: 1.5,
  /** Fixed monthly allowance paid to every employee. */
  allowance: 100,
  /** Share of basic salary the employee pays into the pension fund. */
  pensionRate: 0.08,
  /** Monthly income tax slabs, applied to the part of income inside each slab. */
  taxSlabs: [
    { upTo: 1000, rate: 0 },
    { upTo: 2500, rate: 0.06 },
    { upTo: 4000, rate: 0.12 },
    { upTo: Number.POSITIVE_INFINITY, rate: 0.18 },
  ],
} as const;

export type Payslip = {
  employeeId: string;
  basic: number;
  allowance: number;
  overtimeHours: number;
  overtimePay: number;
  gross: number;
  unpaidLeaveDays: number;
  unpaidLeave: number;
  pension: number;
  taxable: number;
  tax: number;
  totalDeductions: number;
  net: number;
};

const round = (n: number) => Math.round(n * 100) / 100;

export function incomeTax(taxable: number): number {
  let tax = 0;
  let lower = 0;
  for (const slab of PAYROLL_RULES.taxSlabs) {
    if (taxable > lower) tax += (Math.min(taxable, slab.upTo) - lower) * slab.rate;
    lower = slab.upTo;
  }
  return round(tax);
}

export function computePayslip(employee: Employee, attendance: AttendanceRecord[], leave: LeaveRequest[]): Payslip {
  const { periodStart, periodEnd, workingDays, hoursPerDay, overtimeMultiplier, allowance, pensionRate } = PAYROLL_RULES;
  const basic = salaryAt(employee, periodEnd);
  const hourly = basic / (workingDays * hoursPerDay);

  const otMinutes = attendance
    .filter((r) => r.employeeId === employee.id && r.date >= periodStart && r.date <= periodEnd)
    .reduce((total, r) => total + overtimeMinutes(r), 0);
  const overtimeHours = round(otMinutes / 60);
  const overtimePay = round(overtimeHours * hourly * overtimeMultiplier);

  const unpaidLeaveDays = leave
    .filter((l) => l.employeeId === employee.id && l.type === "unpaid" && l.status === "approved" && l.from >= periodStart && l.from <= periodEnd)
    .reduce((total, l) => total + l.days, 0);
  const unpaidLeave = round(unpaidLeaveDays * (basic / workingDays));

  const gross = round(basic + allowance + overtimePay);
  const pension = round(basic * pensionRate);
  const taxable = Math.max(0, round(gross - unpaidLeave - pension));
  const tax = incomeTax(taxable);
  const totalDeductions = round(unpaidLeave + pension + tax);

  return {
    employeeId: employee.id,
    basic,
    allowance,
    overtimeHours,
    overtimePay,
    gross,
    unpaidLeaveDays,
    unpaidLeave,
    pension,
    taxable,
    tax,
    totalDeductions,
    net: round(gross - totalDeductions),
  };
}

