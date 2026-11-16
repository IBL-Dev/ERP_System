import { inventoryMenu } from "@/features/inventory/menu";

export type DepartmentId = "inventory" | "finance" | "hr" | "supplier" | "sales";

export type MenuNode = {
  id: string;
  label: string;
  description?: string;
  /** Transaction code typed into the command field, e.g. INV01. */
  code?: string;
  href?: string;
  children?: MenuNode[];
  comingSoon?: boolean;
};

/** Main menu. Each department registers its own subtree from its feature folder. */
export const MENU: MenuNode[] = [
  inventoryMenu,
  { id: "finance", label: "Finance department", description: "Accounting, payments and reporting.", comingSoon: true },
  { id: "hr", label: "HR department", description: "Employees, attendance and payroll.", comingSoon: true },
  { id: "supplier", label: "Supplier department", description: "Suppliers, purchase orders and deliveries.", comingSoon: true },
  { id: "sales", label: "Sales department", description: "Customers, orders and invoicing.", comingSoon: true },
];

export function flattenMenu(nodes: MenuNode[] = MENU): MenuNode[] {
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
export function ancestorIds(href: string, nodes: MenuNode[] = MENU, trail: string[] = []): string[] | null {
  for (const node of nodes) {
    if (node.href === href) return trail;
    if (node.children) {
      const found = ancestorIds(href, node.children, [...trail, node.id]);
      if (found) return found;
    }
  }
  return null;
}
