import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  trailing?: ReactNode;
};

/** SAP-style row: label on the left, field on the right (stacked on mobile). */
export const TextField = forwardRef<HTMLInputElement, Props>(function TextField(
  { label, error, trailing, id, className, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const errorId = `${inputId}-error`;

  return (
    <div className="grid gap-1 sm:grid-cols-[7rem_1fr] sm:items-start sm:gap-4">
      <label htmlFor={inputId} className="text-sm sm:pt-2">
        {label}
      </label>
      <div>
        <div
          className={cn(
            "flex h-9 items-center rounded-md border bg-field",
            "focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-accent",
            error ? "border-danger" : "border-field-line",
          )}
        >
          <input
            ref={ref}
            id={inputId}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className={cn(
              "h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-ink outline-none",
              className,
            )}
            {...rest}
          />
          {trailing}
        </div>
        {error && (
          <p id={errorId} className="mt-1 text-xs text-danger">
            {error}
          </p>
        )}
      </div>
    </div>
  );
});
