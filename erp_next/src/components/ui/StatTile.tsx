import Link from "next/link";
import { cn } from "@/lib/cn";

type Props = {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "danger" | "warning";
  href?: string;
};

export function StatTile({ label, value, hint, tone, href }: Props) {
  const body = (
    <>
      <p className="text-sm text-ink-muted">{label}</p>
      <p
        className={cn(
          "mt-1 text-2xl font-semibold tabular-nums",
          tone === "danger" && "text-danger",
          tone === "warning" && "text-warning",
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
    </>
  );
  const box = "block rounded-md border border-line bg-panel p-4";

  return href ? (
    <Link
      href={href}
      className={cn(box, "hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent")}
    >
      {body}
    </Link>
  ) : (
    <div className={box}>{body}</div>
  );
}
