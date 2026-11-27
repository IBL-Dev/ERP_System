import type { Metadata } from "next";
import { IncomingPaymentsView } from "@/features/finance/components/IncomingPaymentsView";

export const metadata: Metadata = { title: "Incoming payments" };

export default function Page() {
  return <IncomingPaymentsView />;
}
