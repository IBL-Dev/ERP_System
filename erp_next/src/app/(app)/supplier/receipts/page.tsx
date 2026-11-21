import type { Metadata } from "next";
import { ReceiptsView } from "@/features/supplier/components/ReceiptsView";

export const metadata: Metadata = { title: "Goods receipt and payment notes" };

export default function Page() {
  return <ReceiptsView />;
}
