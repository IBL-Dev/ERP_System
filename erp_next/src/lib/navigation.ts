import { MENU } from "@/common/const";
import type { MenuNode } from "@/common/type";

export function flattenMenu(nodes: readonly MenuNode[] = MENU): MenuNode[] {
  return nodes.flatMap((n) => [n, ...(n.children ? flattenMenu(n.children) : [])]);
}

export function findByCode(code: string): MenuNode | undefined {
  const wanted = code.trim().toUpperCase();
  return flattenMenu().find((n) => n.code === wanted && n.href);
}

export function firstHref(node: MenuNode): string | undefined {
  if (node.href) return node.href;
  for (const child of node.children ?? []) {
    const href = firstHref(child);
    if (href) return href;
  }
  return undefined;
}

/** Ids of the folders above the node that owns `href`, or null if no node does. */
export function ancestorIds(href: string, nodes: readonly MenuNode[] = MENU, trail: string[] = []): string[] | null {
  for (const node of nodes) {
    if (node.href === href) return trail;
    if (node.children) {
      const found = ancestorIds(href, node.children, [...trail, node.id]);
      if (found) return found;
    }
  }
  return null;
}
