import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const manifestPath = path.join(process.cwd(), ".next", "routes-manifest.json");

async function normalizeRoutesManifest() {
  let raw;

  try {
    raw = await readFile(manifestPath, "utf8");
  } catch {
    return;
  }

  const parsed = JSON.parse(raw);
  const normalized = {
    version: parsed.version ?? 3,
    pages404: parsed.pages404 ?? true,
    caseSensitive: parsed.caseSensitive ?? false,
    basePath: parsed.basePath ?? "",
    redirects: Array.isArray(parsed.redirects) ? parsed.redirects : [],
    headers: Array.isArray(parsed.headers) ? parsed.headers : [],
    rewrites: Array.isArray(parsed.rewrites)
      ? {
          beforeFiles: [],
          afterFiles: parsed.rewrites,
          fallback: [],
        }
      : {
          beforeFiles: Array.isArray(parsed.rewrites?.beforeFiles)
            ? parsed.rewrites.beforeFiles
            : [],
          afterFiles: Array.isArray(parsed.rewrites?.afterFiles)
            ? parsed.rewrites.afterFiles
            : [],
          fallback: Array.isArray(parsed.rewrites?.fallback)
            ? parsed.rewrites.fallback
            : [],
        },
    dynamicRoutes: Array.isArray(parsed.dynamicRoutes)
      ? parsed.dynamicRoutes
      : [],
    staticRoutes: Array.isArray(parsed.staticRoutes) ? parsed.staticRoutes : [],
    dataRoutes: Array.isArray(parsed.dataRoutes) ? parsed.dataRoutes : [],
  };

  if (JSON.stringify(parsed) === JSON.stringify(normalized)) {
    return;
  }

  await writeFile(
    manifestPath,
    `${JSON.stringify(normalized, null, 2)}\n`,
    "utf8"
  );
}

normalizeRoutesManifest().catch((error) => {
  console.error("Failed to normalize Next routes manifest.", error);
  process.exit(1);
});
