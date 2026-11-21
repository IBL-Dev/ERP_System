"use client";

import Link from "next/link";
import { useMemo } from "react";
import { DEMO_TODAY, HOLIDAYS, LEAVE_LABEL, PAYROLL_RULES, ROUTES } from "@/common/const";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { StatGrid } from "@/components/ui/StatGrid";
import { StatTile } from "@/components/ui/StatTile";
import { formatDate } from "@/lib/date";
import { formatMoney } from "@/lib/format";
import { useHr } from "../HrProvider";
import { computePayslip } from "../payroll";
import { approverOf, attendanceStatus, trainingStatus } from "../utils";

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

      <StatGrid columns={5}>
        <StatTile label="Employees" value={employees.length} hint="Active records" href={ROUTES.hr.employees} />
        <StatTile label="Clocked in today" value={clockedIn} hint={lateToday ? `${lateToday} late` : "No late arrivals"} href={ROUTES.hr.attendance} />
        <StatTile
          label="Leave awaiting me"
          value={awaitingMe.length}
          hint="Requests you can approve"
          tone={awaitingMe.length ? "warning" : undefined}
          href={ROUTES.hr.leave}
        />
        <StatTile label="Overdue training" value={overdueTraining} tone={overdueTraining ? "danger" : undefined} href={ROUTES.hr.training} />
        <StatTile label={`Net payroll, ${PAYROLL_RULES.periodLabel}`} value={formatMoney(netTotal)} hint="Draft calculation" href={ROUTES.hr.payroll} />
      </StatGrid>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          title="Leave awaiting your approval"
          titleId="approvals"
          actions={
            <Link href={ROUTES.hr.leave} className="text-sm text-accent hover:underline">
              Open leave
            </Link>
          }
        >
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
        </Panel>

        <Panel title="Upcoming company holidays" titleId="holidays">
          <ul className="mt-3 divide-y divide-line">
            {upcomingHolidays.map((h) => (
              <li key={h.date} className="flex justify-between py-2 text-sm">
                <span>{h.name}</span>
                <span className="text-ink-muted">{formatDate(h.date)}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
