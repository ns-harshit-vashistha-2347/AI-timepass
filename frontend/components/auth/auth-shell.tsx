import Link from "next/link";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-slide-up">
        <Link
          href="/"
          className="mb-6 flex items-center justify-center gap-2 font-mono text-[13px] tracking-tight text-ink"
        >
          <span className="text-prompt">◆</span>
          <span className="font-semibold">lumen</span>
          <span className="text-ink-faint">·</span>
          <span className="text-ink-dim">v0.2</span>
        </Link>

        <div className="overflow-hidden rounded-lg border border-chrome-border bg-bg-soft shadow-block">
          {/* window chrome */}
          <div className="flex h-9 items-center gap-2 border-b border-chrome-border bg-chrome px-3">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-danger/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-warn/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-ok/80" />
            </div>
            <div className="flex-1 text-center font-mono text-[11px] tracking-[0.14em] text-ink-dim">
              ~/lumen/auth <span className="text-prompt">▸</span>{" "}
              <span className="text-ink">{title.toLowerCase()}</span>
            </div>
            <span className="w-[52px]" />
          </div>

          <div className="p-6 sm:p-7">
            <div className="mb-5">
              <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-prompt">
                ▸ {subtitle ? "session · new" : "session"}
              </p>
              <h1 className="mt-1 text-[22px] font-semibold tracking-tight text-ink">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-1 font-mono text-[12px] text-ink-dim">
                  {subtitle}
                </p>
              )}
            </div>

            {children}
          </div>
        </div>

        {footer && (
          <div className="mt-5 text-center font-mono text-[12px] text-ink-dim">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
