"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { controlClass } from "./controls";

type Props = {
  value: number;
  label: string;
  onCommit: (n: number) => void;
  min?: number;
  max?: number;
  className?: string;
};

/** Whole-number input that saves on blur or Enter, and reverts if the value is out of range. */
export function NumberInput({ value, label, onCommit, min = 0, max, className }: Props) {
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);

  const commit = () => {
    const n = Number(text);
    const valid = text.trim() !== "" && Number.isInteger(n) && n >= min && (max === undefined || n <= max);
    if (valid) onCommit(n);
    else setText(String(value));
  };

  return (
    <input
      type="number"
      inputMode="numeric"
      min={min}
      max={max}
      step={1}
      aria-label={label}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
      className={cn(controlClass, "h-8 w-24 text-right tabular-nums", className)}
    />
  );
}
