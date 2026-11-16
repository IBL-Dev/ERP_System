import type { Metadata } from "next";
import { ReviewsView } from "@/features/hr/components/ReviewsView";

export const metadata: Metadata = { title: "Performance reviews" };

export default function Page() {
  return <ReviewsView />;
}
