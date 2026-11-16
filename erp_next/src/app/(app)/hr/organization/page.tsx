import type { Metadata } from "next";
import { OrgChartView } from "@/features/hr/components/OrgChartView";

export const metadata: Metadata = { title: "Organization chart" };

export default function Page() {
  return <OrgChartView />;
}
