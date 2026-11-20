import type { Metadata } from "next";
import { PricingView } from "@/features/sales/components/PricingView";

export const metadata: Metadata = { title: "Pricing rules" };

export default function Page() {
  return <PricingView />;
}
