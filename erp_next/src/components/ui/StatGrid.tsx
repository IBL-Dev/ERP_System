import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

const COLUMNS = {
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-2 xl:grid-cols-4",
  5: "sm:grid-cols-2 xl:grid-cols-5",
} as const;

/** Responsive grid for <StatTile>s. */
export function StatGrid({ columns = 4, children }: { columns?: keyof typeof COLUMNS; children: ReactNode }) {
  return <div className={cn("mb-6 grid gap-4", COLUMNS[columns])}>{children}</div>;
}
