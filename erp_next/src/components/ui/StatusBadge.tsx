import type { ReactNode } from "react";
import type { Tone, ToneMeta } from "@/common/type";
import { cn } from "@/lib/cn";

const DOT: Record<Tone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
  neutral: "bg-ink-muted",
};

type Props = {
  /** Shortcut for the *_META lookups: <StatusBadge meta={LEVEL_META[level]} />. */
  meta?: ToneMeta;
  tone?: Tone;
  children?: ReactNode;
};

/** Colored dot + text, so meaning never relies on color alone. */
export function StatusBadge({ meta, tone = "neutral", children }: Props) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs">
      <span aria-hidden className={cn("h-2 w-2 rounded-full", DOT[meta?.tone ?? tone])} />
      {children ?? meta?.label}
    </span>
  );
}
