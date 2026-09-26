// Task N1: manager builders/parsers + live probe.
import { assert, assertEquals, assertThrows } from "jsr:@std/assert@^1";
import {
  buildInstallLine,
  buildSearchArgs,
  buildStatusArgs,
  buildUninstallLine,
  isStatusHit,
  MANAGER_ORDER,
  MANAGERS,
  parseBunInfo,
  parseScoopSearch,
  parseWingetSearch,
  probeInstalledManagers,
} from "../pkgmanagers.ts";
import { ManagerIdSchema, PkgInstallSchema, PkgSearchSchema } from "../types.ts";

Deno.test("managers table holds exactly winget/scoop/bun in order", () => {
  assertEquals([...MANAGER_ORDER], ["winget", "scoop", "bun"]);
  assertEquals(MANAGERS.winget.label, "WinGet");
  assertEquals(MANAGERS.scoop.label, "Scoop");
  assertEquals(MANAGERS.bun.label, "Bun");
  for (const id of MANAGER_ORDER) {
    assertEquals(MANAGERS[id].id, id);
    assert(MANAGERS[id].icon.endsWith(".svg"), MANAGERS[id].icon);
  }
});

Deno.test("install lines are exact", () => {
  assertEquals(
    buildInstallLine("winget", "Gyan.FFmpeg"),
    'winget install --id "Gyan.FFmpeg" -e --silent --accept-package-agreements --accept-source-agreements',
  );
  assertEquals(buildInstallLine("scoop", "ffmpeg"), 'scoop install "ffmpeg"');
  assertEquals(buildInstallLine("bun", "svgo"), 'bun add -g "svgo"');
});

Deno.test("uninstall lines mirror installs", () => {
  assertEquals(
    buildUninstallLine("winget", "Gyan.FFmpeg"),
    'winget uninstall --id "Gyan.FFmpeg" -e --silent',
  );
  assertEquals(buildUninstallLine("scoop", "ffmpeg"), 'scoop uninstall "ffmpeg"');
  assertEquals(buildUninstallLine("bun", "svgo"), 'bun remove -g "svgo"');
});

Deno.test("unsafe specs throw instead of reaching a shell line", () => {
  for (const bad of ["a;b", "a|b", "a&b", "$x", "`x`", '"x"', "a b", "a>b", "a*b", "a\\b", "(a)", "'a'"]) {
    assertThrows(() => buildInstallLine("winget", bad), Error, "unsafe package spec", bad);
    assertThrows(() => buildUninstallLine("scoop", bad), Error, "unsafe package spec", bad);
  }
});

Deno.test("search argv per manager", () => {
  assertEquals(
    buildSearchArgs("winget", "ffmpeg"),
    ["search", "--query", "ffmpeg", "--source", "winget", "--accept-source-agreements"],
  );
  assertEquals(buildSearchArgs("scoop", "ffmpeg"), ["search", "ffmpeg"]);
  assertEquals(buildSearchArgs("bun", "svgo"), ["info", "svgo", "--json"]);
  assertThrows(() => buildSearchArgs("winget", "   "), Error, "search query is required");
});

Deno.test("status argv per manager", () => {
  assertEquals(
    buildStatusArgs("winget", "Git.Git"),
    ["list", "--id", "Git.Git", "-e", "--accept-source-agreements"],
  );
  assertEquals(buildStatusArgs("scoop", "git"), ["list", "git"]);
  assertEquals(buildStatusArgs("bun", "svgo"), ["pm", "ls", "-g"]);
});

Deno.test("winget table output parses to rows", () => {
  const stdout = "Name  Id       Version  Source\r\n------------------------------\r\nGit   Git.Git  2.45.0   winget\r\n";
  assertEquals(parseWingetSearch(stdout), [{ name: "Git", id: "Git.Git", version: "2.45.0" }]);
  assertEquals(parseWingetSearch("No package found.\n"), []);
});

Deno.test("winget JSON output parses to rows", () => {
  const stdout = JSON.stringify({ Data: [{ Name: "Git", Id: "Git.Git", Version: "2.45.0" }] });
  assertEquals(parseWingetSearch(stdout), [{ name: "Git", id: "Git.Git", version: "2.45.0" }]);
});

Deno.test("scoop bucket output parses with bucket names", () => {
  const stdout = "'main' bucket:\n    git (2.45.0)\n    ffmpeg (7.1) --> includes 'ffmpeg.exe'\n'extras' bucket:\n    vscode (1.90.0)\n";
  assertEquals(parseScoopSearch(stdout), [
    { name: "git", version: "2.45.0", bucket: "main" },
    { name: "ffmpeg", version: "7.1", bucket: "main" },
    { name: "vscode", version: "1.90.0", bucket: "extras" },
  ]);
});

Deno.test("bun info JSON parses to a record", () => {
  const stdout = JSON.stringify({ name: "svgo", version: "3.0.2", description: "SVG optimizer" });
  assertEquals(parseBunInfo(stdout), { name: "svgo", version: "3.0.2", description: "SVG optimizer" });
  assertEquals(parseBunInfo("not json"), null);
  assertEquals(parseBunInfo(JSON.stringify({ version: "1.0.0" })), null);
});

Deno.test("status hits match echoed ids, not empty output", () => {
  assertEquals(isStatusHit("winget", "Git.Git  2.45.0\n", "Git.Git"), true);
  assertEquals(isStatusHit("winget", "No installed package found.\n", "Git.Git"), false);
  assertEquals(isStatusHit("scoop", "git 2.45.0\n", "git"), true);
  assertEquals(isStatusHit("scoop", "\n", "git"), false);
  assertEquals(isStatusHit("bun", "svgo@3.0.2\n", "svgo"), true);
  assertEquals(isStatusHit("bun", "svgo\n", "svgo"), true);
  assertEquals(isStatusHit("bun", "svgo-extra@1.0.0\n", "svgo"), false);
});

Deno.test("live probe matches where.exe reality", () => {
  const probes = probeInstalledManagers();
  assertEquals(probes.map((probe) => probe.id), ["winget", "scoop", "bun"]);
  for (const probe of probes) {
    assertEquals(typeof probe.installed, "boolean");
    if (probe.installed) {
      assert(probe.path !== null && probe.path.length > 0, `${probe.id} needs a path`);
      assert(probe.version !== null && probe.version.length > 0, `${probe.id} needs a version`);
    } else {
      assertEquals(probe.version, null);
      assertEquals(probe.path, null);
    }
  }
  if (Deno.build.os === "windows") {
    assertEquals(probes[0].installed, true, "winget ships with Windows 11");
  }
});

Deno.test("manager contracts accept the three ids and reject the old ones", () => {
  assertEquals(ManagerIdSchema.parse("winget"), "winget");
  assertThrows(() => ManagerIdSchema.parse("legacy-pm-a"));
  assertThrows(() => ManagerIdSchema.parse("legacy-pm-b"));
  assertEquals(PkgSearchSchema.parse({ manager: "scoop", query: "ffmpeg" }), {
    manager: "scoop",
    query: "ffmpeg",
  });
  assertEquals(PkgInstallSchema.parse({ manager: "bun", spec: "svgo" }), {
    manager: "bun",
    spec: "svgo",
  });
});

Deno.test("module holds no legacy manager tokens", async () => {
  const source = await Deno.readTextFile(new URL("../pkgmanagers.ts", import.meta.url));
  assert(!source.includes("legacypm"), "pkgmanagers.ts must not mention the removed managers");
});
