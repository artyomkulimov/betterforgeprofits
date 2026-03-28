import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "apps/web"),
      "@betterforgeprofits/db": path.resolve(
        import.meta.dirname,
        "packages/db/src"
      ),
      "@betterforgeprofits/forge-core": path.resolve(
        import.meta.dirname,
        "packages/forge-core/src"
      ),
    },
  },
  test: {
    environment: "node",
    globals: true,
    include: ["**/*.test.ts", "**/*.test.tsx"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: [
        "apps/web/lib/**/*.ts",
        "apps/web/app/api/**/*.ts",
        "packages/forge-core/src/**/*.ts",
      ],
      exclude: [
        "**/*.test.ts",
        "apps/web/next-env.d.ts",
        "apps/web/public/**",
        "apps/web/scripts/**",
      ],
    },
  },
});
