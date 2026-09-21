// Vendors the input layer into static/vendor/. Run: deno task build:inputs
// Copies enhanced-inputs dist (IIFE bundle + default theme) and fetches the
// range-slider-element ES module via `npm pack` (pinned). inputs-remap.css
// is hand-authored and committed — never generated.
//
// Clean-clone robustness: if enhanced-inputs/dist/index.js is missing, this
// installs the library deps and runs its build first, so
// `deno task build:dir` needs no manual steps. NOTE: the library build emits
// JS only — dist/themes/*.css are unbuildable artifacts (tracked as EI1). If
// default.css is missing after a rebuild, this fails loudly instead of
// shipping an unthemed app.
import { dirname, join } from "std/path";

const RANGE_SLIDER_VERSION = "2.1.1";

const root = new URL("../../", import.meta.url).pathname.replace(/^\//, "");
const eiDir = join(root, "enhanced-inputs");
const ei = join(eiDir, "dist");
const vendor = join(root, "desktop-app", "static", "vendor");
const isWin = Deno.build.os === "windows";

async function exists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch {
    return false;
  }
}

async function run(cmd: string, args: string[], cwd: string, what: string): Promise<void> {
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
}

if (!(await exists(join(ei, "index.js")))) {
  console.log("enhanced-inputs/dist missing — installing deps and building...");
  if (!(await exists(join(eiDir, "node_modules", "esbuild")))) {
    await run(isWin ? "npm.cmd" : "npm", ["install", "--no-audit", "--no-fund"], eiDir, "npm install (enhanced-inputs)");
  }
  await run(isWin ? "node.exe" : "node", ["build.mjs"], eiDir, "node build.mjs (enhanced-inputs)");
}

await Deno.mkdir(vendor, { recursive: true });
await Deno.copyFile(join(ei, "index.js"), join(vendor, "e-input.js"));
if (!(await exists(join(ei, "themes", "default.css")))) {
  throw new Error(
    "enhanced-inputs/dist/themes/default.css missing after build — " +
      "the library build does not emit themes (tracked as EI1); " +
      "restore dist/ from version control or fix build.mjs",
  );
}
await Deno.copyFile(
  join(ei, "themes", "default.css"),
  join(vendor, "enhanced-inputs.css"),
);
console.log("Vendored e-input.js + enhanced-inputs.css");

// range-slider-element ships as an ES module with side-effect auto-define.
// Prefer an existing copy in enhanced-inputs/node_modules; otherwise unpack
// the pinned tarball with npm (reproducible, no manual step).
const localCopy = join(
  root,
  "enhanced-inputs",
  "node_modules",
  "range-slider-element",
  "dist",
  "range-slider-element.js",
);
try {
  await Deno.copyFile(localCopy, join(vendor, "range-slider.js"));
  console.log("Vendored range-slider.js from", localCopy);
} catch {
  const tmp = await Deno.makeTempDir();
  try {
    const pack = new Deno.Command("npm", {
      args: ["pack", `range-slider-element@${RANGE_SLIDER_VERSION}`],
      cwd: tmp,
      stdout: "piped",
      stderr: "piped",
    });
    const r = await pack.output();
    if (!r.success) {
      throw new Error(new TextDecoder().decode(r.stderr));
    }
    const tgz = join(tmp, `range-slider-element-${RANGE_SLIDER_VERSION}.tgz`);
    const extract = new Deno.Command("tar", {
      args: [
        "-xzf",
        tgz,
        "-C",
        tmp,
        "package/dist/range-slider-element.js",
      ],
      stdout: "piped",
      stderr: "piped",
    });
    const e = await extract.output();
    if (!e.success) throw new Error(new TextDecoder().decode(e.stderr));
    await Deno.copyFile(
      join(tmp, "package", "dist", "range-slider-element.js"),
      join(vendor, "range-slider.js"),
    );
    console.log(
      `Vendored range-slider.js via npm pack range-slider-element@${RANGE_SLIDER_VERSION}`,
    );
  } finally {
    await Deno.remove(tmp, { recursive: true });
  }
}
