// SQLite via drizzle (sqlite-proxy) over node:sqlite — task C1.
// NOTE: do NOT switch this to @libsql/client — its N-API native binding
// crashes the `deno desktop` backend at startup (neon "Failed to find N-API
// version" → laufey exit 0xc0000409). node:sqlite is runtime built-in.
//
// App-data root: LOCALAPPDATA → USERPROFILE → HOME → '.' , under
// "command-center/" (decision 4). DB file: command-center.db.
// migrate-on-open applies db/migrations/*.sql in lexicographic order.
import { DatabaseSync } from "node:sqlite";
import { drizzle, type SqliteRemoteDatabase } from "drizzle-orm/sqlite-proxy";
import { dirname, fromFileUrl, join } from "std/path";

export type Db = SqliteRemoteDatabase;

let _native: DatabaseSync | null = null;
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

function applyMigrations(native: DatabaseSync, files: { name: string; sql: string }[]): void {
  native.exec(
    "CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, applied_at INTEGER NOT NULL)",
  );
  const applied = new Set<string>();
  try {
    for (const row of native.prepare("SELECT name FROM _migrations").all() as { name: string }[]) {
      applied.add(row.name);
    }
  } catch {
    // fresh db — nothing applied
  }
  for (const m of files) {
    if (applied.has(m.name)) continue;
    for (const stmt of splitStatements(m.sql)) {
      native.exec(stmt);
    }
    native.prepare("INSERT OR IGNORE INTO _migrations (name, applied_at) VALUES (?, ?)").run(
      m.name,
      Date.now(),
    );
  }
}

/** Drizzle callback adapter over the synchronous node:sqlite handle. */
function callbackFor(native: DatabaseSync) {
  // NOTE: sqlite-proxy maps rows positionally (mapResultRow reads
  // row[columnIndex]), so every row must be a values ARRAY in SELECT order —
  // never an object. node:sqlite preserves SELECT column order in object key
  // order, hence Object.values().
  const toArray = (r: Record<string, unknown>) => Object.values(r);
  return async (sql: string, params: unknown[], method: "run" | "all" | "values" | "get") => {
    if (method === "run") {
      if (params.length === 0) native.exec(sql);
      else native.prepare(sql).run(...(params as never[]));
      return { rows: [] };
    }
    const stmt = native.prepare(sql);
    if (method === "get") {
      // sqlite-proxy unwraps a single row for 'get' (see mapGetResult).
      const row = stmt.get(...(params as never[])) as Record<string, unknown> | undefined;
      return { rows: (row ? toArray(row) : undefined) as unknown as unknown[] };
    }
    const rows = stmt.all(...(params as never[])) as Record<string, unknown>[];
    return { rows: rows.map(toArray) };
  };
}

/** Open (or reuse) the app database. Pass an explicit path in tests. */
export async function openDatabase(dbPath?: string): Promise<Db> {
  const target = dbPath ?? dbFilePath();
  if (_db && _path === target) return _db;
  if (_db) await closeDatabase();
  await Deno.mkdir(dirname(target), { recursive: true });
  const native = new DatabaseSync(target);
  applyMigrations(native, await listMigrations());
  _native = native;
  _path = target;
  _db = drizzle(callbackFor(native));
  return _db;
}

export function getDb(): Db {
  if (!_db) throw new Error("database not open — call openDatabase() first");
  return _db;
}

export async function closeDatabase(): Promise<void> {
  if (_native) {
    try {
      _native.close();
    } catch {
      // ignore
    }
  }
  _native = null;
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
