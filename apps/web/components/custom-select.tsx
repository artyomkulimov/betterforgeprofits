"use client";

import { useEffect, useMemo, useRef, useState } from "react";

interface SelectOption {
  detail?: string;
  label: string;
  value: string;
}

export function CustomSelect({
  value,
  options,
  onChange,
  disabled,
  placeholder,
  emptyMenuMessage,
  buttonClassName,
  menuClassName,
}: {
  value: string;
  options: readonly SelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  emptyMenuMessage?: string;
  buttonClassName?: string;
  menuClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const selected = useMemo(() => {
    const match = options.find((option) => option.value === value) ?? null;
    if (match) {
      return match;
    }
    return placeholder ? null : (options[0] ?? null);
  }, [options, placeholder, value]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div className="relative" ref={rootRef}>
      <button
        aria-expanded={open}
        aria-haspopup="listbox"
        className={
          buttonClassName ??
          "flex min-h-[46px] w-full items-center justify-between gap-3 border border-[var(--border)] bg-[var(--panel)]/90 px-4 py-3 text-left text-[var(--text-main)] text-sm transition hover:border-[var(--accent)]/60 disabled:cursor-not-allowed disabled:opacity-60"
        }
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span className="block min-w-0 truncate">
          {selected?.label ?? placeholder ?? "Select an option"}
        </span>
        <span
          className={`text-[11px] text-[var(--accent)] uppercase tracking-[0.24em] transition ${open ? "rotate-180" : ""}`}
        >
          ▾
        </span>
      </button>

      {open ? (
        <div
          className={
            menuClassName ??
            "absolute right-0 left-0 z-30 mt-2 overflow-hidden border border-[var(--border)] bg-[color:rgba(26,21,16,0.98)] shadow-[0_18px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl"
          }
          role="listbox"
        >
          <div className="max-h-80 overflow-y-auto p-2">
            {options.length === 0 && emptyMenuMessage ? (
              <p className="px-3 py-3 text-[var(--text-muted)] text-sm">
                {emptyMenuMessage}
              </p>
            ) : null}
            {options.length > 0
              ? options.map((option) => {
                  const active = option.value === value;

                  return (
                    <button
                      className={`flex w-full items-start justify-between gap-4 border px-3 py-3 text-left transition ${
                        active
                          ? "border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[var(--text-main)]"
                          : "border-transparent bg-transparent text-[var(--text-soft)] hover:border-[var(--border)] hover:bg-[var(--panel)]/70"
                      }`}
                      key={option.value}
                      onClick={() => {
                        setOpen(false);
                        onChange(option.value);
                      }}
                      type="button"
                    >
                      <span className="block min-w-0 truncate text-sm">
                        {option.label}
                      </span>
                      {active ? (
                        <span className="pt-0.5 text-[11px] text-[var(--accent)] uppercase tracking-[0.24em]">
                          Live
                        </span>
                      ) : null}
                    </button>
                  );
                })
              : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
