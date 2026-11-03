import type { ReactNode } from "react";

export const PageHeader = ({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) => (
  <header className="flex flex-wrap items-end justify-between gap-4">
    <div className="max-w-2xl">
      {eyebrow ? <p className="text-xs font-medium tracking-[0.16em] text-copper uppercase">{eyebrow}</p> : null}
      <h1 className="mt-1 font-serif text-4xl tracking-tight text-ink">{title}</h1>
      <p className="mt-2 text-sm leading-6 text-ink-soft">{description}</p>
    </div>
    {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
  </header>
);
