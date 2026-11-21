import type { ReactNode } from "react";

export type Tone = "success" | "warning" | "danger" | "info" | "neutral";

/** Label + color pair used by every status badge. */
export type ToneMeta = { label: string; tone: Tone };

export type SelectOption<T extends string = string> = { value: T; label: string };

/** One column of <DataTable>. */
export type Column<T> = {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  align?: "left" | "right";
};
