"use client";

import { useState, type FormEvent } from "react";
import { PANEL_CLASS } from "@/common/const";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { FilterBar } from "@/components/ui/FilterBar";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Select } from "@/components/ui/Select";
import { StatGrid } from "@/components/ui/StatGrid";
import { StatTile } from "@/components/ui/StatTile";
import { cn } from "@/lib/cn";
import { useHr } from "../HrProvider";
import { goalStatus } from "../utils";
import { GoalCard } from "./GoalCard";

export function GoalsView() {
  const { goals, employees, addGoal } = useHr();
  const [who, setWho] = useState("all");
  const [adding, setAdding] = useState(false);

  const [employeeId, setEmployeeId] = useState(employees[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [points, setPoints] = useState<string[]>([]);
  const [point, setPoint] = useState("");
  const [error, setError] = useState<string | null>(null);

  const employeeOptions = employees.map((e) => ({ value: e.id, label: e.name }));
  const filterOptions = [{ value: "all", label: "All employees" }, ...employeeOptions];
  const shown = goals.filter((g) => who === "all" || g.employeeId === who);

  const addPointToDraft = () => {
    const text = point.trim();
    if (!text) return;
    setPoints((prev) => [...prev, text]);
    setPoint("");
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !due) return setError("Enter a goal and a due date.");
    setError(null);
    // A point typed but not yet added still counts.
    const all = point.trim() ? [...points, point.trim()] : points;
    addGoal({ employeeId, title: title.trim(), due, tasks: all });
    setTitle("");
    setDue("");
    setPoints([]);
    setPoint("");
    setAdding(false);
  };

  const done = goals.filter((g) => goalStatus(g) === "done").length;
  const overdue = goals.filter((g) => goalStatus(g) === "overdue").length;
  const average = goals.length ? Math.round(goals.reduce((t, g) => t + g.progress, 0) / goals.length) : 0;

  return (
    <>
      <PageHeader
        title="Goals"
        code="HR05"
        description="Break each goal into points. Tick the points as they are done and the progress bar updates by itself. Add comments to keep a record of feedback."
        actions={!adding && <Button onClick={() => setAdding(true)}>Set a goal</Button>}
      />

      <StatGrid>
        <StatTile label="Goals" value={goals.length} />
        <StatTile label="Achieved" value={done} />
        <StatTile label="Overdue" value={overdue} tone={overdue ? "danger" : undefined} />
        <StatTile label="Average progress" value={`${average}%`} />
      </StatGrid>

      {adding && (
        <form onSubmit={submit} noValidate className={cn(PANEL_CLASS, "mb-6")}>
          <h2 className="font-semibold">Set a goal</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-[14rem_1fr_11rem]">
            <Field label="Employee" htmlFor="goal-emp">
              <Select id="goal-emp" value={employeeId} options={employeeOptions} onChange={setEmployeeId} />
            </Field>
            <Field label="Goal" htmlFor="goal-title" error={error}>
              <Input id="goal-title" value={title} onChange={(e) => setTitle(e.target.value)} invalid={Boolean(error)} />
            </Field>
            <Field label="Due date" htmlFor="goal-due">
              <Input id="goal-due" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
            </Field>
          </div>

          <div className="mt-4">
            <h3 className="text-sm font-semibold">To-do points</h3>
            <p className="text-xs text-ink-muted">Optional. With points, progress is worked out from how many are done.</p>
            {points.length > 0 && (
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
                {points.map((p, i) => (
                  <li key={`${p}-${i}`}>
                    <span className="mr-3">{p}</span>
                    <button
                      type="button"
                      onClick={() => setPoints((prev) => prev.filter((_, idx) => idx !== i))}
                      aria-label={`Remove point: ${p}`}
                      className="text-xs text-ink-muted hover:text-danger focus-visible:outline-2 focus-visible:outline-accent"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ol>
            )}
            <div className="mt-2 flex max-w-xl items-center gap-2">
              <label htmlFor="goal-point" className="sr-only">New point</label>
              <Input
                id="goal-point"
                controlSize="sm"
                value={point}
                onChange={(e) => setPoint(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addPointToDraft();
                  }
                }}
                placeholder="Type a point and press Enter"
              />
              <Button size="sm" variant="secondary" onClick={addPointToDraft} disabled={!point.trim()}>Add point</Button>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <Button type="submit">Save goal</Button>
            <Button variant="secondary" onClick={() => setAdding(false)}>Cancel</Button>
          </div>
        </form>
      )}

      <FilterBar>
        <Select variant="filter" id="goal-filter" label="Employee" value={who} onChange={setWho} options={filterOptions} />
      </FilterBar>

      {shown.length === 0 ? (
        <p className="text-sm text-ink-muted">No goals for this selection.</p>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {shown.map((g) => (
            <GoalCard key={g.id} goal={g} />
          ))}
        </div>
      )}
    </>
  );
}
