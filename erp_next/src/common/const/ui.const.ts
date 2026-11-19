/**
 * Shared look for native inputs and selects. Components add the height, width and border color
 * (border-field-line, or border-danger when invalid), so these classes never fight each other.
 */
export const CONTROL_CLASS =
  "rounded-md border bg-field px-3 text-sm text-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent";

/** Card surface used by <Panel> and by forms that act as panels. */
export const PANEL_CLASS = "rounded-md border border-line bg-panel p-4";
