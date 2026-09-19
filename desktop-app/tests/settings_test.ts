// Task C1: settings + migrate-on-open against an ephemeral SQLite file.
import { assert, assertEquals } from "jsr:@std/assert@^1";
import { eq } from "drizzle-orm";
import { closeDatabase, openEphemeralDatabase } from "../db/db.ts";
import {
  commands,
  hubCache,
  hubState,
  publishQueue,
  publishStatus,
  settings,
} from "../db/schema.ts";
import { DEFAULT_SETTINGS, loadSettings, saveSettings } from "../settings.ts";
import { AppSettingsSchema } from "../types.ts";

async function cleanup(dir: string): Promise<void> {
  // Best-effort: libsql on Windows may hold the file briefly after close.
  for (let i = 0; i < 5; i++) {
    try {
      await Deno.remove(dir, { recursive: true });
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 50));
    }
  }
}

Deno.test("migrate-on-open creates every table", async () => {
  const { db, dir } = await openEphemeralDatabase();
  try {
    // Empty selects prove the tables exist.
    await db.select().from(commands);
    await db.select().from(settings);
    await db.select().from(hubCache);
    await db.select().from(hubState);
    await db.select().from(publishQueue);
    await db.select().from(publishStatus);
  } finally {
    await closeDatabase();
    await cleanup(dir);
  }
});

Deno.test("defaults on fresh DB, roundtrip, partial merge", async () => {
  const { db, dir } = await openEphemeralDatabase();
  try {
    assertEquals(await loadSettings(db), DEFAULT_SETTINGS);
    await saveSettings({ ...DEFAULT_SETTINGS, shell: "bash", lastTab: "hub" }, db);
    const back = await loadSettings(db);
    assertEquals(back.shell, "bash");
    assertEquals(back.lastTab, "hub");
    assertEquals(back.confirmRun, DEFAULT_SETTINGS.confirmRun);
    // Partial row merges over defaults instead of throwing.
    await db.update(settings).set({ value: JSON.stringify({ shell: "ubuntu" }) }).where(
      eq(settings.key, "app"),
    );
    const partial = await loadSettings(db);
    assertEquals(partial.shell, "ubuntu");
    assertEquals(partial.sortBy, DEFAULT_SETTINGS.sortBy);
    // Corrupt row falls back to defaults.
    await db.update(settings).set({ value: "{not json" }).where(eq(settings.key, "app"));
    assertEquals(await loadSettings(db), DEFAULT_SETTINGS);
  } finally {
    await closeDatabase();
    await cleanup(dir);
  }
});

Deno.test("AppSettingsSchema rejects out-of-range values", () => {
  assert(!AppSettingsSchema.safeParse({ ...DEFAULT_SETTINGS, maxOutputLines: 999999 }).success);
  assert(!AppSettingsSchema.safeParse({ ...DEFAULT_SETTINGS, shell: "fish" }).success);
  assert(AppSettingsSchema.safeParse(DEFAULT_SETTINGS).success);
});
