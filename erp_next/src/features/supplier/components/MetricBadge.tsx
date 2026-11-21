import { StatusBadge } from "@/components/ui/StatusBadge";
import { metricTone } from "../utils";

/** A performance percentage colored against its target. */
export function MetricBadge({ value, target }: { value: number | null; target: number }) {
  return <StatusBadge tone={metricTone(value, target)}>{value === null ? "No data" : `${value}%`}</StatusBadge>;
}
