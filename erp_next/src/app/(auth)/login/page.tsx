import type { Metadata } from "next";
import { LoginForm } from "@/features/auth";

export const metadata: Metadata = { title: "Log on" };

export default function LoginPage() {
  return (
    <section className="mx-auto w-full max-w-lg">
      <LoginForm />
    </section>
  );
}
