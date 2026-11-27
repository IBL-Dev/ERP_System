"use client";

import { useState, type FormEvent } from "react";
import { DEMO_TODAY, PANEL_CLASS } from "@/common/const";
import type { Training } from "@/common/type";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { cn } from "@/lib/cn";
import { useHr } from "../HrProvider";

type Props = {
  /** Training to change. Leave out to add a new course. */
  training?: Training;
  onDone: () => void;
};

/** Form for adding a course, or changing one that already exists. */
export function TrainingEditor({ training, onDone }: Props) {
  const { employees, addTraining, updateTraining } = useHr();
  const editing = Boolean(training);

  const [employeeId, setEmployeeId] = useState(training?.employeeId ?? employees[0]?.id ?? "");
  const [course, setCourse] = useState(training?.course ?? "");
  const [hours, setHours] = useState(String(training?.hours ?? 4));
  const [dueDate, setDueDate] = useState(training?.dueDate ?? DEMO_TODAY);
  const [completedOn, setCompletedOn] = useState(training?.completedOn ?? "");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const h = Number(hours);
    if (!course.trim()) return setError("Enter the course name.");
    if (!Number.isFinite(h) || h <= 0) return setError("Enter the course length in hours.");
    if (!dueDate) return setError("Choose a due date.");
    setError(null);

    if (training) {
      updateTraining(training.id, { course: course.trim(), hours: h, dueDate, completedOn: completedOn || null });
    } else {
      addTraining({ employeeId, course: course.trim(), hours: h, dueDate });
    }
    onDone();
  };

  return (
    <form onSubmit={submit} noValidate className={cn(PANEL_CLASS, "mb-6")}>
      <h2 className="font-semibold">{editing ? `Update ${training?.id}` : "Add a training course"}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Field label="Employee" htmlFor="tr-emp">
          <Select id="tr-emp" value={employeeId} options={employees.map((e) => ({ value: e.id, label: e.name }))} onChange={setEmployeeId} disabled={editing} />
        </Field>
        <Field label="Course" htmlFor="tr-course" error={error}>
          <Input id="tr-course" value={course} onChange={(e) => setCourse(e.target.value)} invalid={Boolean(error)} />
        </Field>
        <Field label="Hours" htmlFor="tr-hours">
          <Input id="tr-hours" type="number" min={0.5} step={0.5} value={hours} onChange={(e) => setHours(e.target.value)} className="tabular-nums" />
        </Field>
        <Field label="Due date" htmlFor="tr-due">
          <Input id="tr-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </Field>
        {editing && (
          <Field label="Completed on" htmlFor="tr-done" hint="Leave empty if not completed.">
            <Input id="tr-done" type="date" value={completedOn} onChange={(e) => setCompletedOn(e.target.value)} />
          </Field>
        )}
      </div>
      <div className="mt-4 flex gap-2">
        <Button type="submit">{editing ? "Save changes" : "Add course"}</Button>
        <Button variant="secondary" onClick={onDone}>Cancel</Button>
      </div>
    </form>
  );
}
