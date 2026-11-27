import type { Metadata } from "next";
import { JournalView } from "@/features/finance/components/JournalView";

export const metadata: Metadata = { title: "Journal entries" };

export default function Page() {
  return <JournalView />;
}
