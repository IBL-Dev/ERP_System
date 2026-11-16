import type { Metadata } from "next";
import { EmployeeDetailView } from "@/features/hr/components/EmployeeDetailView";

export const metadata: Metadata = { title: "Employee record" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EmployeeDetailView id={decodeURIComponent(id)} />;
}
