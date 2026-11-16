import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
  size?: "md" | "sm";
};

export function Button({ variant = "primary", size = "md", className, ...rest }: Props) {
  return (
    <button
      type="button"
      className={cn(
        "rounded-md font-semibold",
        size === "md" ? "h-9 px-5 text-sm" : "h-7 px-3 text-xs",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        "disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary"
          ? "bg-accent text-accent-fg hover:bg-accent-hover"
          : "border border-accent bg-transparent text-accent hover:bg-hover",
        className,
      )}
      {...rest}
    />
  );
}
