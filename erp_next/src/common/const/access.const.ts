import type { Role } from "../type";
import { ROUTES } from "./routes.const";

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
};

/**
 * Route prefixes only SUPER_ADMIN may open. ADMIN may open everything else.
 * A prefix covers the page itself and every page below it (so "/finance" covers all Finance pages).
 * To restrict another area later, add its route here; menus, the command bar and the route guard follow.
 */
export const SUPER_ADMIN_ONLY_PREFIXES: readonly string[] = [ROUTES.finance.overview, ROUTES.hr.payroll];

export const NO_ACCESS_COPY = {
  title: "No access",
  body: "Your role does not include this page. Ask a Super Admin if you need access.",
  back: "Back to Easy Access",
} as const;
