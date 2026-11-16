import type { Metadata } from "next";
import { MovementsView } from "@/features/inventory/components/MovementsView";

export const metadata: Metadata = { title: "Goods flow" };

export default function Page() {
  return <MovementsView />;
}
