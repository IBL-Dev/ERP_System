import type { Metadata } from "next";
import { OverviewView } from "@/features/sales/components/OverviewView";

export const metadata: Metadata = { title: "Sales overview" };

export default function Page() {
  return <OverviewView />;
}
