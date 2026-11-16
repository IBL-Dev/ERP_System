import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type Tone = "success" | "warning" | "danger" | "info" | "neutral";

const DOT: Record<Tone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
  neutral: "bg-ink-muted",
};

/** Colored dot + text, so meaning never relies on color alone. */
export function StatusBadge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs">
      <span aria-hidden className={cn("h-2 w-2 rounded-full", DOT[tone])} />
      {children}
    </span>
  );
}
