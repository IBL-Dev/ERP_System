"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatTile } from "@/components/ui/StatTile";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { controlClass } from "@/components/ui/controls";
import { formatDate } from "@/lib/date";
import { cn } from "@/lib/cn";
import { useHr } from "../HrProvider";
import type { Training } from "../types";
import { TRAINING_META, trainingStatus, type TrainingStatus } from "../utils";
import { EmployeeLink } from "./EmployeeLink";

export function TrainingView() {
  const { training, completeTraining } = useHr();
  const [filter, setFilter] = useState<TrainingStatus | "all">("all");

  const rows = useMemo(() => training.filter((t) => filter === "all" || trainingStatus(t) === filter), [training, filter]);

  const completed = training.filter((t) => t.completedOn).length;
  const overdue = training.filter((t) => trainingStatus(t) === "overdue").length;
  const hours = training.filter((t) => t.completedOn).reduce((total, t) => total + t.hours, 0);
  const rate = training.length ? Math.round((completed / training.length) * 100) : 0;

  const columns: Column<Training>[] = [
    { key: "emp", header: "Employee", cell: (t) => <EmployeeLink id={t.employeeId} showTitle /> },
    { key: "course", header: "Course", cell: (t) => t.course },
    { key: "hours", header: "Hours", align: "right", cell: (t) => t.hours },
    { key: "due", header: "Due", cell: (t) => formatDate(t.dueDate) },
    { key: "done", header: "Completed", cell: (t) => (t.completedOn ? formatDate(t.completedOn) : "-") },
    { key: "status", header: "Status", cell: (t) => <StatusBadge tone={TRAINING_META[trainingStatus(t)].tone}>{TRAINING_META[trainingStatus(t)].label}</StatusBadge> },
    {
      key: "action",
      header: "Action",
      cell: (t) =>
        t.completedOn ? (
          <span className="text-sm text-ink-muted">Done</span>
        ) : (
          <Button size="sm" variant="secondary" onClick={() => completeTraining(t.id)}>Mark complete</Button>
        ),
    },
  ];

  return (
    <>
      <PageHeader title="Training" code="HR07" description="Courses assigned to employees, with due dates and completion." />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Completion rate" value={`${rate}%`} hint={`${completed} of ${training.length} courses`} />
        <StatTile label="Overdue" value={overdue} tone={overdue ? "danger" : undefined} />
        <StatTile label="Training hours done" value={hours} />
        <StatTile label="Courses assigned" value={training.length} />
      </div>

      <div className="mb-4">
        <label htmlFor="train-filter" className="sr-only">Status</label>
        <select id="train-filter" value={filter} onChange={(e) => setFilter(e.target.value as TrainingStatus | "all")} className={cn(controlClass, "h-9")}>
          <option value="all">All courses</option>
          <option value="scheduled">Scheduled</option>
          <option value="overdue">Overdue</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <DataTable caption="Training tracking" columns={columns} rows={rows} rowKey={(t) => t.id} empty="No courses for this selection." />
    </>
  );
}
