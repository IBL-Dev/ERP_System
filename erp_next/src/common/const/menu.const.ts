import type { MenuNode } from "../type";
import { ROUTES } from "./routes.const";

export const INVENTORY_MENU: MenuNode = {
  id: "inventory",
  label: "Inventory department",
  description: "Stock levels, item lifecycle, stock movement and reordering.",
  children: [
    { id: "inv-overview", label: "Inventory overview", code: "INV00", href: ROUTES.inventory.overview },
    { id: "inv-stock", label: "Stock levels", code: "INV01", href: ROUTES.inventory.stock },
    { id: "inv-lifecycle", label: "Item lifecycle", code: "INV02", href: ROUTES.inventory.lifecycle },
    {
      id: "inv-movement",
      label: "Stock movement",
      children: [
        { id: "inv-flow", label: "Goods flow", code: "INV03", href: ROUTES.inventory.movements },
        { id: "inv-count", label: "Physical count", code: "INV04", href: ROUTES.inventory.physicalCount },
      ],
    },
    { id: "inv-reorder", label: "Reorder control", code: "INV05", href: ROUTES.inventory.reorder },
  ],
};

export const HR_MENU: MenuNode = {
  id: "hr",
  label: "HR department",
  description: "Employee records, attendance, leave, talent and payroll.",
  children: [
    { id: "hr-overview", label: "HR overview", code: "HR00", href: ROUTES.hr.overview },
    {
      id: "hr-records",
      label: "Employee master records",
      children: [
        { id: "hr-employees", label: "Employee records", code: "HR01", href: ROUTES.hr.employees },
        { id: "hr-org", label: "Organization chart", code: "HR02", href: ROUTES.hr.organization },
      ],
    },
    { id: "hr-attendance", label: "Time and attendance", code: "HR03", href: ROUTES.hr.attendance },
    { id: "hr-leave", label: "Leave and absence", code: "HR04", href: ROUTES.hr.leave },
    {
      id: "hr-talent",
      label: "Talent management",
      children: [
        { id: "hr-goals", label: "Goals", code: "HR05", href: ROUTES.hr.goals },
        { id: "hr-reviews", label: "Performance reviews", code: "HR06", href: ROUTES.hr.reviews },
        { id: "hr-training", label: "Training", code: "HR07", href: ROUTES.hr.training },
      ],
    },
    { id: "hr-payroll", label: "Payroll", code: "HR08", href: ROUTES.hr.payroll },
  ],
};

export const SALES_MENU: MenuNode = {
  id: "sales",
  label: "Sales department",
  description: "Quotes, orders, customers and invoicing.",
  children: [
    { id: "sal-overview", label: "Sales overview", code: "SAL00", href: ROUTES.sales.overview },
    {
      id: "sal-quoting",
      label: "Quoting and pricing",
      children: [
        { id: "sal-quotes", label: "Quotes", code: "SAL01", href: ROUTES.sales.quotes },
        { id: "sal-pricing", label: "Pricing rules", code: "SAL02", href: ROUTES.sales.pricing },
      ],
    },
    { id: "sal-orders", label: "Sales orders", code: "SAL03", href: ROUTES.sales.orders },
    { id: "sal-fulfillment", label: "Fulfillment handoff", code: "SAL04", href: ROUTES.sales.fulfillment },
    { id: "sal-customers", label: "Customers (CRM)", code: "SAL05", href: ROUTES.sales.customers },
    { id: "sal-billing", label: "Invoicing and billing", code: "SAL06", href: ROUTES.sales.billing },
  ],
};

export const SUPPLIER_MENU: MenuNode = {
  id: "supplier",
  label: "Supplier department",
  description: "Vendors, contracts, purchasing, supplier performance and payment notes.",
  children: [
    { id: "sup-overview", label: "Supplier overview", code: "SUP00", href: ROUTES.supplier.overview },
    {
      id: "sup-srm",
      label: "Vendor database (SRM)",
      children: [
        { id: "sup-suppliers", label: "Suppliers", code: "SUP01", href: ROUTES.supplier.suppliers },
        { id: "sup-contracts", label: "Contracts", code: "SUP02", href: ROUTES.supplier.contracts },
      ],
    },
    {
      id: "sup-purchasing",
      label: "Purchasing",
      children: [
        { id: "sup-reorder", label: "Low stock and reordering", code: "SUP03", href: ROUTES.supplier.reorder },
        { id: "sup-requisitions", label: "Purchase requisitions", code: "SUP04", href: ROUTES.supplier.requisitions },
        { id: "sup-orders", label: "Purchase orders", code: "SUP05", href: ROUTES.supplier.orders },
      ],
    },
    { id: "sup-performance", label: "Performance and compliance", code: "SUP06", href: ROUTES.supplier.performance },
    { id: "sup-receipts", label: "Goods receipt and payment notes", code: "SUP07", href: ROUTES.supplier.receipts },
  ],
};

/** Main menu. Departments not built yet are marked comingSoon. */
export const MENU: MenuNode[] = [
  INVENTORY_MENU,
  { id: "finance", label: "Finance department", description: "Accounting, payments and reporting.", comingSoon: true },
  HR_MENU,
  SUPPLIER_MENU,
  SALES_MENU,
];

/** Demo favorites. TODO: store per user once there is a backend. */
export const FAVORITE_MENU_IDS: readonly string[] = ["inv-stock", "inv-reorder"];

/** Folders that start expanded in the menu tree. */
export const MENU_ROOT_IDS: readonly string[] = ["favorites", "root"];
