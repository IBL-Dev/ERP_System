"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { NoAccess } from "@/components/layout/NoAccess";
import { useSession } from "@/features/session/SessionProvider";
import { canAccessHref } from "@/lib/access";

/**
 * One guard for every page under /(app). UI demo only: it hides pages, it does not secure data.
 * The backend must enforce the same rule once it exists.
 */
export function RouteGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { role } = useSession();
  if (!canAccessHref(role, pathname)) return <NoAccess />;
  return <>{children}</>;
}
