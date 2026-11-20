import type { Metadata } from "next";
import { FulfillmentView } from "@/features/sales/components/FulfillmentView";

export const metadata: Metadata = { title: "Fulfillment handoff" };

export default function Page() {
  return <FulfillmentView />;
}
