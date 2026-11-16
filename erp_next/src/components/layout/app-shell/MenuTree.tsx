"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronIcon, DocIcon, FolderIcon } from "@/components/ui/icons";
import { MENU, ancestorIds, flattenMenu, type MenuNode } from "@/config/navigation";
import { getSession } from "@/features/session/session";
import { cn } from "@/lib/cn";

// Demo favorites. TODO: store per user once there is a backend.
const FAVORITE_IDS = ["inv-stock", "inv-reorder"];

const ROOT_IDS = ["favorites", "root"];

const row =
  "flex w-full items-center gap-1.5 py-1.5 pr-2 text-left text-sm hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent";

type BranchProps = {
  node: MenuNode;
  depth: number;
  open: Set<string>;
  toggle: (id: string) => void;
  pathname: string;
};

function Branch({ node, depth, open, toggle, pathname }: BranchProps) {
  const indent = { paddingLeft: depth * 14 + 8 };
  const isFolder = Boolean(node.children) || Boolean(node.comingSoon);

  if (!isFolder) {
    const active = node.href === pathname;
    return (
      <li>
        <Link
          href={node.href ?? "/home"}
          aria-current={active ? "page" : undefined}
          style={indent}
          className={cn(row, active && "bg-hover font-semibold shadow-[inset_3px_0_0_var(--accent)]")}
        >
          <span className="w-3 shrink-0" />
          <DocIcon className="h-4 w-4 shrink-0 text-ink-muted" />
          <span className="truncate">{node.label}</span>
          {node.code && <span className="ml-auto pl-2 text-xs text-ink-muted">{node.code}</span>}
        </Link>
      </li>
    );
  }

  const isOpen = open.has(node.id);
  return (
    <li>
      <button type="button" aria-expanded={isOpen} onClick={() => toggle(node.id)} style={indent} className={row}>
        <ChevronIcon className={cn("h-3 w-3 shrink-0", isOpen && "rotate-90")} />
        <FolderIcon className="h-4 w-4 shrink-0 text-warning" />
        <span className="truncate">{node.label}</span>
      </button>
      {isOpen && (
        <ul>
          {node.children ? (
            node.children.map((child) => (
              <Branch key={child.id} node={child} depth={depth + 1} open={open} toggle={toggle} pathname={pathname} />
            ))
          ) : (
            <li style={{ paddingLeft: (depth + 1) * 14 + 8 }} className="py-1.5 pr-2 text-sm text-ink-muted">
              <span className="ml-[1.1rem]">Coming soon</span>
            </li>
          )}
        </ul>
      )}
    </li>
  );
}

export function MenuTree() {
  const pathname = usePathname();
  const { department } = getSession();

  const [open, setOpen] = useState<Set<string>>(
    () => new Set([...ROOT_IDS, department, ...(ancestorIds(pathname) ?? [])]),
  );

  // Keep the path to the current screen expanded (e.g. after typing a transaction code).
  useEffect(() => {
    const trail = ancestorIds(pathname);
    if (!trail?.length) return;
    setOpen((prev) => (trail.every((id) => prev.has(id)) ? prev : new Set([...prev, ...trail])));
  }, [pathname]);

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const all = flattenMenu();
  const favorites: MenuNode = {
    id: "favorites",
    label: "Favorites",
    children: FAVORITE_IDS.map((id) => all.find((n) => n.id === id)).filter((n): n is MenuNode => Boolean(n)),
  };
  const root: MenuNode = { id: "root", label: "LMS menu", children: MENU };

  return (
    <nav aria-label="Main menu" className="py-2">
      <ul>
        {[favorites, root].map((node) => (
          <Branch key={node.id} node={node} depth={0} open={open} toggle={toggle} pathname={pathname} />
        ))}
      </ul>
    </nav>
  );
}
