"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Field } from "@/components/ui/Field";
import { NumberInput } from "@/components/ui/NumberInput";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatTile } from "@/components/ui/StatTile";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { controlClass } from "@/components/ui/controls";
import { formatDate } from "@/lib/date";
import { cn } from "@/lib/cn";
import { useHr } from "../HrProvider";
import type { Goal } from "../types";
import { GOAL_META, goalStatus } from "../utils";
import { EmployeeLink } from "./EmployeeLink";

export function GoalsView() {
  const { goals, employees, addGoal, setGoalProgress } = useHr();
  const [employeeId, setEmployeeId] = useState(employees[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !due) return setError("Enter a goal and a due date.");
    setError(null);
    addGoal({ employeeId, title: title.trim(), due });
    setTitle("");
    setDue("");
  };

  const done = goals.filter((g) => goalStatus(g) === "done").length;
  const overdue = goals.filter((g) => goalStatus(g) === "overdue").length;
  const average = goals.length ? Math.round(goals.reduce((t, g) => t + g.progress, 0) / goals.length) : 0;

  const columns: Column<Goal>[] = [
    { key: "emp", header: "Employee", cell: (g) => <EmployeeLink id={g.employeeId} showTitle /> },
    { key: "title", header: "Goal", cell: (g) => g.title },
    { key: "due", header: "Due", cell: (g) => formatDate(g.due) },
    {
      key: "progress",
      header: "Progress (%)",
      align: "right",
      cell: (g) => (
        <div className="flex items-center justify-end gap-3">
          <div aria-hidden className="h-2 w-24 overflow-hidden rounded-full bg-hover">
            <div className="h-full bg-accent" style={{ width: `${g.progress}%` }} />
          </div>
          <NumberInput value={g.progress} min={0} max={100} label={`Progress for ${g.title}`} onCommit={(n) => setGoalProgress(g.id, n)} className="w-20" />
        </div>
      ),
    },
    { key: "status", header: "Status", cell: (g) => <StatusBadge tone={GOAL_META[goalStatus(g)].tone}>{GOAL_META[goalStatus(g)].label}</StatusBadge> },
  ];

  return (
    <>
      <PageHeader title="Goals" code="HR05" description="Set goals for each employee and keep progress up to date." />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Goals" value={goals.length} />
        <StatTile label="Achieved" value={done} />
        <StatTile label="Overdue" value={overdue} tone={overdue ? "danger" : undefined} />
        <StatTile label="Average progress" value={`${average}%`} />
      </div>

      <form onSubmit={submit} noValidate className="mb-6 rounded-md border border-line bg-panel p-4">
        <h2 className="font-semibold">Set a goal</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-[14rem_1fr_11rem_auto] xl:items-start">
          <Field label="Employee" htmlFor="goal-emp">
            <select id="goal-emp" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className={cn(controlClass, "h-9 w-full")}>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Goal" htmlFor="goal-title" error={error}>
            <input id="goal-title" value={title} onChange={(e) => setTitle(e.target.value)} className={cn(controlClass, "h-9 w-full")} />
          </Field>
          <Field label="Due date" htmlFor="goal-due">
            <input id="goal-due" type="date" value={due} onChange={(e) => setDue(e.target.value)} className={cn(controlClass, "h-9 w-full")} />
          </Field>
          <div className="xl:pt-6">
            <Button type="submit">Add goal</Button>
          </div>
        </div>
      </form>

      <DataTable caption="Employee goals" columns={columns} rows={goals} rowKey={(g) => g.id} empty="No goals yet." />
      <p className="mt-3 text-xs text-ink-muted">Edit a progress value and press Enter or move to another field to save it.</p>
    </>
  );
}
