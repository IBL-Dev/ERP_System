import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type NoticeTone = "info" | "success" | "warning" | "danger";

const BORDER: Record<NoticeTone, string> = {
  info: "border-accent",
  success: "border-success",
  warning: "border-warning",
  danger: "border-danger",
};

/**
 * Inline message strip. The live region is always in the page, so a message that appears later
 * is announced by screen readers. Pass falsy children to show nothing.
 */
export function Notice({ tone = "info", children }: { tone?: NoticeTone; children?: ReactNode }) {
  return (
    <div role="status">
      {children ? (
        <p className={cn("mb-4 border-l-4 bg-panel px-3 py-2 text-sm", BORDER[tone])}>{children}</p>
      ) : null}
    </div>
  );
}
