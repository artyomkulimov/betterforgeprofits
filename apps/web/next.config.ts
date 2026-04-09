import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: "mc-heads.net",
        protocol: "https",
      },
      {
        hostname: "raw.githubusercontent.com",
        protocol: "https",
      },
    ],
  },
  outputFileTracingRoot: path.join(process.cwd(), "../.."),
  transpilePackages: [
    "@betterforgeprofits/db",
    "@betterforgeprofits/forge-core",
  ],
};

export default nextConfig;
