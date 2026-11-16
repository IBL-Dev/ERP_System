import type { Metadata } from "next";
import { OverviewView } from "@/features/hr/components/OverviewView";

export const metadata: Metadata = { title: "HR overview" };

export default function Page() {
  return <OverviewView />;
}
