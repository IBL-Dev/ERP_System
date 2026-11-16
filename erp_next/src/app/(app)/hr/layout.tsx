import type { ReactNode } from "react";
import { HrProvider } from "@/features/hr/HrProvider";

export default function HrLayout({ children }: { children: ReactNode }) {
  return <HrProvider>{children}</HrProvider>;
}
