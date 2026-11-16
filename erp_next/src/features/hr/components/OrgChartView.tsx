"use client";

import { useMemo } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { useHr } from "../HrProvider";
import type { Employee } from "../types";
import { DEPARTMENT_LABEL } from "../utils";
import { EmployeeLink } from "./EmployeeLink";

type ByManager = Record<string, Employee[]>;

function OrgNode({ employee, byManager }: { employee: Employee; byManager: ByManager }) {
  const reports = byManager[employee.id] ?? [];
  return (
    <li>
      <div className="inline-block min-w-56 rounded-md border border-line bg-panel px-3 py-2">
        <EmployeeLink id={employee.id} />
        <p className="text-xs text-ink-muted">
          {employee.jobTitle} · {DEPARTMENT_LABEL[employee.department]}
        </p>
      </div>
      {reports.length > 0 && (
        <ul className="ml-4 mt-2 space-y-2 border-l border-line pl-4">
          {reports.map((r) => (
            <OrgNode key={r.id} employee={r} byManager={byManager} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function OrgChartView() {
  const { employees } = useHr();

  const { roots, byManager } = useMemo(() => {
    const map: ByManager = {};
    for (const e of employees) if (e.managerId) (map[e.managerId] ??= []).push(e);
    return { roots: employees.filter((e) => !e.managerId), byManager: map };
  }, [employees]);

  return (
    <>
      <PageHeader title="Organization chart" code="HR02" description="Who reports to whom. Select a name to open the employee record." />
      <ul className="space-y-2">
        {roots.map((r) => (
          <OrgNode key={r.id} employee={r} byManager={byManager} />
        ))}
      </ul>
    </>
  );
}
