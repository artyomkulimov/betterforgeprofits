interface SiteShellProps {
  children: React.ReactNode;
}

export function SiteShell({ children }: SiteShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--bg)]">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
      <div className="pointer-events-none absolute top-20 -right-24 h-96 w-96 rounded-full bg-[var(--accent)]/20 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-0 -left-32 h-80 w-80 rounded-full bg-[var(--accent-soft)]/15 blur-[90px]" />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 pt-10">
        <div>
          <p className="font-medium text-[var(--accent)] text-sm tracking-[0.35em]">
            FROGE
          </p>
        </div>
      </header>

      <div className="relative z-10">{children}</div>
    </div>
  );
}
