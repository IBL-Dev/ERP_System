import Link from "next/link";
import { SystemMenu } from "@/components/layout/top-bar/SystemMenu";
import { getSession } from "@/features/session/session";

export function AppTopBar() {
  const session = getSession();

  return (
    <header className="border-b border-line bg-shell text-shell-fg">
      <div className="flex h-9 items-center gap-1 px-2">
        <SystemMenu />
        <div className="ml-auto flex items-center gap-1 text-sm">
          <span className="hidden px-2 sm:inline">
            {session.userId} · {session.responsibility}
          </span>
          <Link
            href="/login"
            className="flex h-7 items-center rounded px-3 hover:bg-shell-hover focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
          >
            Log off
          </Link>
        </div>
      </div>
    </header>
  );
}
