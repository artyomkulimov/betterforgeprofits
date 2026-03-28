export function SiteFooter() {
  return (
    <footer className="relative z-10 mt-auto border-[var(--border)] border-t">
      <div className="mx-auto max-w-7xl px-6 py-3">
        <p className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5 text-center text-[10px] text-[var(--text-faint)] uppercase tracking-[0.2em]">
          <span>Built by</span>
          <span className="font-[family-name:var(--font-atlas-serif)] text-[11px] text-[var(--accent)] lowercase normal-case italic tracking-normal">
            wumpie
          </span>
          <span aria-hidden className="text-[var(--text-muted)]">
            ·
          </span>
          <a
            className="text-[var(--accent-soft)] transition hover:text-[var(--accent)]"
            href="https://github.com/artyomkulimov"
            rel="noopener noreferrer"
            target="_blank"
          >
            GitHub
          </a>
        </p>
      </div>
    </footer>
  );
}
