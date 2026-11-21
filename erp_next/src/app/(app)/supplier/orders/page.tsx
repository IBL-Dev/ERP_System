import type { Metadata } from "next";
import { PurchaseOrdersView } from "@/features/supplier/components/PurchaseOrdersView";

export const metadata: Metadata = { title: "Purchase orders" };

export default function Page() {
  return <PurchaseOrdersView />;
}
