"use client";

import Link from "next/link";
import { useMemo } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatTile } from "@/components/ui/StatTile";
import { DEMO_TODAY, formatDate } from "@/lib/date";
import { useHr } from "../HrProvider";
import { PAYROLL_RULES, computePayslip } from "../payroll";
import {
  HOLIDAYS,
  LEAVE_LABEL,
  approverOf,
  attendanceStatus,
  formatMoney,
  trainingStatus,
} from "../utils";

export function OverviewView() {
  const { employees, employeesById, attendance, leave, training, meId } = useHr();

  const today = attendance.filter((r) => r.date === DEMO_TODAY);
  const clockedIn = today.filter((r) => r.clockIn).length;
  const lateToday = today.filter((r) => attendanceStatus(r) === "late").length;
  const overdueTraining = training.filter((t) => trainingStatus(t) === "overdue").length;

  const awaitingMe = leave.filter((l) => {
    const requester = employeesById[l.employeeId];
    return l.status === "pending" && requester && approverOf(requester) === meId && l.employeeId !== meId;
  });

  const netTotal = useMemo(
    () => employees.reduce((total, e) => total + computePayslip(e, attendance, leave).net, 0),
    [employees, attendance, leave],
  );

  const upcomingHolidays = HOLIDAYS.filter((h) => h.date >= DEMO_TODAY).slice(0, 3);

  return (
    <>
      <PageHeader title="HR overview" code="HR00" description="Headcount, attendance, approvals and payroll at a glance." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatTile label="Employees" value={employees.length} hint="Active records" href="/hr/employees" />
        <StatTile label="Clocked in today" value={clockedIn} hint={lateToday ? `${lateToday} late` : "No late arrivals"} href="/hr/attendance" />
        <StatTile
          label="Leave awaiting me"
          value={awaitingMe.length}
          hint="Requests you can approve"
          tone={awaitingMe.length ? "warning" : undefined}
          href="/hr/leave"
        />
        <StatTile
          label="Overdue training"
          value={overdueTraining}
          tone={overdueTraining ? "danger" : undefined}
          href="/hr/talent/training"
        />
        <StatTile label={`Net payroll, ${PAYROLL_RULES.periodLabel}`} value={formatMoney(netTotal)} hint="Draft calculation" href="/hr/payroll" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="approvals" className="rounded-md border border-line bg-panel p-4">
          <div className="flex items-center justify-between">
            <h2 id="approvals" className="font-semibold">Leave awaiting your approval</h2>
            <Link href="/hr/leave" className="text-sm text-accent hover:underline">Open leave</Link>
          </div>
          {awaitingMe.length === 0 ? (
            <p className="mt-4 text-sm text-ink-muted">Nothing to approve right now.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {awaitingMe.map((l) => (
                <li key={l.id} className="py-2 text-sm">
                  <p className="font-medium">{employeesById[l.employeeId]?.name}</p>
                  <p className="text-xs text-ink-muted">
                    {LEAVE_LABEL[l.type]}, {formatDate(l.from)} to {formatDate(l.to)} ({l.days} working days)
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="holidays" className="rounded-md border border-line bg-panel p-4">
          <h2 id="holidays" className="font-semibold">Upcoming company holidays</h2>
          <ul className="mt-3 divide-y divide-line">
            {upcomingHolidays.map((h) => (
              <li key={h.date} className="flex justify-between py-2 text-sm">
                <span>{h.name}</span>
                <span className="text-ink-muted">{formatDate(h.date)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
