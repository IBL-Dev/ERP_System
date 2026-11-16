"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Field } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatTile } from "@/components/ui/StatTile";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { controlClass } from "@/components/ui/controls";
import { DEMO_TODAY, formatDate } from "@/lib/date";
import { cn } from "@/lib/cn";
import { useHr } from "../HrProvider";
import type { LeaveRequest, LeaveType } from "../types";
import {
  DEPARTMENT_LABEL,
  ENTITLEMENT,
  HOLIDAYS,
  LEAVE_LABEL,
  LEAVE_STATUS_META,
  approverOf,
  countWorkingDays,
  leaveDays,
} from "../utils";
import { EmployeeLink } from "./EmployeeLink";

type Filter = "all" | "needs-me" | "mine";

function DecisionCell({ request }: { request: LeaveRequest }) {
  const { employeesById, meId, decideLeave } = useHr();
  const requester = employeesById[request.employeeId];
  const approverId = requester ? approverOf(requester) : null;

  if (request.status !== "pending") {
    const by = request.decidedBy ? employeesById[request.decidedBy]?.name : null;
    return <span className="text-sm text-ink-muted">{by ? `Decided by ${by}` : "-"}</span>;
  }

  // Approval control: only the responsible department head sees the buttons.
  if (approverId === meId && request.employeeId !== meId) {
    return (
      <div className="flex gap-2">
        <Button size="sm" onClick={() => decideLeave(request.id, "approved")}>Approve</Button>
        <Button size="sm" variant="secondary" onClick={() => decideLeave(request.id, "rejected")}>Reject</Button>
      </div>
    );
  }
  return <span className="text-sm text-ink-muted">Awaiting {approverId ? employeesById[approverId]?.name : "approver"}</span>;
}

export function LeaveView() {
  const { leave, employeesById, meId, requestLeave } = useHr();
  const me = employeesById[meId];

  const [filter, setFilter] = useState<Filter>("all");
  const [type, setType] = useState<LeaveType>("annual");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [reason, setReason] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const approvedAnnual = leaveDays(meId, "annual", leave, "approved");
  const pendingAnnual = leaveDays(meId, "annual", leave, "pending");
  const approvedSick = leaveDays(meId, "sick", leave, "approved");
  const annualLeft = (ENTITLEMENT.annual ?? 0) - approvedAnnual;
  const sickLeft = (ENTITLEMENT.sick ?? 0) - approvedSick;

  const needsMe = (l: LeaveRequest) => {
    const requester = employeesById[l.employeeId];
    return l.status === "pending" && requester !== undefined && approverOf(requester) === meId && l.employeeId !== meId;
  };
  const needsMeCount = leave.filter(needsMe).length;

  const rows = useMemo(
    () => leave.filter((l) => (filter === "all" ? true : filter === "mine" ? l.employeeId === meId : needsMe(l))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [leave, filter, meId, employeesById],
  );

  // ---- request form ----
  const days = countWorkingDays(from, to);
  let formError: string | null = null;
  if (from && to && to < from) formError = "The end date must be on or after the start date.";
  else if (from && to && days === 0) formError = "That range has no working days.";
  else if (type === "annual" && days > annualLeft) formError = `Only ${annualLeft} annual leave days are left.`;
  const canSubmit = Boolean(from && to) && !formError;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    requestLeave({ type, from, to, reason: reason.trim() || "-" });
    setNotice(`Request sent for ${days} working day${days === 1 ? "" : "s"}. It is waiting for approval.`);
    setFrom("");
    setTo("");
    setReason("");
  };

  const columns: Column<LeaveRequest>[] = [
    { key: "id", header: "Request", cell: (l) => l.id },
    {
      key: "emp",
      header: "Employee",
      cell: (l) => (
        <div>
          <EmployeeLink id={l.employeeId} />
          <p className="text-xs text-ink-muted">
            {employeesById[l.employeeId] ? DEPARTMENT_LABEL[employeesById[l.employeeId].department] : ""}
          </p>
        </div>
      ),
    },
    { key: "type", header: "Type", cell: (l) => LEAVE_LABEL[l.type] },
    { key: "dates", header: "Dates", cell: (l) => (l.from === l.to ? formatDate(l.from) : `${formatDate(l.from)} to ${formatDate(l.to)}`) },
    { key: "days", header: "Working days", align: "right", cell: (l) => l.days },
    { key: "reason", header: "Reason", cell: (l) => l.reason },
    { key: "status", header: "Status", cell: (l) => <StatusBadge tone={LEAVE_STATUS_META[l.status].tone}>{LEAVE_STATUS_META[l.status].label}</StatusBadge> },
    { key: "decision", header: "Decision", cell: (l) => <DecisionCell request={l} /> },
  ];

  return (
    <>
      <PageHeader
        title="Leave and absence"
        code="HR04"
        description="Vacation and sick leave requests. Each request is approved by the responsible department head of the person asking."
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <StatTile label="Your annual leave left" value={`${annualLeft} of ${ENTITLEMENT.annual}`} hint={pendingAnnual ? `${pendingAnnual} more days pending` : "Days this year"} />
        <StatTile label="Your sick leave left" value={`${sickLeft} of ${ENTITLEMENT.sick}`} hint="Days this year" />
        <StatTile label="Waiting for your decision" value={needsMeCount} tone={needsMeCount ? "warning" : undefined} hint="From your department" />
      </div>

      <p role="status" className={cn("mb-4 border-l-4 border-accent bg-panel px-3 py-2 text-sm", !notice && "hidden")}>
        {notice}
      </p>

      <div className="grid gap-6 xl:grid-cols-[22rem_1fr] xl:items-start">
        <form onSubmit={submit} noValidate className="space-y-4 rounded-md border border-line bg-panel p-4">
          <h2 className="font-semibold">Request leave</h2>
          <p className="text-xs text-ink-muted">
            As {me?.name}. Approver: {me ? employeesById[approverOf(me)]?.name : "-"}.
          </p>
          <Field label="Type" htmlFor="leave-type">
            <select id="leave-type" value={type} onChange={(e) => setType(e.target.value as LeaveType)} className={cn(controlClass, "h-9 w-full")}>
              {(Object.keys(LEAVE_LABEL) as LeaveType[]).map((t) => (
                <option key={t} value={t}>{LEAVE_LABEL[t]}</option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="From" htmlFor="leave-from">
              <input id="leave-from" type="date" min={DEMO_TODAY} value={from} onChange={(e) => setFrom(e.target.value)} className={cn(controlClass, "h-9 w-full")} />
            </Field>
            <Field label="To" htmlFor="leave-to">
              <input id="leave-to" type="date" min={from || DEMO_TODAY} value={to} onChange={(e) => setTo(e.target.value)} className={cn(controlClass, "h-9 w-full")} />
            </Field>
          </div>
          <div aria-live="polite" className="text-sm">
            {formError ? (
              <p className="text-danger">{formError}</p>
            ) : from && to ? (
              <p>{days} working day{days === 1 ? "" : "s"}, weekends and company holidays excluded.</p>
            ) : (
              <p className="text-ink-muted">Choose the first and last day of leave.</p>
            )}
          </div>
          <Field label="Reason" htmlFor="leave-reason">
            <input id="leave-reason" value={reason} onChange={(e) => setReason(e.target.value)} className={cn(controlClass, "h-9 w-full")} />
          </Field>
          <Button type="submit" disabled={!canSubmit}>Send request</Button>
        </form>

        <section aria-labelledby="requests">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 id="requests" className="font-semibold">Leave requests</h2>
            <label htmlFor="leave-filter" className="sr-only">Show</label>
            <select id="leave-filter" value={filter} onChange={(e) => setFilter(e.target.value as Filter)} className={cn(controlClass, "h-9")}>
              <option value="all">All requests</option>
              <option value="needs-me">Waiting for my decision</option>
              <option value="mine">My requests</option>
            </select>
          </div>
          <DataTable caption="Leave requests" columns={columns} rows={rows} rowKey={(l) => l.id} empty="No leave requests for this selection." />
        </section>
      </div>

      <section aria-labelledby="holidays" className="mt-8">
        <h2 id="holidays" className="mb-3 font-semibold">Company holidays</h2>
        <DataTable
          caption="Company holidays"
          columns={[
            { key: "date", header: "Date", cell: (h: { date: string; name: string }) => formatDate(h.date) },
            { key: "name", header: "Holiday", cell: (h: { date: string; name: string }) => h.name },
          ]}
          rows={HOLIDAYS}
          rowKey={(h) => h.date}
        />
      </section>
    </>
  );
}
