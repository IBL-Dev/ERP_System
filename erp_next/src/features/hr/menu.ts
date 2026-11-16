import type { MenuNode } from "@/config/navigation";

export const hrMenu: MenuNode = {
  id: "hr",
  label: "HR department",
  description: "Employee records, attendance, leave, talent and payroll.",
  children: [
    { id: "hr-overview", label: "HR overview", code: "HR00", href: "/hr" },
    {
      id: "hr-records",
      label: "Employee master records",
      children: [
        { id: "hr-employees", label: "Employee records", code: "HR01", href: "/hr/employees" },
        { id: "hr-org", label: "Organization chart", code: "HR02", href: "/hr/organization" },
      ],
    },
    { id: "hr-attendance", label: "Time and attendance", code: "HR03", href: "/hr/attendance" },
    { id: "hr-leave", label: "Leave and absence", code: "HR04", href: "/hr/leave" },
    {
      id: "hr-talent",
      label: "Talent management",
      children: [
        { id: "hr-goals", label: "Goals", code: "HR05", href: "/hr/talent/goals" },
        { id: "hr-reviews", label: "Performance reviews", code: "HR06", href: "/hr/talent/reviews" },
        { id: "hr-training", label: "Training", code: "HR07", href: "/hr/talent/training" },
      ],
    },
    { id: "hr-payroll", label: "Payroll", code: "HR08", href: "/hr/payroll" },
  ],
};
