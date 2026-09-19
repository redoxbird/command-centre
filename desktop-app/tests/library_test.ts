// Task C3: library over lean DB + sidecars (ephemeral DB + temp sidecar dir).
import { assert, assertEquals, assertRejects } from "jsr:@std/assert@^1";
import { join } from "std/path";
import { closeDatabase, openEphemeralDatabase } from "../db/db.ts";
import { isValidCommandId } from "../ids.ts";
import {
  duplicateCommand,
  exportJson,
  getCommand,
  importJson,
  listCommands,
  removeCommand,
  saveCommand,
  searchCommands,
} from "../library.ts";
import { readMetadata, writeMetadata } from "../metadata.ts";
import { DEFAULT_COMMANDS } from "../seeds.ts";

async function setup() {
  const { db, dir } = await openEphemeralDatabase();
  const base = join(dir, "app");
  await Deno.mkdir(join(base, "commands"), { recursive: true });
  return { db, dir, base };
}

async function cleanup(dir: string): Promise<void> {
  await closeDatabase();
  for (let i = 0; i < 5; i++) {
    try {
      await Deno.remove(dir, { recursive: true });
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 50));
    }
  }
}

Deno.test("empty library seeds 12 valid CVCV commands", async () => {
  const { db, dir, base } = await setup();
  try {
    const all = await listCommands(db, base);
    assertEquals(all.length, 12);
    assertEquals(DEFAULT_COMMANDS.length, 12);
    for (const c of all) assert(isValidCommandId(c.row.id), c.row.id);
    const ids = new Set(all.map((c) => c.row.id));
    assertEquals(ids.size, 12);
    const ffmpeg = all.find((c) => c.row.title.includes("streaming MP4"));
    assert(ffmpeg, "ffmpeg seed present");
    assertEquals(ffmpeg!.metadata.variables.length, 18);
    const withOptions = ffmpeg!.metadata.variables.filter((v) => v.options?.length);
    assert(withOptions.length > 0, "per-option labels present");
  } finally {
    await cleanup(dir);
  }
});

Deno.test("create → export → import → deep-equal", async () => {
  const { db, dir, base } = await setup();
  try {
    const created = await saveCommand(
      {
        command: "ffmpeg -i {{input.file}} -crf {{input.range:18-28=23}}",
        title: "Encode clip",
        description: "Test encode",
        source_folder: "C:\\work",
        tags: ["video"],
      },
      { askMode: "once", values: { "input.file": "a.mp4" } },
      db,
      base,
    );
    assert(isValidCommandId(created.row.id));
    assertEquals(created.row.tags, ["video"]);
    const { filename, doc } = await exportJson(created.row.id, db, base);
    assertEquals(filename, `${created.row.id}.metadata.json`);
    assertEquals(doc["command"], created.row.command);
    assertEquals(doc["name"], created.row.title);
    assertEquals(doc["description"], created.row.description);
    assertEquals(doc["workingDirectory"], created.row.source_folder);
    // Import as a new command (drop id so it mints a fresh one).
    const { id: _drop, ...rest } = doc as Record<string, unknown>;
    void _drop;
    const imported = await importJson(rest, db, base);
    assert(isValidCommandId(imported.row.id));
    assert(imported.row.id !== created.row.id, "fresh id on import");
    assertEquals(imported.row.command, created.row.command);
    assertEquals(imported.row.title, created.row.title);
    assertEquals(imported.metadata.askMode, "once");
  } finally {
    await cleanup(dir);
  }
});

Deno.test("duplicate yields fresh CVCV id; delete removes row + sidecar", async () => {
  const { db, dir, base } = await setup();
  try {
    const all = await listCommands(db, base);
    const src = all[0];
    const dup = await duplicateCommand(src.row.id, db, base);
    assert(isValidCommandId(dup.row.id));
    assert(dup.row.id !== src.row.id);
    assert(dup.row.title.endsWith("(copy)"));
    assertEquals(dup.row.command, src.row.command);
    assert(await readMetadata(dup.row.id, base), "sidecar copied");
    await removeCommand(dup.row.id, db, base);
    assertEquals(await getCommand(dup.row.id, db, base), null);
    assertEquals(await readMetadata(dup.row.id, base), null);
  } finally {
    await cleanup(dir);
  }
});

Deno.test("search matches substring over the 4 DB fields only", async () => {
  const { db, dir, base } = await setup();
  try {
    const hits = await searchCommands("ffmpeg", db, base);
    assert(hits.length >= 1);
    assert(hits.every((c) => JSON.stringify(c.row).toLowerCase().includes("ffmpeg")));
    // Metadata-only terms (e.g. a variable label) must NOT match.
    const metaOnly = await searchCommands("widely compatible default", db, base);
    assertEquals(metaOnly.length, 0);
    const empty = await searchCommands("", db, base);
    assertEquals(empty.length, 12);
  } finally {
    await cleanup(dir);
  }
});

Deno.test("missing/corrupt sidecar degrades gracefully; non-CVCV ids throw", async () => {
  const { db, dir, base } = await setup();
  try {
    const all = await listCommands(db, base);
    const victim = all[1];
    // Corrupt the sidecar on disk.
    const { sidecarPath } = await import("../metadata.ts");
    await Deno.writeTextFile(sidecarPath(victim.row.id, base), "{corrupt");
    const reread = await getCommand(victim.row.id, db, base);
    assert(reread, "row still readable");
    assertEquals(reread!.metadata.askMode, "every");
    // Non-CVCV ids are rejected (no legacy support — app unreleased).
    await assertRejects(
      () => saveCommand({ id: "u1757740800000", command: "echo hi", title: "Old" }, undefined, db, base),
      Error,
      "invalid command id",
    );
    await assertRejects(
      () =>
        importJson(
          { id: "u1757740800000", name: "Old", cmd: "echo {{input.text:hi}}", tag: "custom", cwd: "C:\\x" },
          db,
          base,
        ),
      Error,
      "invalid command id",
    );
    // Missing id still mints fresh CVCV.
    const imported = await importJson(
      { name: "New", cmd: "echo {{input.text:hi}}", tag: "custom", cwd: "C:\\x" },
      db,
      base,
    );
    assert(isValidCommandId(imported.row.id));
    assertEquals(imported.row.title, "New");
    assertEquals(imported.row.tags, ["custom"]);
    // Corrupt-then-save heals the sidecar.
    await writeMetadata(victim.row.id, { ...(await readMetadata(victim.row.id, base))!, id: victim.row.id }, base);
    assert(await readMetadata(victim.row.id, base), "sidecar healed");
  } finally {
    await cleanup(dir);
  }
});
