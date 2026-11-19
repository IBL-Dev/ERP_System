/** Every URL in the app. Use these instead of typing paths into links, redirects or router calls. */
export const ROUTES = {
  root: "/",
  login: "/login",
  adminLogin: "/admin/login",
  home: "/home",
  inventory: {
    overview: "/inventory",
    stock: "/inventory/stock",
    lifecycle: "/inventory/lifecycle",
    movements: "/inventory/movements",
    physicalCount: "/inventory/physical-count",
    reorder: "/inventory/reorder",
  },
  hr: {
    overview: "/hr",
    employees: "/hr/employees",
    employee: (id: string) => `/hr/employees/${id}`,
    organization: "/hr/organization",
    attendance: "/hr/attendance",
    leave: "/hr/leave",
    goals: "/hr/talent/goals",
    reviews: "/hr/talent/reviews",
    training: "/hr/talent/training",
    payroll: "/hr/payroll",
  },
} as const;
