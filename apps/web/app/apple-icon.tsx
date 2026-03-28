import { ImageResponse } from "next/og";

import { renderForgeIcon } from "./icon-shared";

export const contentType = "image/png";
export const size = {
  width: 180,
  height: 180,
};

export default async function AppleIcon() {
  return new ImageResponse(await renderForgeIcon(size.width), size);
}
