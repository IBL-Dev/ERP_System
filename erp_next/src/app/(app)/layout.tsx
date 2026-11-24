import type { ReactNode } from "react";
import { AppProviders } from "@/components/layout/app-shell/AppProviders";
import { AppShell } from "@/components/layout/app-shell/AppShell";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AppProviders>
      <AppShell>{children}</AppShell>
    </AppProviders>
  );
}
