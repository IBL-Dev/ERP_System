import type { Metadata } from "next";
import Link from "next/link";
import { FolderIcon } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MENU, PANEL_CLASS } from "@/common/const";
import { getSession } from "@/features/session/session";
import { cn } from "@/lib/cn";
import { firstHref } from "@/lib/navigation";

export const metadata: Metadata = { title: "Easy Access" };

export default function HomePage() {
  const session = getSession();

  return (
    <>
      <PageHeader
        title="LMS ERP Easy Access"
        description={`Signed in as ${session.userId}, ${session.responsibility}. Pick a department, or type a transaction code such as INV01 in the command field.`}
      />
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {MENU.map((node) => {
          const href = firstHref(node);
          const mine = node.id === session.department;
          const body = (
            <>
              <div className="flex items-center gap-2">
                <FolderIcon className="h-5 w-5 text-warning" />
                <h2 className="font-semibold">{node.label}</h2>
              </div>
              <p className="mt-2 text-sm text-ink-muted">{node.description}</p>
              <div className="mt-3">
                {node.comingSoon ? (
                  <StatusBadge>Coming soon</StatusBadge>
                ) : (
                  <StatusBadge tone="success">{mine ? "Your department" : "Available"}</StatusBadge>
                )}
              </div>
            </>
          );
          return (
            <li key={node.id}>
              {href ? (
                <Link
                  href={href}
                  className={cn(PANEL_CLASS, "block hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent")}
                >
                  {body}
                </Link>
              ) : (
                <div className={cn(PANEL_CLASS, "border-dashed")}>{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
