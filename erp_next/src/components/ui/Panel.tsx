import type { ReactNode } from "react";
import { PANEL_CLASS } from "@/common/const";
import { cn } from "@/lib/cn";

type Props = {
  title?: string;
  /** Needed with `title`, so the section is labelled for screen readers. */
  titleId?: string;
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
};

/** Card surface with an optional heading row. For a form that should look like a card, use PANEL_CLASS. */
export function Panel({ title, titleId, actions, className, children }: Props) {
  return (
    <section aria-labelledby={title ? titleId : undefined} className={cn(PANEL_CLASS, className)}>
      {(title || actions) && (
        <div className="flex items-center justify-between gap-3">
          {title && (
            <h2 id={titleId} className="font-semibold">
              {title}
            </h2>
          )}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}
