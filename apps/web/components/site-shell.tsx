import Image from "next/image";

import { SiteFooter } from "@/components/site-footer";
import { getForgeItemImage } from "@/lib/forge-item-images";

interface SiteShellProps {
  children: React.ReactNode;
}

const brandTesseract = getForgeItemImage("Titanium Tesseract");

export function SiteShell({ children }: SiteShellProps) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-6 pt-10">
        <div className="flex items-center gap-3 sm:gap-3.5">
          {brandTesseract ? (
            <Image
              alt=""
              aria-hidden
              className="h-9 w-9 shrink-0 object-contain drop-shadow-[0_0_12px_rgba(196,92,38,0.22)] sm:h-10 sm:w-10"
              height={40}
              src={brandTesseract.src}
              width={40}
            />
          ) : null}
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
