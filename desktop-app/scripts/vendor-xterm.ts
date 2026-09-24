// Vendors the terminal stack into static/vendor/. Run: deno task build:xterm
// Pure Deno: pinned files are fetched and written directly — no npm CLI, no
// tar, no esbuild binary (deno bundle cannot run its esbuild sidecar here).
// No CDN at runtime: the desktop embeds its root (A5/A6 precedent).
//
// xterm 5.3.0 ships a browser UMD at lib/xterm.js (defines window.Terminal);
// the fit addon exposes window.FitAddon. JetBrains Mono (user pick) rides
// along as woff2 so the terminal never waits on a webfont CDN.
const FILES: Array<{ url: string; dest: string; expect: string }> = [
  {
    url: "https://cdn.jsdelivr.net/npm/xterm@5.3.0/lib/xterm.js",
    dest: "xterm.js",
    expect: "Terminal",
  },
  {
    url: "https://cdn.jsdelivr.net/npm/xterm@5.3.0/css/xterm.css",
    dest: "xterm.css",
    expect: ".xterm",
  },
  {
    url: "https://cdn.jsdelivr.net/npm/xterm-addon-fit@0.8.0/lib/xterm-addon-fit.js",
    dest: "xterm-addon-fit.js",
    expect: "FitAddon",
  },
  {
    url: "https://cdn.jsdelivr.net/fontsource/fonts/jetbrains-mono@latest/latin-400-normal.woff2",
    dest: "fonts/jetbrains-mono-400.woff2",
    expect: "wOF2",
  },
  {
    url: "https://cdn.jsdelivr.net/fontsource/fonts/jetbrains-mono@latest/latin-700-normal.woff2",
    dest: "fonts/jetbrains-mono-700.woff2",
    expect: "wOF2",
  },
];

const root = new URL("../../", import.meta.url).pathname.replace(/^\//, "");
const vendor = root + "/desktop-app/static/vendor";

await Deno.mkdir(vendor, { recursive: true });
await Deno.mkdir(vendor + "/fonts", { recursive: true });

for (const { url, dest, expect } of FILES) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`fetch failed: ${url} -> HTTP ${res.status} (re-pin, never substitute)`);
  }
  const data = new Uint8Array(await res.arrayBuffer());
  if (dest.endsWith(".woff2")) {
    const magic = new TextDecoder("ascii").decode(data.slice(0, 4));
    if (magic !== "wOF2" || data.length < 1024) {
      throw new Error(`fetch failed: ${url} is not a woff2 file`);
    }
  } else {
    const text = new TextDecoder().decode(data);
    if (!text.includes(expect)) {
      throw new Error(`fetch failed: ${url} missing marker ${expect}`);
    }
  }
  await Deno.writeFile(vendor + "/" + dest, data);
  console.log(`Vendored ${dest} (${data.length}B)`);
}
console.log("terminal stack vendored: xterm.js + xterm.css + xterm-addon-fit.js + JetBrains Mono 400/700");
