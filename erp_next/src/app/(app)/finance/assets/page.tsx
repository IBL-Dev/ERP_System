import type { Metadata } from "next";
import { AssetsView } from "@/features/finance/components/AssetsView";

export const metadata: Metadata = { title: "Asset management" };

export default function Page() {
  return <AssetsView />;
}
