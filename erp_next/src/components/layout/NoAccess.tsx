"use client";

import Link from "next/link";
import { NO_ACCESS_COPY, ROLE_LABELS, ROUTES } from "@/common/const";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { useSession } from "@/features/session/SessionProvider";

/** Shown in place of a page the signed-in role cannot open. */
export function NoAccess() {
  const { role } = useSession();
  return (
    <>
      <PageHeader title={NO_ACCESS_COPY.title} />
      <Panel>
        <p role="alert" className="text-sm">
          {NO_ACCESS_COPY.body}
        </p>
        <p className="mt-1 text-sm text-ink-muted">Signed in role: {ROLE_LABELS[role]}</p>
        <Link
          href={ROUTES.home}
          className="mt-4 inline-flex h-9 items-center rounded-md bg-accent px-5 text-sm font-semibold text-accent-fg hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {NO_ACCESS_COPY.back}
        </Link>
      </Panel>
    </>
  );
}
