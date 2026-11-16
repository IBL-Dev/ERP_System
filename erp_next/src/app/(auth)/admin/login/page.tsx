import type { Metadata } from "next";
import { LoginForm } from "@/features/auth";

export const metadata: Metadata = { title: "Administrator log on" };

export default function AdminLoginPage() {
  return (
    <section className="mx-auto w-full max-w-lg">
      <LoginForm variant="admin" />
    </section>
  );
}
