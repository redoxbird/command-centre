// Vendors xterm.js + fit addon into static/vendor/. Run: deno task build:xterm
// Unpacks the pinned tarballs with npm (reproducible, no manual step),
// following the range-slider precedent in vendor-inputs.ts. No CDN at
// runtime — the desktop embeds its root (A5/A6 precedent).
import { join } from "std/path";

const XTERM_VERSION = "5.3.0";
const FIT_VERSION = "0.8.0";

const root = new URL("../../", import.meta.url).pathname.replace(/^\//, "");
const vendor = join(root, "desktop-app", "static", "vendor");

async function run(cmd: string, args: string[], cwd: string, what: string): Promise<string> {
  const proc = new Deno.Command(cmd, {
    args,
    cwd,
    stdout: "piped",
    stderr: "piped",
  });
  const r = await proc.output();
  if (!r.success) {
    throw new Error(`${what} failed: ${new TextDecoder().decode(r.stderr)}`);
  }
  return new TextDecoder().decode(r.stdout);
}

async function unpack(pkg: string, version: string, picks: Array<[src: string, dest: string]>) {
  const tmp = await Deno.makeTempDir();
  try {
    await run("npm", ["pack", `${pkg}@${version}`], tmp, `npm pack ${pkg}`);
    const tgz = join(tmp, `${pkg.split("/").pop()}-${version}.tgz`);
    const members = picks.map(([src]) => `package/${src}`);
    const tar = new Deno.Command("tar", {
      args: ["-xzf", tgz, "-C", tmp, ...members],
      stdout: "piped",
      stderr: "piped",
    });
    const e = await tar.output();
    if (!e.success) {
      // Re-list so the error names the real layout instead of guessing.
      const list = await run("tar", ["-tzf", tgz], tmp, "tar list");
      throw new Error(
        `extract ${pkg}@${version} failed; tarball holds:\n${list.split("\n").slice(0, 40).join("\n")}`,
      );
    }
    for (const [src, dest] of picks) {
      const data = await Deno.readFile(join(tmp, "package", src));
      await Deno.writeFile(join(vendor, dest), data);
      console.log(`Vendored ${dest} (${data.length}B) from ${pkg}@${version}`);
    }
  } finally {
    await Deno.remove(tmp, { recursive: true });
  }
}

await Deno.mkdir(vendor, { recursive: true });
await unpack("xterm", XTERM_VERSION, [
  ["lib/xterm.js", "xterm.js"],
  ["css/xterm.css", "xterm.css"],
]);
await unpack("xterm-addon-fit", FIT_VERSION, [
  ["lib/xterm-addon-fit.js", "xterm-addon-fit.js"],
]);

// Fail loudly if the layouts drifted (wrong files silently break the window).
for (const [file, marker] of [
  ["xterm.js", "Terminal"],
  ["xterm.css", ".xterm"],
  ["xterm-addon-fit.js", "FitAddon"],
] as Array<[string, string]>) {
  const text = await Deno.readTextFile(join(vendor, file));
  if (!text.includes(marker)) {
    throw new Error(`static/vendor/${file} missing marker ${marker} — re-check package layouts`);
  }
}
console.log("xterm vendored: xterm.js + xterm.css + xterm-addon-fit.js");
