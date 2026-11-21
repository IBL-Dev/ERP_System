import type { Metadata } from "next";
import { PerformanceView } from "@/features/supplier/components/PerformanceView";

export const metadata: Metadata = { title: "Performance and compliance" };

export default function Page() {
  return <PerformanceView />;
}
