import type { Metadata } from "next";
import { OrdersView } from "@/features/sales/components/OrdersView";

export const metadata: Metadata = { title: "Sales orders" };

export default function Page() {
  return <OrdersView />;
}
