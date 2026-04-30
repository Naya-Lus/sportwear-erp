import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  actions,
}: {
  eyebrow?: string;
  title: string;
  actions?: ReactNode;
}) {
  return (
    <header className="h-20 border-b border-boundary flex items-center justify-between px-10 sticky top-0 bg-background/80 backdrop-blur-md z-10">
      <div>
        {eyebrow && (
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl font-display text-foreground">{title}</h1>
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </header>
  );
}
