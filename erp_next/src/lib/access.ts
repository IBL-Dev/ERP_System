import { SUPER_ADMIN_ONLY_PREFIXES } from "@/common/const";
import type { MenuNode, Role } from "@/common/type";

/** Lower-cases, decodes and trims the path so "/Finance/" or "/%66inance" cannot slip past a prefix. */
function normalizePath(href: string): string {
  let path = href.split(/[?#]/)[0] ?? "";
  try {
    path = decodeURIComponent(path);
  } catch {
    // keep the raw path when it is not valid percent-encoding
  }
  return path.toLowerCase().replace(/\/+$/, "") || "/";
}

/**
 * The single place that decides page access. SUPER_ADMIN opens everything;
 * ADMIN opens everything except the Super Admin-only prefixes.
 * UI demo only: the backend must enforce the same rule in a later phase.
 */
export function canAccessHref(role: Role, href: string): boolean {
  if (role === "SUPER_ADMIN") return true;
  const path = normalizePath(href);
  return !SUPER_ADMIN_ONLY_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

/** Returns the menu without pages the role cannot open; folders left empty are dropped too. */
export function filterMenu(role: Role, nodes: readonly MenuNode[]): MenuNode[] {
  return nodes.flatMap((node): MenuNode[] => {
    if (node.href && !canAccessHref(role, node.href)) return [];
    if (!node.children) return [node];
    const children = filterMenu(role, node.children);
    return children.length > 0 ? [{ ...node, children }] : [];
  });
}
