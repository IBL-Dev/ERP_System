import type { Metadata } from "next";
import { OverviewView } from "@/features/finance/components/OverviewView";

export const metadata: Metadata = { title: "Finance overview" };

export default function Page() {
  return <OverviewView />;
}
