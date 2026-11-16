import type { Metadata } from "next";
import { LifecycleView } from "@/features/inventory/components/LifecycleView";

export const metadata: Metadata = { title: "Item lifecycle" };

export default function Page() {
  return <LifecycleView />;
}
