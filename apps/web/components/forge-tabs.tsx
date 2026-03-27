import { forgeTabs } from "@betterforgeprofits/forge-core/tabs";

export function ForgeTabs({
  activeTab,
  onChange,
}: {
  activeTab: string;
  onChange: (tabId: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-3 border-[var(--border)] border-b pb-5">
      {forgeTabs.map((tab) => {
        const active = tab.id === activeTab;
        return (
          <button
            className={`border px-4 py-3 text-left transition ${
              active
                ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--bg)]"
                : "border-[var(--border)] bg-[var(--panel)]/50 text-[var(--text-soft)] hover:border-[var(--accent)]/45"
            }`}
            key={tab.id}
            onClick={() => onChange(tab.id)}
            type="button"
          >
            <span className="block font-semibold text-base tracking-wide">
              {tab.label}
            </span>
            <span
              className={`mt-1 block text-sm ${active ? "text-[var(--bg)]/75" : "text-[var(--text-faint)]"}`}
            >
              {tab.description}
            </span>
          </button>
        );
      })}
    </div>
  );
}
