import type { Metadata } from "next";
import { PaymentScheduleView } from "@/features/finance/components/PaymentScheduleView";

export const metadata: Metadata = { title: "Payment schedule" };

export default function Page() {
  return <PaymentScheduleView />;
}
