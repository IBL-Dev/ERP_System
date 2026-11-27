"use client";

import { useState, type FormEvent } from "react";
import { GOAL_META } from "@/common/const";
import type { Goal } from "@/common/type";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { NumberInput } from "@/components/ui/NumberInput";
import { Panel } from "@/components/ui/Panel";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/date";
import { useHr } from "../HrProvider";
import { goalStatus } from "../utils";
import { CommentThread } from "./CommentThread";
import { EmployeeLink } from "./EmployeeLink";

/** One goal: progress, to-do points that drive the progress, and a comment thread. */
export function GoalCard({ goal }: { goal: Goal }) {
  const { toggleGoalTask, addGoalTask, removeGoalTask, addGoalComment, setGoalProgress } = useHr();
  const [point, setPoint] = useState("");
  const automatic = goal.tasks.length > 0;
  const done = goal.tasks.filter((t) => t.done).length;
  const status = goalStatus(goal);

  const addPoint = (e: FormEvent) => {
    e.preventDefault();
    const text = point.trim();
    if (!text) return;
    addGoalTask(goal.id, text);
    setPoint("");
  };

  return (
    <Panel className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold">{goal.title}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <EmployeeLink id={goal.employeeId} />
            <span className="text-ink-muted">Due {formatDate(goal.due)}</span>
          </div>
        </div>
        <StatusBadge meta={GOAL_META[status]} />
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between text-sm">
          <span>Progress</span>
          <span className="font-medium tabular-nums">{goal.progress}%</span>
        </div>
        <ProgressBar label={`Progress for ${goal.title}`} value={goal.progress} tone={status === "done" ? "success" : "accent"} />
        <p className="mt-1 text-xs text-ink-muted">
          {automatic ? `${done} of ${goal.tasks.length} points done. The percentage updates as you tick points.` : "No points yet. Add points to track progress automatically, or set the percentage by hand."}
        </p>
        {!automatic && (
          <div className="mt-2 flex items-center gap-2 text-sm">
            <span>Set by hand:</span>
            <NumberInput value={goal.progress} min={0} max={100} label={`Progress for ${goal.title}`} onCommit={(n) => setGoalProgress(goal.id, n)} className="w-20" />
            <span>%</span>
          </div>
        )}
      </div>

      <div>
        <h4 className="text-sm font-semibold">To-do points</h4>
        {automatic && (
          <ul className="mt-2 space-y-1">
            {goal.tasks.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-2 text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={t.done} onChange={() => toggleGoalTask(goal.id, t.id)} className="h-4 w-4 accent-[var(--accent)]" />
                  <span className={t.done ? "text-ink-muted line-through" : undefined}>{t.text}</span>
                </label>
                <button
                  type="button"
                  onClick={() => removeGoalTask(goal.id, t.id)}
                  aria-label={`Remove point: ${t.text}`}
                  className="rounded px-2 text-xs text-ink-muted hover:text-danger focus-visible:outline-2 focus-visible:outline-accent"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={addPoint} className="mt-2 flex items-center gap-2">
          <label htmlFor={`point-${goal.id}`} className="sr-only">Add a point to {goal.title}</label>
          <Input id={`point-${goal.id}`} controlSize="sm" value={point} onChange={(e) => setPoint(e.target.value)} placeholder="Add a point" />
          <Button type="submit" size="sm" variant="secondary" disabled={!point.trim()}>Add point</Button>
        </form>
      </div>

      <div>
        <h4 className="mb-2 text-sm font-semibold">Comments</h4>
        <CommentThread label={`goal ${goal.id}`} comments={goal.comments} onAdd={(text) => addGoalComment(goal.id, text)} />
      </div>
    </Panel>
  );
}
