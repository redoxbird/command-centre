// SQLite via drizzle + @libsql/client — task C1.
// App-data root: LOCALAPPDATA → USERPROFILE → HOME → '.' , under
// "command-center/" (decision 4). DB file: command-center.db.
// migrate-on-open applies db/migrations/*.sql in lexicographic order.
import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import { dirname, fromFileUrl, join } from "std/path";

export type Db = LibSQLDatabase;

let _client: Client | null = null;
let _db: Db | null = null;
let _path = "";

export function appDataRoot(): string {
  return Deno.env.get("LOCALAPPDATA") ??
    Deno.env.get("USERPROFILE") ??
    Deno.env.get("HOME") ??
    ".";
}

export function appBaseDir(): string {
  return join(appDataRoot(), "command-center");
}

export function dbFilePath(): string {
  return join(appBaseDir(), "command-center.db");
}

export function metadataDir(): string {
  return join(appBaseDir(), "commands");
}

function migrationsDir(): string {
  // db/db.ts → db/migrations/
  try {
    return join(dirname(fromFileUrl(import.meta.url)), "migrations");
  } catch {
    return join(Deno.cwd(), "db", "migrations");
  }
}

async function listMigrations(): Promise<{ name: string; sql: string }[]> {
  const dir = migrationsDir();
  const out: { name: string; sql: string }[] = [];
  try {
    for await (const e of Deno.readDir(dir)) {
      if (e.isFile && e.name.endsWith(".sql")) {
        out.push({ name: e.name, sql: await Deno.readTextFile(join(dir, e.name)) });
      }
    }
  } catch {
    // no migrations dir (tests may override) — caller treats as empty
  }
  out.sort((a, b) => a.name < b.name ? -1 : 1);
  return out;
}

function splitStatements(sql: string): string[] {
  return sql.split(/;\s*\n/).map((s) => s.trim()).filter((s) => s.length > 0);
}

async function applyMigrations(client: Client): Promise<void> {
  // Ensure the tracker exists even when there are no migration files.
  await client.execute(
    "CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, applied_at INTEGER NOT NULL)",
  );
  const applied = new Set<string>();
  try {
    const rs = await client.execute("SELECT name FROM _migrations");
    for (const row of rs.rows) applied.add(String(row["name"]));
  } catch {
    // fresh db — nothing applied
  }
  for (const m of await listMigrations()) {
    if (applied.has(m.name)) continue;
    for (const stmt of splitStatements(m.sql)) {
      await client.execute(stmt);
    }
    await client.execute({
      sql: "INSERT OR IGNORE INTO _migrations (name, applied_at) VALUES (?, ?)",
      args: [m.name, Date.now()],
    });
  }
}

/** Open (or reuse) the app database. Pass an explicit path in tests. */
export async function openDatabase(dbPath?: string): Promise<Db> {
  const target = dbPath ?? dbFilePath();
  if (_db && _path === target) return _db;
  if (_db) await closeDatabase();
  await Deno.mkdir(dirname(target), { recursive: true });
  const client = createClient({ url: "file:" + target });
  await applyMigrations(client);
  _client = client;
  _path = target;
  _db = drizzle(client);
  return _db;
}

export function getDb(): Db {
  if (!_db) throw new Error("database not open — call openDatabase() first");
  return _db;
}

export async function closeDatabase(): Promise<void> {
  if (_client) {
    try {
      _client.close();
    } catch {
      // ignore
    }
  }
  _client = null;
  _db = null;
  _path = "";
}

/** Test helper: open an ephemeral DB under a fresh temp dir. */
export async function openEphemeralDatabase(): Promise<{ db: Db; dir: string; file: string }> {
  const dir = await Deno.makeTempDir({ prefix: "cc-test-" });
  const file = join(dir, "test.db");
  const db = await openDatabase(file);
  return { db, dir, file };
}
