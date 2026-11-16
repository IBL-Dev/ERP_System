import type { Metadata } from "next";
import { EmployeesView } from "@/features/hr/components/EmployeesView";

export const metadata: Metadata = { title: "Employee records" };

export default function Page() {
  return <EmployeesView />;
}
