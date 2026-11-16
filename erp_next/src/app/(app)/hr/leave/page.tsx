import type { Metadata } from "next";
import { LeaveView } from "@/features/hr/components/LeaveView";

export const metadata: Metadata = { title: "Leave and absence" };

export default function Page() {
  return <LeaveView />;
}
