import type { Metadata } from "next";
import { PayablesView } from "@/features/finance/components/PayablesView";

export const metadata: Metadata = { title: "Vendor invoices" };

export default function Page() {
  return <PayablesView />;
}
