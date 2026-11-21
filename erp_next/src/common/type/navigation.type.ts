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
