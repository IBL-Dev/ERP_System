import { redirect } from "next/navigation";
import { ROUTES } from "@/common/const";

export default function HomePage() {
  redirect(ROUTES.login);
}
