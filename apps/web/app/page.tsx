import { HeroQueryForm } from "@/components/hero-query-form";
import { SiteShell } from "@/components/site-shell";

export default function HomePage() {
  return (
    <SiteShell>
      <HeroQueryForm />
    </SiteShell>
  );
}
