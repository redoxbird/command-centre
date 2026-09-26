// Vendors tool icons into design/icons/ and static/icons/. Run: deno task build:icons
// Fetches pinned default.svg per tool from the thesvg CDN (no runtime CDN —
// the desktop embeds its root, A5 precedent). Design is the source of truth:
// files land in design/icons/ first, then copy to static/icons/ (same flow).
//
// Slugs verified 2026-09-23 (200 + <svg>): powershell, bash, ubuntu,
// chocolatey, bun, ffmpeg, git, curl, docker, npm, nodejs. A full-registry
// search on 2026-09-26 (7402 thesvg slugs via the git trees API) confirmed
// no winget or scoop slug exists, so icons/winget.svg + icons/scoop.svg are
// hand-authored from the hub ICONS paths (same 16x16 stroke language as the
// inline fallback) and copied by hand, never fetched. Deliberately NOT
// fetched: libvips, imagemagick, ytdlp, jq (404) — those keep the design's
// inline-SVG fallback; never substitute a wrong logo.

const CDN = "https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons";
const ICONS: Array<[slug: string, file: string]> = [
  ["powershell", "powershell.svg"],
  ["bash", "bash.svg"],
  ["ubuntu", "ubuntu.svg"],
  ["chocolatey", "chocolatey.svg"],
  ["bun", "bun.svg"],
  ["ffmpeg", "pkg-ffmpeg.svg"],
  ["git", "pkg-git.svg"],
  ["curl", "pkg-curl.svg"],
  ["docker", "docker.svg"],
  ["npm", "npm.svg"],
  ["nodejs", "nodejs.svg"],
];

const root = new URL("../../", import.meta.url).pathname.replace(/^\//, "");
const designDir = join(root, "design", "icons");
const staticDir = join(root, "desktop-app", "static", "icons");

await Deno.mkdir(designDir, { recursive: true });
await Deno.mkdir(staticDir, { recursive: true });

for (const [slug, file] of ICONS) {
  const url = `${CDN}/${slug}/default.svg`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`icon fetch failed: ${slug} -> HTTP ${res.status} (remove the slug, never substitute)`);
  }
  const svg = await res.text();
  if (!svg.includes("<svg")) {
    throw new Error(`icon fetch failed: ${slug} did not return SVG`);
  }
  await Deno.writeTextFile(join(designDir, file), svg);
  await Deno.writeTextFile(join(staticDir, file), svg);
  console.log(`icon ok: ${slug} -> ${file} (${svg.length}B)`);
}
console.log(`icons vendored: ${ICONS.length} files in design/icons/ + static/icons/`);
