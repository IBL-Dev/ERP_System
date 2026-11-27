import type { Metadata } from "next";
import { PurchaseOrderBuilderView } from "@/features/supplier/components/PurchaseOrderBuilderView";

export const metadata: Metadata = { title: "New purchase order" };

export default function Page() {
  return <PurchaseOrderBuilderView />;
}
