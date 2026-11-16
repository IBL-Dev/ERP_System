"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatTile } from "@/components/ui/StatTile";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { controlClass } from "@/components/ui/controls";
import { cn } from "@/lib/cn";
import { useHr } from "../HrProvider";
import type { Review } from "../types";
import { REVIEW_META, REVIEW_STAGES } from "../utils";
import { EmployeeLink } from "./EmployeeLink";

function ReviewAction({ review }: { review: Review }) {
  const { advanceReview } = useHr();
  const [rating, setRating] = useState("");

  if (review.stage === "self-review") {
    return <Button size="sm" variant="secondary" onClick={() => advanceReview(review.id)}>Submit self-review</Button>;
  }
  if (review.stage === "manager-review") {
    return (
      <div className="flex items-center gap-2">
        <label htmlFor={`rating-${review.id}`} className="sr-only">Rating</label>
        <select id={`rating-${review.id}`} value={rating} onChange={(e) => setRating(e.target.value)} className={cn(controlClass, "h-7 text-xs")}>
          <option value="">Rating</option>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>{n} of 5</option>
          ))}
        </select>
        <Button size="sm" disabled={!rating} onClick={() => advanceReview(review.id, Number(rating))}>Complete review</Button>
      </div>
    );
  }
  return <span className="text-sm text-ink-muted">Done</span>;
}

export function ReviewsView() {
  const { reviews } = useHr();

  const columns: Column<Review>[] = [
    { key: "emp", header: "Employee", cell: (r) => <EmployeeLink id={r.employeeId} showTitle /> },
    { key: "reviewer", header: "Reviewer", cell: (r) => <EmployeeLink id={r.reviewerId} /> },
    { key: "cycle", header: "Cycle", cell: (r) => r.cycle },
    { key: "stage", header: "Stage", cell: (r) => <StatusBadge tone={REVIEW_META[r.stage].tone}>{REVIEW_META[r.stage].label}</StatusBadge> },
    { key: "rating", header: "Rating", align: "right", cell: (r) => (r.rating ? `${r.rating} of 5` : "-") },
    { key: "action", header: "Next step", cell: (r) => <ReviewAction review={r} /> },
  ];

  return (
    <>
      <PageHeader
        title="Performance reviews"
        code="HR06"
        description="Each review moves from the employee's self-review to the manager's rating."
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        {REVIEW_STAGES.map((stage) => (
          <StatTile key={stage} label={REVIEW_META[stage].label} value={reviews.filter((r) => r.stage === stage).length} />
        ))}
      </div>

      <DataTable caption="Performance reviews" columns={columns} rows={reviews} rowKey={(r) => r.id} empty="No reviews in this cycle." />
    </>
  );
}
