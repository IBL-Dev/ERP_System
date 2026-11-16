"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { THEMES, useTheme } from "@/features/theme";
import { cn } from "@/lib/cn";

export function SystemMenu() {
  const [open, setOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const getItems = () =>
    Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitemradio"]') ?? [],
    );

  // Close when clicking outside.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // Move focus to the active theme when the menu opens.
  useEffect(() => {
    if (!open) return;
    const items = getItems();
    const active = items.find((el) => el.getAttribute("aria-checked") === "true");
    (active ?? items[0])?.focus();
  }, [open]);

  const closeAndReturnFocus = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  const onMenuKeyDown = (e: KeyboardEvent) => {
    const items = getItems();
    const index = items.indexOf(document.activeElement as HTMLElement);
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        items[(index + 1) % items.length]?.focus();
        break;
      case "ArrowUp":
        e.preventDefault();
        items[(index - 1 + items.length) % items.length]?.focus();
        break;
      case "Home":
        e.preventDefault();
        items[0]?.focus();
        break;
      case "End":
        e.preventDefault();
        items[items.length - 1]?.focus();
        break;
      case "Escape":
        e.preventDefault();
        closeAndReturnFocus();
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className={cn(
          "h-7 rounded px-3 text-sm hover:bg-shell-hover",
          "focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent",
          open && "bg-shell-hover",
        )}
      >
        System
      </button>

      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label="System"
          onKeyDown={onMenuKeyDown}
          className="absolute left-0 top-full z-50 mt-1 w-72 rounded-md border border-line bg-panel py-1 text-ink shadow-lg"
        >
          <p className="px-3 py-2 text-xs font-semibold text-ink-muted" role="presentation">
            Change theme colors
          </p>
          {THEMES.map((t) => {
            const checked = t.id === theme;
            return (
              <button
                key={t.id}
                type="button"
                role="menuitemradio"
                aria-checked={checked}
                tabIndex={-1}
                onClick={() => {
                  setTheme(t.id);
                  closeAndReturnFocus();
                }}
                className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-canvas focus-visible:bg-canvas focus-visible:outline-none"
              >
                <span aria-hidden className="flex overflow-hidden rounded-sm border border-line">
                  {t.swatch.map((color) => (
                    <span key={color} className="h-4 w-4" style={{ backgroundColor: color }} />
                  ))}
                </span>
                <span className="flex-1">{t.label}</span>
                {checked && (
                  <svg aria-hidden viewBox="0 0 16 16" className="h-4 w-4 text-accent" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 8.5l3.2 3L13 4.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
