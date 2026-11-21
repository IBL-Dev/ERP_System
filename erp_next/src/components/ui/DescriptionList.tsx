import type { ReactNode } from "react";

/** Label / value pairs, e.g. personal details on an employee record. */
export function DescriptionList({ items }: { items: readonly (readonly [label: string, value: ReactNode])[] }) {
  return (
    <dl className="grid grid-cols-[9rem_1fr] gap-x-3 gap-y-2 text-sm">
      {items.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-ink-muted">{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
