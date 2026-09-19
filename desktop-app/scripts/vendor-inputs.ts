// Vendors the input layer into static/vendor/. Run: deno task build:inputs
// Copies enhanced-inputs dist (IIFE bundle + default theme) and fetches the
// range-slider-element ES module via `npm pack` (pinned). inputs-remap.css
// is hand-authored and committed — never generated.
import { join } from "std/path";

const RANGE_SLIDER_VERSION = "2.1.1";

const root = new URL("../../", import.meta.url).pathname.replace(/^\//, "");
const ei = join(root, "enhanced-inputs", "dist");
const vendor = join(root, "desktop-app", "static", "vendor");

await Deno.mkdir(vendor, { recursive: true });
await Deno.copyFile(join(ei, "index.js"), join(vendor, "e-input.js"));
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
