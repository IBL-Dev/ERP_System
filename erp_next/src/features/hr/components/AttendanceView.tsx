"use client";

import { useMemo, useState } from "react";
import { ATTENDANCE_META, ATTENDANCE_RANGES, DEMO_TODAY, EXECUTIVE_ID, SHIFTS } from "@/common/const";
import type { AttendanceRange, AttendanceRecord, Column } from "@/common/type";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { FilterBar } from "@/components/ui/FilterBar";
import { PageHeader } from "@/components/ui/PageHeader";
import { Select } from "@/components/ui/Select";
import { StatGrid } from "@/components/ui/StatGrid";
import { StatTile } from "@/components/ui/StatTile";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate, formatHours } from "@/lib/date";
import { useHr } from "../HrProvider";
import { attendanceStatus, overtimeMinutes, workedMinutes } from "../utils";
import { EmployeeLink } from "./EmployeeLink";

export function AttendanceView() {
  const { attendance, employees, employeesById, meId, clockIn, clockOut } = useHr();
  const [who, setWho] = useState("all");
  const [range, setRange] = useState<AttendanceRange>("all");

  const mine = attendance.find((r) => r.employeeId === meId && r.date === DEMO_TODAY);
  const canClockOut = Boolean(mine?.clockIn && !mine.clockOut);

  const rows = useMemo(
    () =>
      attendance
        .filter((r) => (who === "all" || r.employeeId === who) && (range === "all" || r.date === DEMO_TODAY))
        .sort(
          (a, b) =>
            b.date.localeCompare(a.date) ||
            (employeesById[a.employeeId]?.name ?? "").localeCompare(employeesById[b.employeeId]?.name ?? ""),
        ),
    [attendance, who, range, employeesById],
  );

  const onShift = employees.filter((e) => e.id !== EXECUTIVE_ID);
  const whoOptions = [{ value: "all", label: "All employees" }, ...onShift.map((e) => ({ value: e.id, label: e.name }))];

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
          <p className="text-xs text-ink-muted">
            {SHIFTS[r.shift].start}-{SHIFTS[r.shift].end}
          </p>
        </div>
      ),
    },
    { key: "in", header: "Clock in", cell: (r) => r.clockIn ?? "-" },
    { key: "out", header: "Clock out", cell: (r) => r.clockOut ?? "-" },
    {
      key: "hours",
      header: "Paid hours",
      align: "right",
      cell: (r) => {
        const m = workedMinutes(r);
        return m === null ? "-" : formatHours(m);
      },
    },
    {
      key: "ot",
      header: "Overtime",
      align: "right",
      cell: (r) => {
        const m = overtimeMinutes(r);
        return m ? formatHours(m) : "-";
      },
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => (
        <div>
          <StatusBadge meta={ATTENDANCE_META[attendanceStatus(r)]} />
          {r.note && <p className="text-xs text-ink-muted">{r.note}</p>}
        </div>
      ),
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

      <StatGrid>
        <StatTile label="Clocked in today" value={today.filter((r) => r.clockIn).length} hint={`of ${onShift.length} on shift`} />
        <StatTile label="Late today" value={today.filter((r) => attendanceStatus(r) === "late").length} tone="warning" hint="More than 10 minutes after shift start" />
        <StatTile label="Overtime logged" value={formatHours(overtimeTotal)} hint="In the logs below" />
        <StatTile label="Absences" value={absences} hint="In the logs below" />
      </StatGrid>

      <FilterBar>
        <Select variant="filter" id="att-who" label="Employee" value={who} onChange={setWho} options={whoOptions} />
        <Select variant="filter" id="att-range" label="Period" value={range} onChange={setRange} options={ATTENDANCE_RANGES} />
      </FilterBar>

      <DataTable caption="Attendance logs" columns={columns} rows={rows} rowKey={(r) => r.id} empty="No attendance logs for this selection." />
      <p className="mt-3 text-xs text-ink-muted">Clock in and out records you as the signed-in employee, using your device time.</p>
    </>
  );
}
