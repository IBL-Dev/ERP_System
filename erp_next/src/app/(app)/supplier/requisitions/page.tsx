import type { Metadata } from "next";
import { RequisitionsView } from "@/features/supplier/components/RequisitionsView";

export const metadata: Metadata = { title: "Purchase requisitions" };

export default function Page() {
  return <RequisitionsView />;
}
