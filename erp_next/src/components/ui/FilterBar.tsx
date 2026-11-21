import type { ReactNode } from "react";

/** Row that holds search boxes, selects and toggles above a table. */
export function FilterBar({ children }: { children: ReactNode }) {
  return <div className="mb-4 flex flex-wrap items-center gap-3">{children}</div>;
}
