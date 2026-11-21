"use client";

import { useState } from "react";
import { RATING_OPTIONS, REVIEW_META, REVIEW_STAGES } from "@/common/const";
import type { Column, Review } from "@/common/type";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { Select } from "@/components/ui/Select";
import { StatGrid } from "@/components/ui/StatGrid";
import { StatTile } from "@/components/ui/StatTile";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useHr } from "../HrProvider";
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
        <Select variant="filter" controlSize="sm" id={`rating-${review.id}`} label="Rating" value={rating} onChange={setRating} options={RATING_OPTIONS} />
        <Button size="sm" disabled={!rating} onClick={() => advanceReview(review.id, Number(rating))}>Complete review</Button>
      </div>
    );
  }
  return <span className="text-sm text-ink-muted">Done</span>;
}

const columns: Column<Review>[] = [
  { key: "emp", header: "Employee", cell: (r) => <EmployeeLink id={r.employeeId} showTitle /> },
  { key: "reviewer", header: "Reviewer", cell: (r) => <EmployeeLink id={r.reviewerId} /> },
  { key: "cycle", header: "Cycle", cell: (r) => r.cycle },
  { key: "stage", header: "Stage", cell: (r) => <StatusBadge meta={REVIEW_META[r.stage]} /> },
  { key: "rating", header: "Rating", align: "right", cell: (r) => (r.rating ? `${r.rating} of 5` : "-") },
  { key: "action", header: "Next step", cell: (r) => <ReviewAction review={r} /> },
];

export function ReviewsView() {
  const { reviews } = useHr();

  return (
    <>
      <PageHeader title="Performance reviews" code="HR06" description="Each review moves from the employee's self-review to the manager's rating." />

      <StatGrid columns={3}>
        {REVIEW_STAGES.map((stage) => (
          <StatTile key={stage} label={REVIEW_META[stage].label} value={reviews.filter((r) => r.stage === stage).length} />
        ))}
      </StatGrid>

      <DataTable caption="Performance reviews" columns={columns} rows={reviews} rowKey={(r) => r.id} empty="No reviews in this cycle." />
    </>
  );
}
