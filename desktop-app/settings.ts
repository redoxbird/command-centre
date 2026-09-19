// Settings + window geometry — task C1.
// AppSettings live in the SQLite settings table (key "app").
// Window geometry stays a small JSON file (matches main.ts usage).
import { eq } from "drizzle-orm";
import { dirname, join } from "std/path";
import { getDb, openDatabase, type Db } from "./db/db.ts";
import { appBaseDir, appDataRoot } from "./db/db.ts";
import { settings } from "./db/schema.ts";
import {
  AppSettingsSchema,
  DEFAULT_SETTINGS,
  type AppSettings,
} from "./types.ts";

export { DEFAULT_SETTINGS };
export type { AppSettings };

export interface WindowGeometry {
  width?: number;
  height?: number;
  x?: number | null;
  y?: number | null;
}

function geomPath(): string {
  return join(appBaseDir(), "window.json");
}

function legacyGeomPath(): string {
  return join(appDataRoot(), "command-centre", "window.json");
}

export async function loadWindowGeometry(): Promise<WindowGeometry> {
  for (const p of [geomPath(), legacyGeomPath()]) {
    try {
      const parsed = JSON.parse(await Deno.readTextFile(p));
      if (parsed && typeof parsed === "object") return parsed as WindowGeometry;
    } catch {
      // try next
    }
  }
  return {};
}

export async function saveWindowGeometry(g: WindowGeometry): Promise<void> {
  const p = geomPath();
  await Deno.mkdir(dirname(p), { recursive: true });
  const tmp = `${p}.tmp`;
  await Deno.writeTextFile(tmp, JSON.stringify(g));
  await Deno.rename(tmp, p);
}

async function dbOrDefault(db?: Db): Promise<Db> {
  if (db) return db;
  try {
    return getDb();
  } catch {
    return await openDatabase();
  }
}

/** Defaults on fresh DB; corrupt/partial rows merge over defaults, never throw. */
export async function loadSettings(db?: Db): Promise<AppSettings> {
  const d = await dbOrDefault(db);
  try {
    const rows = await d.select().from(settings).where(eq(settings.key, "app"));
    if (rows.length === 0) return { ...DEFAULT_SETTINGS };
    const stored = JSON.parse(rows[0].value);
    const parsed = AppSettingsSchema.safeParse({ ...DEFAULT_SETTINGS, ...stored });
    if (parsed.success) return parsed.data;
    return { ...DEFAULT_SETTINGS };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveSettings(s: AppSettings, db?: Db): Promise<void> {
  const d = await dbOrDefault(db);
  const parsed = AppSettingsSchema.parse(s);
  const value = JSON.stringify(parsed);
  const existing = await d.select().from(settings).where(eq(settings.key, "app"));
  if (existing.length === 0) {
    await d.insert(settings).values({ key: "app", value });
  } else {
    await d.update(settings).set({ value }).where(eq(settings.key, "app"));
  }
}
