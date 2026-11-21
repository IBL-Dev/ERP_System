import { forwardRef, type InputHTMLAttributes } from "react";
import { CONTROL_CLASS } from "@/common/const";
import { cn } from "@/lib/cn";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  /** Control height: md = h-9, sm = h-8. */
  controlSize?: "md" | "sm";
  /** Stretch to the width of the parent (default). Turn off for compact inputs and set a width in className. */
  fullWidth?: boolean;
  invalid?: boolean;
};

/** The one text input used across the app. Pair with <Field> for a label and error message. */
export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { controlSize = "md", fullWidth = true, invalid, className, ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        CONTROL_CLASS,
        controlSize === "md" ? "h-9" : "h-8",
        fullWidth && "w-full",
        invalid ? "border-danger" : "border-field-line",
        className,
      )}
      {...rest}
    />
  );
});
