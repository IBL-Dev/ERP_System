"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { BackIcon, HomeIcon, MenuIcon } from "@/components/ui/icons";
import { controlClass } from "@/components/ui/controls";
import { findByCode } from "@/config/navigation";
import { cn } from "@/lib/cn";

const iconButton =
  "grid h-8 w-8 place-items-center rounded text-ink hover:bg-hover focus-visible:outline-2 focus-visible:outline-accent";

function IconButton({ label, onClick, className, children }: { label: string; onClick: () => void; className?: string; children: ReactNode }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className={cn(iconButton, className)}>
      {children}
    </button>
  );
}

/** SAP-style command row: type a transaction code (e.g. INV01) and press Enter. */
export function CommandBar({ onToggleMenu }: { onToggleMenu: () => void }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const run = (e: FormEvent) => {
    e.preventDefault();
    const value = code.trim();
    if (!value) return;
    const node = findByCode(value);
    if (!node?.href) {
      setError(`Transaction code ${value.toUpperCase()} does not exist.`);
      return;
    }
    setError(null);
    setCode("");
    router.push(node.href);
  };

  return (
    <div className="border-b border-line bg-panel">
      <form onSubmit={run} className="flex flex-wrap items-center gap-2 px-2 py-1.5">
        <IconButton label="Show menu" onClick={onToggleMenu} className="md:hidden">
          <MenuIcon className="h-4 w-4" />
        </IconButton>
        <IconButton label="Back" onClick={() => router.back()}>
          <BackIcon className="h-4 w-4" />
        </IconButton>
        <Link href="/home" aria-label="Easy Access home" className={iconButton}>
          <HomeIcon className="h-4 w-4" />
        </Link>
        <label htmlFor="transaction-code" className="sr-only">
          Transaction code
        </label>
        <input
          id="transaction-code"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setError(null);
          }}
          placeholder="Transaction code, e.g. INV01"
          autoComplete="off"
          spellCheck={false}
          className={cn(controlClass, "h-8 w-56")}
        />
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
