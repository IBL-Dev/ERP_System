import type { Metadata } from "next";
import { HomeView } from "@/components/layout/app-shell/HomeView";

export const metadata: Metadata = { title: "Easy Access" };

export default function HomePage() {
  return <HomeView />;
}
