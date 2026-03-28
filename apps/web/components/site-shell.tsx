import { SiteFooter } from "@/components/site-footer";

interface SiteShellProps {
  children: React.ReactNode;
}

export function SiteShell({ children }: SiteShellProps) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-6 pt-10">
        <div>
          <p className="font-medium text-[var(--accent)] text-sm tracking-[0.24em] sm:text-base sm:tracking-[0.3em]">
            BETTER FORGE
          </p>
        </div>
      </header>

      <div className="relative z-10 flex-1">{children}</div>

      <SiteFooter />
    </div>
  );
}
