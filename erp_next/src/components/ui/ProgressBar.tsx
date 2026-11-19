import type { Tone } from "@/common/type";
import { cn } from "@/lib/cn";

type BarTone = Exclude<Tone, "neutral"> | "accent";

const FILL: Record<BarTone, string> = {
  accent: "bg-accent",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
};

type Props = { value: number; label: string; tone?: BarTone; className?: string };

/** Thin progress bar with proper progressbar semantics. `value` is 0-100. */
export function ProgressBar({ value, label, tone = "accent", className }: Props) {
  const pct = Math.min(100, Math.max(0, Math.round(value)));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("h-2 overflow-hidden rounded-full bg-hover", className)}
    >
      <div className={cn("h-full", FILL[tone])} style={{ width: `${pct}%` }} />
    </div>
  );
}
