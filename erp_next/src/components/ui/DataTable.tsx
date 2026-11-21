import type { Column } from "@/common/type";
import { cn } from "@/lib/cn";

type Props<T> = {
  caption: string;
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  empty?: string;
};

export function DataTable<T>({ caption, columns, rows, rowKey, empty = "No entries found." }: Props<T>) {
  return (
    <div className="overflow-x-auto rounded-md border border-line bg-panel">
      <table className="w-full min-w-max border-collapse text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="bg-hover text-left">
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                className={cn(
                  "whitespace-nowrap border-b border-line px-3 py-2 font-semibold",
                  c.align === "right" && "text-right",
                )}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-3 py-6 text-center text-ink-muted">
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={rowKey(row)} className="border-b border-line last:border-b-0 hover:bg-hover">
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={cn("px-3 py-2 align-middle", c.align === "right" && "text-right tabular-nums")}
                  >
                    {c.cell(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
