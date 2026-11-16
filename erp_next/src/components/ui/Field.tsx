import type { ReactNode } from "react";

type Props = {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string | null;
  children: ReactNode;
};

/** Stacked label + control, for forms that don't use the SAP-style row layout. */
export function Field({ label, htmlFor, hint, error, children }: Props) {
  return (
    <div className="space-y-1">
      <label htmlFor={htmlFor} className="block text-sm font-medium">
        {label}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-ink-muted">{hint}</p>
      )}
    </div>
  );
}
