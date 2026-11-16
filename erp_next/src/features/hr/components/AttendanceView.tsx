"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatTile } from "@/components/ui/StatTile";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { controlClass } from "@/components/ui/controls";
import { DEMO_TODAY, formatDate } from "@/lib/date";
import { cn } from "@/lib/cn";
import { useHr } from "../HrProvider";
import type { AttendanceRecord } from "../types";
import { ATTENDANCE_META, SHIFTS, attendanceStatus, formatHours, overtimeMinutes, workedMinutes } from "../utils";
import { EmployeeLink } from "./EmployeeLink";

export function AttendanceView() {
  const { attendance, employees, employeesById, meId, clockIn, clockOut } = useHr();
  const [who, setWho] = useState("all");
  const [range, setRange] = useState<"all" | "today">("all");

  const mine = attendance.find((r) => r.employeeId === meId && r.date === DEMO_TODAY);
  const canClockOut = Boolean(mine?.clockIn && !mine.clockOut);

  const rows = useMemo(
    () =>
      attendance
        .filter((r) => (who === "all" || r.employeeId === who) && (range === "all" || r.date === DEMO_TODAY))
        .sort((a, b) => b.date.localeCompare(a.date) || (employeesById[a.employeeId]?.name ?? "").localeCompare(employeesById[b.employeeId]?.name ?? "")),
    [attendance, who, range, employeesById],
  );

  const today = attendance.filter((r) => r.date === DEMO_TODAY);
  const overtimeTotal = attendance.reduce((total, r) => total + overtimeMinutes(r), 0);
  const absences = attendance.filter((r) => r.absent).length;

  const columns: Column<AttendanceRecord>[] = [
    { key: "date", header: "Date", cell: (r) => formatDate(r.date) },
    { key: "emp", header: "Employee", cell: (r) => <EmployeeLink id={r.employeeId} /> },
    {
      key: "shift",
      header: "Shift",
      cell: (r) => (
        <div>
          <p>{SHIFTS[r.shift].label}</p>
          <p className="text-xs text-ink-muted">{SHIFTS[r.shift].start}-{SHIFTS[r.shift].end}</p>
        </div>
      ),
    },
    { key: "in", header: "Clock in", cell: (r) => r.clockIn ?? "-" },
    { key: "out", header: "Clock out", cell: (r) => r.clockOut ?? "-" },
    { key: "hours", header: "Paid hours", align: "right", cell: (r) => { const m = workedMinutes(r); return m === null ? "-" : formatHours(m); } },
    { key: "ot", header: "Overtime", align: "right", cell: (r) => { const m = overtimeMinutes(r); return m ? formatHours(m) : "-"; } },
    {
      key: "status",
      header: "Status",
      cell: (r) => {
        const s = attendanceStatus(r);
        return (
          <div>
            <StatusBadge tone={ATTENDANCE_META[s].tone}>{ATTENDANCE_META[s].label}</StatusBadge>
            {r.note && <p className="text-xs text-ink-muted">{r.note}</p>}
          </div>
        );
      },
    },
  ];

  return (
    <>
      <PageHeader
        title="Time and attendance"
        code="HR03"
        description="Work hours, shifts, overtime and attendance logs. Paid hours exclude a 60 minute break; anything over 8 paid hours is overtime."
        actions={
          <>
            <Button onClick={clockIn} disabled={Boolean(mine)}>Clock in</Button>
            <Button variant="secondary" onClick={clockOut} disabled={!canClockOut}>Clock out</Button>
          </>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Clocked in today" value={today.filter((r) => r.clockIn).length} hint={`of ${employees.length - 1} on shift`} />
        <StatTile label="Late today" value={today.filter((r) => attendanceStatus(r) === "late").length} tone="warning" hint="More than 10 minutes after shift start" />
        <StatTile label="Overtime logged" value={formatHours(overtimeTotal)} hint="In the logs below" />
        <StatTile label="Absences" value={absences} hint="In the logs below" />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label htmlFor="att-who" className="sr-only">Employee</label>
        <select id="att-who" value={who} onChange={(e) => setWho(e.target.value)} className={cn(controlClass, "h-9")}>
          <option value="all">All employees</option>
          {employees.filter((e) => e.id !== "EMP-1001").map((e) => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>
        <label htmlFor="att-range" className="sr-only">Period</label>
        <select id="att-range" value={range} onChange={(e) => setRange(e.target.value as "all" | "today")} className={cn(controlClass, "h-9")}>
          <option value="all">Last 6 working days</option>
          <option value="today">Today only</option>
        </select>
      </div>

      <DataTable caption="Attendance logs" columns={columns} rows={rows} rowKey={(r) => r.id} empty="No attendance logs for this selection." />
      <p className="mt-3 text-xs text-ink-muted">Clock in and out records you as the signed-in employee, using your device time.</p>
    </>
  );
}
