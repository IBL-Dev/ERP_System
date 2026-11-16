import type { MenuNode } from "@/config/navigation";

export const inventoryMenu: MenuNode = {
  id: "inventory",
  label: "Inventory department",
  description: "Stock levels, item lifecycle, stock movement and reordering.",
  children: [
    { id: "inv-overview", label: "Inventory overview", code: "INV00", href: "/inventory" },
    { id: "inv-stock", label: "Stock levels", code: "INV01", href: "/inventory/stock" },
    { id: "inv-lifecycle", label: "Item lifecycle", code: "INV02", href: "/inventory/lifecycle" },
    {
      id: "inv-movement",
      label: "Stock movement",
      children: [
        { id: "inv-flow", label: "Goods flow", code: "INV03", href: "/inventory/movements" },
        { id: "inv-count", label: "Physical count", code: "INV04", href: "/inventory/physical-count" },
      ],
    },
    { id: "inv-reorder", label: "Reorder control", code: "INV05", href: "/inventory/reorder" },
  ],
};
