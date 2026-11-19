import { CONTROL_CLASS } from "@/common/const";
import type { SelectOption } from "@/common/type";
import { cn } from "@/lib/cn";

type Props<T extends string> = {
  id: string;
  value: T;
  onChange: (value: T) => void;
  options: readonly SelectOption<T>[];
  /**
   * "field": full width, the label comes from <Field>.
   * "filter": compact, auto width, with a screen-reader-only label (give it `label`).
   */
  variant?: "field" | "filter";
  label?: string;
  controlSize?: "md" | "sm";
  disabled?: boolean;
  className?: string;
};

/** Typed native select: `onChange` receives the option value, not an event. */
export function Select<T extends string>({
  id,
  value,
  onChange,
  options,
  variant = "field",
  label,
  controlSize = "md",
  disabled,
  className,
}: Props<T>) {
  const select = (
    <select
      id={id}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as T)}
      className={cn(
        CONTROL_CLASS,
        "border-field-line",
        controlSize === "md" ? "h-9" : "h-8",
        variant === "field" && "w-full",
        className,
      )}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );

  if (variant === "field") return select;
  return (
    <>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      {select}
    </>
  );
}
