import type { ImageProvider } from "./provider.ts";

function svgDataUri(title: string, subtitle: string): string {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="768" height="768" viewBox="0 0 768 768">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1a2433"/>
      <stop offset="100%" stop-color="#0e141d"/>
    </linearGradient>
  </defs>
  <rect width="768" height="768" fill="url(#bg)"/>
  <circle cx="384" cy="330" r="110" fill="none" stroke="#3ee0c5" stroke-width="8"/>
  <text x="384" y="500" fill="#e8eef7" font-family="Georgia, serif" font-size="28" text-anchor="middle">${escapeXml(title.slice(0, 42))}</text>
  <text x="384" y="540" fill="#8ea0b5" font-family="Georgia, serif" font-size="16" text-anchor="middle">${escapeXml(subtitle.slice(0, 60))}</text>
</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function createMockProvider(delayMs = 120): ImageProvider {
  return {
    async generate(input) {
      await sleep(delayMs);
      return { url: svgDataUri("mock generate", input.prompt) };
    },
    async edit(input) {
      await sleep(delayMs);
      return { url: svgDataUri("mock edit", input.prompt) };
    },
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
