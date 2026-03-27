import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(process.cwd(), "../.."),
  transpilePackages: [
    "@betterforgeprofits/db",
    "@betterforgeprofits/forge-core",
  ],
};

export default nextConfig;
