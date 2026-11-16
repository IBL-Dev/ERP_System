"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Top-left shortcut: switches between the user and admin log on pages. */
export function AuthSwitchLink() {
  const isAdmin = usePathname().startsWith("/admin");

  return (
    <Link
      href={isAdmin ? "/login" : "/admin/login"}
      className="flex h-7 items-center rounded px-3 text-sm hover:bg-shell-hover focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
    >
      {isAdmin ? "User login" : "Admin login"}
    </Link>
  );
}
