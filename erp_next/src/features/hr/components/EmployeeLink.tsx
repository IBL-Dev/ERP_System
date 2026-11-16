"use client";

import Link from "next/link";
import { useHr } from "../HrProvider";

/** Employee name that links to the employee record. */
export function EmployeeLink({ id, showTitle = false }: { id: string; showTitle?: boolean }) {
  const { employeesById } = useHr();
  const employee = employeesById[id];
  if (!employee) return <span className="text-ink-muted">{id}</span>;
  return (
    <div>
      <Link
        href={`/hr/employees/${employee.id}`}
        className="font-medium text-accent hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {employee.name}
      </Link>
      {showTitle && <p className="text-xs text-ink-muted">{employee.jobTitle}</p>}
    </div>
  );
}
