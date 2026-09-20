// Vendors CodeMirror 6 + closure into static/vendor/codemirror/ (task E4).
// The desktop app must work offline: no esm.sh at runtime. Output is
// committed (like static/vendor/e-input.js). Re-pin by editing PINS.
// Run: deno run --allow-read --allow-write --allow-run --allow-env scripts/vendor-codemirror.ts
import { dirname, join } from "std/path";

// Design importmap pins (design/add.html:7) — keep verbatim.
const PINS: Record<string, string> = {
  "@codemirror/state": "6.7.4",
  "@codemirror/view": "6.43.11",
  "@codemirror/autocomplete": "6.20.3",
  "@codemirror/commands": "6.11.0",
  "@codemirror/language": "6.11.3",
  "@codemirror/legacy-modes": "6.5.2",
};

const ENTRIES = [
  "@codemirror/state/dist/index.js",
  "@codemirror/view/dist/index.js",
  "@codemirror/autocomplete/dist/index.js",
  "@codemirror/commands/dist/index.js",
  "@codemirror/language/dist/index.js",
  "@codemirror/legacy-modes/mode/shell.js",
];

const dir = new URL(".", import.meta.url).pathname.replace(/^\//, "");
const appRoot = join(dir, "..");
const outRoot = join(appRoot, "static", "vendor", "codemirror");
const isWin = Deno.build.os === "windows";

const tmp = await Deno.makeTempDir({ prefix: "cc-cm-" });
try {
  // 1. Install pins into a scratch dir.
  const specs = Object.entries(PINS).map(([p, v]) => `${p}@${v}`);
  const npm = new Deno.Command(isWin ? "npm.cmd" : "npm", {
    args: ["install", "--no-save", "--no-audit", "--no-fund", ...specs],
    cwd: tmp,
    stdout: "piped",
    stderr: "piped",
  });
  const r = await npm.output();
  if (!r.success) throw new Error(new TextDecoder().decode(r.stderr));
  const nm = join(tmp, "node_modules");

  // 2. Walk the import closure from ENTRIES (bare specifiers only).
  const files = new Set<string>(ENTRIES);
  const queue = [...ENTRIES];
  // Single-line module specifiers only (from "..." / import "..." /
  // import("...")); never spans lines, never matches import.meta.
  const bareRe = /\b(?:import\s*(?:\(\s*)?|from\s*)['"]([^'"]+)['"]/g;
  while (queue.length) {
    const rel = queue.pop()!;
    let text: string;
    try {
      text = await Deno.readTextFile(join(nm, rel));
    } catch {
      throw new Error(`vendored entry missing: ${rel}`);
    }
    for (const m of text.matchAll(bareRe)) {
      const spec = m[1];
      if (!spec || spec.startsWith(".") || spec.startsWith("/")) continue;
      if (spec.startsWith("@codemirror/") || spec.startsWith("@lezer/") ||
        spec.startsWith("@marijn/") || ["style-mod", "w3c-keyname", "crelt"].includes(spec)) {
        const target = await resolveSpec(nm, spec);
        if (!files.has(target)) {
          files.add(target);
          queue.push(target);
        }
      }
    }
  }

  // 3. Copy closure into static/vendor/codemirror/.
  await Deno.remove(outRoot, { recursive: true }).catch(() => {});
  for (const rel of files) {
    const dest = join(outRoot, rel);
    await Deno.mkdir(dirname(dest), { recursive: true });
    await Deno.copyFile(join(nm, rel), dest);
  }

  // 4. Emit importmap.json (specifier → vendor-relative file).
  const imports: Record<string, string> = {};
  for (const rel of files) {
    // Map every package root + resolved subpath that was actually imported.
  }
  // Re-scan copied files for the exact specifier set to map.
  const specSet = new Set<string>();
  for (const rel of files) {
    const text = await Deno.readTextFile(join(outRoot, rel));
    for (const m of text.matchAll(bareRe)) {
      if (!m[1] || m[1].startsWith(".") || m[1].startsWith("/")) continue;
      specSet.add(m[1]);
    }
  }
  for (const spec of [...specSet].sort()) {
    // Root-absolute: import-map values resolve against the document base URL,
    // not against this file's location.
    imports[spec] = "/vendor/codemirror/" + (await resolveSpec(nm, spec));
  }
  // The six roots always map (even if only subpaths were scanned).
  const roots: Record<string, string> = {
    "@codemirror/state": "@codemirror/state/dist/index.js",
    "@codemirror/view": "@codemirror/view/dist/index.js",
    "@codemirror/autocomplete": "@codemirror/autocomplete/dist/index.js",
    "@codemirror/commands": "@codemirror/commands/dist/index.js",
    "@codemirror/language": "@codemirror/language/dist/index.js",
    "@codemirror/legacy-modes": "@codemirror/legacy-modes/mode/shell.js",
    "@codemirror/legacy-modes/mode/shell": "@codemirror/legacy-modes/mode/shell.js",
  };
  for (const [k, v] of Object.entries(roots)) {
    if (!imports[k] && files.has(v)) imports[k] = "/vendor/codemirror/" + v;
  }
  await Deno.writeTextFile(
    join(outRoot, "importmap.json"),
    JSON.stringify({ imports }, null, 2) + "\n",
  );
  await Deno.writeTextFile(join(outRoot, "VERSIONS.txt"), specs.join("\n") + "\n");

  // Inline the same map into add.html (robust offline load: no fetch timing
  // questions for the importmap itself). Markers delimit the generated block.
  const importmapJson = JSON.stringify({ imports }, null, 2);
  const addPath = join(appRoot, "static", "add.html");
  const addHtml = await Deno.readTextFile(addPath);
  const blockRe = /<!-- cm-importmap:[^>]*-->[\s\S]*?<!-- \/cm-importmap -->/;
  if (!blockRe.test(addHtml)) throw new Error("add.html lacks the cm-importmap markers");
  const block = `<!-- cm-importmap: generated by scripts/vendor-codemirror.ts — do not hand-edit -->\n<script type="importmap">\n${importmapJson}\n</script>\n<!-- /cm-importmap -->`;
  await Deno.writeTextFile(addPath, addHtml.replace(blockRe, block));
  console.log(`vendored ${files.size} files, ${Object.keys(imports).length} importmap entries → ${outRoot}`);
} finally {
  await Deno.remove(tmp, { recursive: true }).catch(() => {});
}

async function resolveSpec(nm: string, spec: string): Promise<string> {
  // package.json exports-aware resolution for the pinned closure.
  const parts = spec.split("/");
  const isScoped = spec.startsWith("@");
  const pkgName = isScoped ? parts.slice(0, 2).join("/") : parts[0];
  if (!/^@[a-z0-9-]+\/[a-z0-9-]+$|^[a-z0-9-]+$/i.test(pkgName)) {
    throw new Error(`unresolvable bare specifier: ${spec}`);
  }
  const sub = (isScoped ? parts.slice(2) : parts.slice(1)).join("/");
  const pkgJson = JSON.parse(await Deno.readTextFile(join(nm, pkgName, "package.json")));
  const exports = pkgJson.exports as unknown;
  const pick = (cond: unknown): string | null => {
    if (typeof cond === "string") return cond;
    if (cond && typeof cond === "object") {
      const c = cond as Record<string, unknown>;
      // Prefer ESM import builds that exist on disk.
      for (const k of ["browser", "import", "default", "module"]) {
        const v = pick(c[k]);
        if (v) return v;
      }
    }
    return null;
  };
  if (!sub) {
    const main = pick(exports) || pkgJson.module || pkgJson.main || "index.js";
    return pkgName + "/" + main.replace(/^\.\//, "");
  }
  if (exports && typeof exports === "object") {
    const table = exports as Record<string, unknown>;
    const key = "./" + sub;
    if (table[key]) {
      const v = pick(table[key]);
      if (v) return pkgName + "/" + v.replace(/^\.\//, "");
    }
    for (const [k, v] of Object.entries(table)) {
      if (k.endsWith("/*") && key.startsWith(k.slice(0, -1))) {
        const tail = key.slice(k.length - 1);
        const resolved = pick(v);
        if (resolved) return pkgName + "/" + resolved.replace(/^\.\//, "").replace("*", tail);
      }
    }
  }
  return spec;
}
