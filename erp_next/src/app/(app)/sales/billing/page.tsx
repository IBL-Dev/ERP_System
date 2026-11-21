import type { Metadata } from "next";
import { BillingView } from "@/features/sales/components/BillingView";

export const metadata: Metadata = { title: "Invoicing and billing" };

export default function Page() {
  return <BillingView />;
}
