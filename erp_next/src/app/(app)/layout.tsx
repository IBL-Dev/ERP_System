import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell/AppShell";
import { InventoryProvider } from "@/features/inventory/InventoryProvider";

/** Inventory state lives here (not in /inventory) so Sales can read live stock and hand orders off to it. */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <InventoryProvider>
      <AppShell>{children}</AppShell>
    </InventoryProvider>
  );
}
