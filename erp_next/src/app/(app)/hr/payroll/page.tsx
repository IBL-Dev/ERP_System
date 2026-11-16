import type { Metadata } from "next";
import { PayrollView } from "@/features/hr/components/PayrollView";

export const metadata: Metadata = { title: "Payroll" };

export default function Page() {
  return <PayrollView />;
}
