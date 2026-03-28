interface SiteShellProps {
  children: React.ReactNode;
}

export function SiteShell({ children }: SiteShellProps) {
  return (
    <div className="relative min-h-screen">
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 pt-10">
        <div>
          <p className="font-medium text-[var(--accent)] text-base tracking-[0.35em]">
            FROGE
          </p>
        </div>
      </header>

      <div className="relative z-10">{children}</div>
    </div>
  );
}
