// Task N3: featured-package.json renders verbatim in the hub (N4), so the
// schema below must match what paintPkgs reads: id/name/desc/ver/provides/
// tags/managers (subset of winget/scoop/bun, full install lines).
import { assert, assertEquals } from "jsr:@std/assert@^1";

const MANAGER_PREFIXES: Record<string, string> = {
  winget: "winget install --id ",
  scoop: "scoop install ",
  bun: "bun add -g ",
};

interface FeaturedPackage {
  id: string;
  name: string;
  desc: string;
  ver: string;
  provides: string;
  tags: string;
  managers: Record<string, string>;
}

Deno.test("featured packages validate against the hub schema", async () => {
  const url = new URL("../static/data/featured-package.json", import.meta.url);
  const sourceText = await Deno.readTextFile(url);
  const packages = JSON.parse(sourceText) as FeaturedPackage[];
  assert(Array.isArray(packages) && packages.length > 0, "corpus must be a non-empty array");
  const seenIds: Record<string, true> = {};
  for (const pkg of packages) {
    for (const field of ["id", "name", "desc", "ver", "provides", "tags"] as const) {
      assertEquals(typeof pkg[field], "string", `${pkg.id}: ${field} must be a string`);
      assert(pkg[field].trim().length > 0, `${pkg.id}: ${field} must be non-empty`);
    }
    assert(seenIds[pkg.id] !== true, `duplicate id: ${pkg.id}`);
    seenIds[pkg.id] = true;
    assert(pkg.managers && typeof pkg.managers === "object", `${pkg.id}: managers must be an object`);
    const keys = Object.keys(pkg.managers);
    assert(keys.length >= 1, `${pkg.id}: needs at least one manager line`);
    for (const key of keys) {
      const prefix = MANAGER_PREFIXES[key];
      assert(prefix !== undefined, `${pkg.id}: unknown manager key ${key}`);
      assertEquals(typeof pkg.managers[key], "string");
      assert(
        pkg.managers[key].startsWith(prefix),
        `${pkg.id}: ${key} line must start with ${JSON.stringify(prefix)}`,
      );
    }
  }
  assert(
    !/choco|npm install|npm i\b/i.test(sourceText.replace(/Bun/g, "")),
    "corpus must not reference the removed managers",
  );
});
