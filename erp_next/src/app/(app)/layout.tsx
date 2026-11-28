import type { ReactNode } from "react";
import { AppProviders } from "@/components/layout/app-shell/AppProviders";
import { AppShell } from "@/components/layout/app-shell/AppShell";
import { RouteGuard } from "@/components/layout/app-shell/RouteGuard";
import { SessionProvider } from "@/features/session/SessionProvider";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AppProviders>
        <AppShell>
          <RouteGuard>{children}</RouteGuard>
        </AppShell>
      </AppProviders>
    </SessionProvider>
  );
}
