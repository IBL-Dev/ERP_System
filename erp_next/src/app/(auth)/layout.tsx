import type { ReactNode } from "react";
import { Brand } from "@/components/layout/Brand";
import { TopBar } from "@/components/layout/top-bar/TopBar";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas text-ink">
      <TopBar />
      <Brand />
      <main className="flex-1 px-4 py-10 sm:py-16">{children}</main>
    </div>
  );
}
