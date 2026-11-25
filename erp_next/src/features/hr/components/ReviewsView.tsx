"use client";

import { useState } from "react";
import { RATING_OPTIONS, REVIEW_META, REVIEW_STAGES } from "@/common/const";
import type { Review } from "@/common/type";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { Select } from "@/components/ui/Select";
import { StatGrid } from "@/components/ui/StatGrid";
import { StatTile } from "@/components/ui/StatTile";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useHr } from "../HrProvider";
import { CommentThread } from "./CommentThread";
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
  return <span className="text-sm text-ink-muted">Review complete</span>;
}

function ReviewCard({ review }: { review: Review }) {
  const { addReviewComment } = useHr();
  return (
    <Panel className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <EmployeeLink id={review.employeeId} showTitle />
          <p className="mt-1 text-xs text-ink-muted">
            {review.cycle}. Reviewer: <EmployeeLinkInline id={review.reviewerId} />
          </p>
        </div>
        <div className="text-right">
          <StatusBadge meta={REVIEW_META[review.stage]} />
          {review.rating !== null && <p className="mt-1 text-sm font-medium">{review.rating} of 5</p>}
        </div>
      </div>

      <ReviewAction review={review} />

      <div>
        <h4 className="mb-2 text-sm font-semibold">Comments</h4>
        <CommentThread
          label={`review ${review.id}`}
          comments={review.comments}
          onAdd={(text) => addReviewComment(review.id, text)}
          placeholder="Write a comment on this review"
        />
      </div>
    </Panel>
  );
}

function EmployeeLinkInline({ id }: { id: string }) {
  const { employeesById } = useHr();
  return <>{employeesById[id]?.name ?? id}</>;
}

export function ReviewsView() {
  const { reviews } = useHr();

  return (
    <>
      <PageHeader
        title="Performance reviews"
        code="HR06"
        description="Each review moves from the employee's self-review to the manager's rating. Add comments at any stage to record feedback."
      />

      <StatGrid columns={3}>
        {REVIEW_STAGES.map((stage) => (
          <StatTile key={stage} label={REVIEW_META[stage].label} value={reviews.filter((r) => r.stage === stage).length} />
        ))}
      </StatGrid>

      {reviews.length === 0 ? (
        <p className="text-sm text-ink-muted">No reviews in this cycle.</p>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {reviews.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </div>
      )}
    </>
  );
}
