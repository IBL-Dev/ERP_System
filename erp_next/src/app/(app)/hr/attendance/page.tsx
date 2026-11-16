import type { Metadata } from "next";
import { AttendanceView } from "@/features/hr/components/AttendanceView";

export const metadata: Metadata = { title: "Time and attendance" };

export default function Page() {
  return <AttendanceView />;
}
