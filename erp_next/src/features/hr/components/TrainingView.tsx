"use client";

import { useMemo, useState } from "react";
import { TRAINING_FILTERS, TRAINING_META } from "@/common/const";
import type { Column, Training, TrainingFilter } from "@/common/type";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { FilterBar } from "@/components/ui/FilterBar";
import { PageHeader } from "@/components/ui/PageHeader";
import { Select } from "@/components/ui/Select";
import { StatGrid } from "@/components/ui/StatGrid";
import { StatTile } from "@/components/ui/StatTile";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/date";
import { useHr } from "../HrProvider";
import { trainingStatus } from "../utils";
import { EmployeeLink } from "./EmployeeLink";
import { TrainingEditor } from "./TrainingEditor";

export function TrainingView() {
  const { training, completeTraining } = useHr();
  const [filter, setFilter] = useState<TrainingFilter>("all");
  // "new" opens the add form; a course id opens the editor for that course.
  const [editor, setEditor] = useState<"new" | string | null>(null);

  const rows = useMemo(() => training.filter((t) => filter === "all" || trainingStatus(t) === filter), [training, filter]);

  const completed = training.filter((t) => t.completedOn).length;
  const overdue = training.filter((t) => trainingStatus(t) === "overdue").length;
  const hours = training.filter((t) => t.completedOn).reduce((total, t) => total + t.hours, 0);
  const rate = training.length ? Math.round((completed / training.length) * 100) : 0;
  const editing = editor && editor !== "new" ? training.find((t) => t.id === editor) : undefined;

  const columns: Column<Training>[] = [
    { key: "emp", header: "Employee", cell: (t) => <EmployeeLink id={t.employeeId} showTitle /> },
    { key: "course", header: "Course", cell: (t) => t.course },
    { key: "hours", header: "Hours", align: "right", cell: (t) => t.hours },
    { key: "due", header: "Due", cell: (t) => formatDate(t.dueDate) },
    { key: "done", header: "Completed", cell: (t) => (t.completedOn ? formatDate(t.completedOn) : "-") },
    { key: "status", header: "Status", cell: (t) => <StatusBadge meta={TRAINING_META[trainingStatus(t)]} /> },
    {
      key: "action",
      header: "Action",
      cell: (t) => (
        <div className="flex gap-2">
          {!t.completedOn && <Button size="sm" variant="secondary" onClick={() => completeTraining(t.id)}>Mark complete</Button>}
          <Button size="sm" variant="secondary" onClick={() => setEditor(t.id)}>Edit</Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Training"
        code="HR07"
        description="Courses assigned to employees, with due dates and completion. Add a course, or edit an existing one."
        actions={editor === null && <Button onClick={() => setEditor("new")}>Add training</Button>}
      />

      <StatGrid>
        <StatTile label="Completion rate" value={`${rate}%`} hint={`${completed} of ${training.length} courses`} />
        <StatTile label="Overdue" value={overdue} tone={overdue ? "danger" : undefined} />
        <StatTile label="Training hours done" value={hours} />
        <StatTile label="Courses assigned" value={training.length} />
      </StatGrid>

      {editor === "new" && <TrainingEditor onDone={() => setEditor(null)} />}
      {editing && <TrainingEditor key={editing.id} training={editing} onDone={() => setEditor(null)} />}

      <FilterBar>
        <Select variant="filter" id="train-filter" label="Status" value={filter} onChange={setFilter} options={TRAINING_FILTERS} />
      </FilterBar>

      <DataTable caption="Training tracking" columns={columns} rows={rows} rowKey={(t) => t.id} empty="No courses for this selection." />
    </>
  );
}
