import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appDir = path.dirname(fileURLToPath(import.meta.url));
const itemPath = path.join(
  appDir,
  "../public/forge-assets/SkyBlock_items_titanium_tesseract.png"
);

async function getItemDataUrl() {
  const image = await readFile(itemPath);
  return `data:image/png;base64,${image.toString("base64")}`;
}

export async function renderForgeIcon(size: number) {
  const itemDataUrl = await getItemDataUrl();
  const imageSize = Math.round(size * 0.78);

  return (
    <div
      style={{
        background: "transparent",
        height: "100%",
        position: "relative",
        width: "100%",
      }}
    >
      <div
        style={{
          backgroundImage: `url(${itemDataUrl})`,
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "contain",
          height: imageSize,
          left: Math.round((size - imageSize) / 2),
          position: "absolute",
          top: Math.round((size - imageSize) / 2),
          width: imageSize,
        }}
      />
    </div>
  );
}
