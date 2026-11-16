"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { AppTopBar } from "./AppTopBar";
import { CommandBar } from "./CommandBar";
import { MenuTree } from "./MenuTree";

export function AppShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  // Close the mobile menu after navigating.
  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <div className="flex h-dvh flex-col bg-canvas text-ink">
      <AppTopBar />
      <CommandBar onToggleMenu={() => setMenuOpen((v) => !v)} />
      <div className="relative flex min-h-0 flex-1">
        <aside
          className={cn(
            "w-72 shrink-0 overflow-y-auto border-r border-line bg-panel",
            menuOpen
              ? "absolute inset-y-0 left-0 z-40 block shadow-lg md:static md:z-auto md:shadow-none"
              : "hidden md:block",
          )}
        >
          <MenuTree />
        </aside>
        <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
