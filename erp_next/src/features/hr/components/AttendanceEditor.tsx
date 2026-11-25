"use client";

import { useState, type FormEvent } from "react";
import { ATTENDANCE_ENTRY_OPTIONS, DEMO_TODAY, EXECUTIVE_ID, PANEL_CLASS, SHIFT_OPTIONS } from "@/common/const";
import type { AttendanceRecord, ShiftId } from "@/common/type";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { cn } from "@/lib/cn";
import { formatHours } from "@/lib/date";
import { useHr } from "../HrProvider";
import { overtimeMinutes, workedMinutes } from "../utils";

type Props = {
  /** Record to correct. Leave out to add a record for any employee and day. */
  record?: AttendanceRecord;
  onSaved: (message: string) => void;
  onCancel: () => void;
};

/** Add or correct one employee's attendance for one day: times, shift, overtime and a note. */
export function AttendanceEditor({ record, onSaved, onCancel }: Props) {
  const { employees, employeesById, attendance, saveAttendance } = useHr();
  const editing = Boolean(record);

  const [employeeId, setEmployeeId] = useState(record?.employeeId ?? employees.find((e) => e.id !== EXECUTIVE_ID)?.id ?? "");
  const [date, setDate] = useState(record?.date ?? DEMO_TODAY);
  const [shift, setShift] = useState<ShiftId>(record?.shift ?? "day");
  const [status, setStatus] = useState(record?.absent ? "absent" : "present");
  const [clockIn, setClockIn] = useState(record?.clockIn ?? "");
  const [clockOut, setClockOut] = useState(record?.clockOut ?? "");
  const [overtime, setOvertime] = useState(record?.overtimeMinutes !== undefined ? String(record.overtimeMinutes / 60) : "");
  const [note, setNote] = useState(record?.note ?? "");
  const [error, setError] = useState<string | null>(null);

  const absent = status === "absent";
  const existing = attendance.find((r) => r.employeeId === employeeId && r.date === date);

  // What the times alone give, so the person can see it before overriding overtime.
  const preview: AttendanceRecord = { id: "preview", employeeId, date, shift, clockIn: clockIn || null, clockOut: clockOut || null };
  const worked = absent ? null : workedMinutes(preview);
  const calculatedOvertime = absent ? 0 : overtimeMinutes(preview);

  const options = employees.filter((e) => e.id !== EXECUTIVE_ID).map((e) => ({ value: e.id, label: e.name }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const hours = overtime.trim() === "" ? null : Number(overtime);
    if (hours !== null && (!Number.isFinite(hours) || hours < 0 || hours > 12)) return setError("Overtime must be between 0 and 12 hours.");
    if (!date) return setError("Choose a date.");
    const message = saveAttendance({
      employeeId,
      date,
      shift,
      absent,
      clockIn: clockIn || null,
      clockOut: clockOut || null,
      overtimeMinutes: hours === null ? null : Math.round(hours * 60),
      note,
    });
    setError(message);
    if (!message) onSaved(`Saved ${employeesById[employeeId]?.name}'s attendance for ${date}.`);
  };

  return (
    <form onSubmit={submit} noValidate className={cn(PANEL_CLASS, "mb-6")}>
      <h2 className="font-semibold">{editing ? `Correct attendance: ${employeesById[employeeId]?.name}, ${date}` : "Add or correct an attendance record"}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Field label="Employee" htmlFor="att-emp">
          <Select id="att-emp" value={employeeId} options={options} onChange={setEmployeeId} disabled={editing} />
        </Field>
        <Field label="Date" htmlFor="att-date" hint={!editing && existing ? "A record exists for this day. Saving replaces it." : undefined}>
          <Input id="att-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} disabled={editing} />
        </Field>
        <Field label="Shift" htmlFor="att-shift">
          <Select id="att-shift" value={shift} options={SHIFT_OPTIONS} onChange={setShift} />
        </Field>
        <Field label="Attendance" htmlFor="att-status">
          <Select id="att-status" value={status} options={ATTENDANCE_ENTRY_OPTIONS} onChange={setStatus} />
        </Field>

        {!absent && (
          <>
            <Field label="Clock in" htmlFor="att-in">
              <Input id="att-in" type="time" value={clockIn} onChange={(e) => setClockIn(e.target.value)} />
            </Field>
            <Field label="Clock out" htmlFor="att-out" hint="Leave empty while the person is still at work.">
              <Input id="att-out" type="time" value={clockOut} onChange={(e) => setClockOut(e.target.value)} />
            </Field>
            <Field label="Overtime (hours)" htmlFor="att-ot" hint="Leave empty to work it out from the times.">
              <Input id="att-ot" type="number" min={0} max={12} step={0.25} value={overtime} onChange={(e) => setOvertime(e.target.value)} className="tabular-nums" />
            </Field>
          </>
        )}
        <Field label="Note" htmlFor="att-note">
          <Input id="att-note" value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
      </div>

      {!absent && (
        <p aria-live="polite" className="mt-3 text-sm text-ink-muted">
          {worked === null ? "Paid hours and overtime appear once there is a clock out time." : `From the times: ${formatHours(worked)} paid, ${formatHours(calculatedOvertime)} overtime.`}
        </p>
      )}
      {error && <p role="alert" className="mt-3 text-sm text-danger">{error}</p>}

      <div className="mt-4 flex gap-2">
        <Button type="submit">Save attendance</Button>
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
