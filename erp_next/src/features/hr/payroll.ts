import { PAYROLL_RULES } from "@/common/const";
import type { AttendanceRecord, Employee, LeaveRequest, Payslip } from "@/common/type";
import { overtimeMinutes, salaryAt } from "./utils";

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

