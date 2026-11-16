import type { ReactNode } from "react";

type Props = {
  title: string;
  /** Transaction code shown beside the title, e.g. INV01. */
  code?: string;
  description?: string;
  actions?: ReactNode;
};

export function PageHeader({ title, code, description, actions }: Props) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold">
          {title}
          {code && <span className="ml-2 text-sm font-normal text-ink-muted">{code}</span>}
        </h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-ink-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
