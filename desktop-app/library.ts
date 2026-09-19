// Command library — task C3 (lean DB row + sidecar metadata).
// DB is the index (command/title/description/source_folder/tags);
// sidecars ({id}.metadata.json) hold variables/values/shell/askMode.
import { eq } from "drizzle-orm";
import { ensureUniqueCommandId, generateCommandId, isValidCommandId } from "./ids.ts";
import { getDb, openDatabase, type Db } from "./db/db.ts";
import { commands } from "./db/schema.ts";
import { readMetadata, removeMetadata, sidecarPath, writeMetadata } from "./metadata.ts";
import { DEFAULT_COMMANDS } from "./seeds.ts";
import {
  CommandRowSchema,
  defaultMetadata,
  LegacyCommandInputSchema,
  MetadataDocSchema,
  WireMetadataSchema,
  type CommandRow,
  type MetadataDoc,
} from "./types.ts";

export interface CommandRecord {
  row: CommandRow;
  metadata: MetadataDoc;
}

async function dbOrDefault(db?: Db): Promise<Db> {
  if (db) return db;
  try {
    return getDb();
  } catch {
    return await openDatabase();
  }
}

function toRow(r: typeof commands.$inferSelect): CommandRow {
  return CommandRowSchema.parse({
    id: r.id,
    command: r.command,
    title: r.title,
    description: r.description ?? "",
    source_folder: r.source_folder ?? "",
    tags: JSON.parse(r.tags ?? "[]"),
    created_at: r.created_at,
    updated_at: r.updated_at,
  });
}

function tagsToJson(tags: string[]): string {
  return JSON.stringify(tags);
}

/** Field mapping: old/design names → lean row. Tags always become string[]. */
export function mapToRowFields(input: Record<string, unknown>): {
  command: string;
  title: string;
  description: string;
  source_folder: string;
  tags: string[];
} {
  const p = LegacyCommandInputSchema.parse(input);
  const command = (p.command ?? p.cmd ?? "") as string;
  const title = (p.title ?? p.name ?? "") as string;
  const description = String(p.description ?? p.desc ?? "");
  const source_folder = String(p.source_folder ?? p.cwd ?? p.workingDirectory ?? "");
  let tags: string[] = [];
  const rawTags = p.tags ?? p.tag;
  if (Array.isArray(rawTags)) tags = rawTags.map(String).map((s) => s.trim()).filter(Boolean);
  else if (typeof rawTags === "string" && rawTags.trim() !== "") {
    tags = rawTags.split(",").map((s) => s.trim()).filter(Boolean);
  }
  if (!command) throw new Error("command is required");
  if (!title) throw new Error("title is required");
  return { command, title, description, source_folder, tags };
}

async function existingIds(db: Db): Promise<Set<string>> {
  const rows = await db.select({ id: commands.id }).from(commands);
  return new Set(rows.map((r) => r.id));
}

/** Seed when the commands table is empty. Idempotent. */
export async function ensureSeeded(db?: Db, baseDir?: string): Promise<number> {
  const d = await dbOrDefault(db);
  const rows = await d.select({ id: commands.id }).from(commands);
  if (rows.length > 0) return 0;
  const now = Date.now();
  for (const s of DEFAULT_COMMANDS) {
    await d.insert(commands).values({
      id: s.row.id,
      command: s.row.command,
      title: s.row.title,
      description: s.row.description,
      source_folder: s.row.source_folder,
      tags: tagsToJson(s.row.tags),
      created_at: now,
      updated_at: now,
    });
    await writeMetadata(s.row.id, { ...s.metadata, id: s.row.id }, baseDir);
  }
  return DEFAULT_COMMANDS.length;
}

export async function listCommands(db?: Db, baseDir?: string): Promise<CommandRecord[]> {
  const d = await dbOrDefault(db);
  await ensureSeeded(d, baseDir);
  const rows = await d.select().from(commands);
  const out: CommandRecord[] = [];
  for (const r of rows) {
    const row = toRow(r);
    const metadata = (await readMetadata(row.id, baseDir)) ?? defaultMetadata(row.id);
    out.push({ row, metadata });
  }
  out.sort((a, b) => a.row.title.localeCompare(b.row.title));
  return out;
}

export async function getCommand(
  id: string,
  db?: Db,
  baseDir?: string,
): Promise<CommandRecord | null> {
  const d = await dbOrDefault(db);
  const rows = await d.select().from(commands).where(eq(commands.id, id));
  if (rows.length === 0) return null;
  const row = toRow(rows[0]);
  const metadata = (await readMetadata(row.id, baseDir)) ?? defaultMetadata(row.id);
  return { row, metadata };
}

export interface SaveInput extends Record<string, unknown> {
  id?: string;
}

/** Insert or update by id. Missing/invalid id → fresh CVCV. Sidecar first, then DB. */
export async function saveCommand(
  input: SaveInput,
  metadataInput?: Partial<MetadataDoc>,
  db?: Db,
  baseDir?: string,
): Promise<CommandRecord> {
  const d = await dbOrDefault(db);
  const fields = mapToRowFields(input as Record<string, unknown>);
  const rawId = typeof input.id === "string" ? input.id : "";
  const ids = await existingIds(d);
  let id: string;
  let created_at: number;
  if (rawId && isValidCommandId(rawId)) {
    id = rawId;
    const prev = await d.select().from(commands).where(eq(commands.id, id));
    created_at = prev.length > 0 ? toRow(prev[0]).created_at : Date.now();
    ids.delete(id); // own id must not block ensureUniqueCommandId
    void ids;
  } else {
    id = ensureUniqueCommandId((c) => ids.has(c));
    created_at = Date.now();
  }
  const updated_at = Date.now();
  const prevMeta = (await readMetadata(id, baseDir)) ?? defaultMetadata(id);
  const merged = MetadataDocSchema.parse({
    ...prevMeta,
    ...(metadataInput ?? {}),
    id,
  });
  // Crash order: sidecar first, then DB.
  await writeMetadata(id, merged, baseDir);
  const rowValues = {
    id,
    command: fields.command,
    title: fields.title,
    description: fields.description,
    source_folder: fields.source_folder,
    tags: fields.tags,
    created_at,
    updated_at,
  };
  const prev = await d.select({ id: commands.id }).from(commands).where(eq(commands.id, id));
  const dbValues = { ...rowValues, tags: tagsToJson(rowValues.tags) };
  if (prev.length === 0) {
    await d.insert(commands).values(dbValues);
  } else {
    await d.update(commands).set({
      command: dbValues.command,
      title: dbValues.title,
      description: dbValues.description,
      source_folder: dbValues.source_folder,
      tags: dbValues.tags,
      updated_at,
    }).where(eq(commands.id, id));
  }
  return { row: CommandRowSchema.parse({ ...rowValues }), metadata: merged };
}

export async function removeCommand(id: string, db?: Db, baseDir?: string): Promise<void> {
  const d = await dbOrDefault(db);
  await d.delete(commands).where(eq(commands.id, id));
  await removeMetadata(id, baseDir);
}

export async function duplicateCommand(
  id: string,
  db?: Db,
  baseDir?: string,
): Promise<CommandRecord> {
  const found = await getCommand(id, db, baseDir);
  if (!found) throw new Error(`unknown command: ${id}`);
  const d = await dbOrDefault(db);
  const ids = await existingIds(d);
  const fresh = ensureUniqueCommandId((c) => ids.has(c));
  return await saveCommand(
    {
      id: fresh,
      command: found.row.command,
      title: `${found.row.title} (copy)`,
      description: found.row.description,
      source_folder: found.row.source_folder,
      tags: found.row.tags,
    },
    { ...found.metadata, id: fresh },
    d,
    baseDir,
  );
}

/** Case-insensitive substring over the 4 DB text fields (design semantics). */
export async function searchCommands(
  query: string,
  db?: Db,
  baseDir?: string,
): Promise<CommandRecord[]> {
  const all = await listCommands(db, baseDir);
  const q = query.trim().toLowerCase();
  if (!q) return all;
  return all.filter((c) =>
    [c.row.command, c.row.title, c.row.description, c.row.source_folder].some((f) =>
      f.toLowerCase().includes(q)
    )
  );
}

// ── values + shell (sidecar-backed; C6 bindings use these) ───────────────────
export async function getValues(id: string, baseDir?: string): Promise<Record<string, string>> {
  const m = (await readMetadata(id, baseDir)) ?? defaultMetadata(id);
  return { ...m.values };
}

export async function saveValues(
  id: string,
  values: Record<string, string>,
  baseDir?: string,
): Promise<void> {
  const prev = (await readMetadata(id, baseDir)) ?? defaultMetadata(id);
  await writeMetadata(id, { ...prev, id, values: { ...values } }, baseDir);
}

export async function clearValues(id: string, baseDir?: string): Promise<void> {
  await saveValues(id, {}, baseDir);
}

export async function getShell(id: string, baseDir?: string): Promise<string | null> {
  const m = (await readMetadata(id, baseDir)) ?? defaultMetadata(id);
  return m.shell ?? null;
}

export async function setShell(id: string, shell: string, baseDir?: string): Promise<void> {
  const prev = (await readMetadata(id, baseDir)) ?? defaultMetadata(id);
  await writeMetadata(
    id,
    { ...prev, id, shell: shell as MetadataDoc["shell"] },
    baseDir,
  );
}

// ── import / export (§1.4 wire format) ───────────────────────────────────────
export interface ExportDoc {
  filename: string;
  doc: Record<string, unknown>;
}

/** Build the §1.4 document (command/description/workingDirectory renames kept). */
export async function exportJson(
  id: string,
  db?: Db,
  baseDir?: string,
): Promise<ExportDoc> {
  const found = await getCommand(id, db, baseDir);
  if (!found) throw new Error(`unknown command: ${id}`);
  const doc: Record<string, unknown> = {
    app: "command-center",
    kind: "command-metadata",
    version: 2,
    exportedAt: new Date().toISOString(),
    id: found.row.id,
    name: found.row.title,
    description: found.row.description,
    command: found.row.command,
    workingDirectory: found.row.source_folder,
    tags: found.row.tags,
    askMode: found.metadata.askMode,
    variables: found.metadata.variables,
    values: found.metadata.values,
  };
  if (found.metadata.shell) doc["shell"] = found.metadata.shell;
  if (found.metadata.fromHub) doc["fromHub"] = found.metadata.fromHub;
  return { filename: `${found.row.id}.metadata.json`, doc };
}

export async function writeExportFile(
  id: string,
  dir: string,
  db?: Db,
  baseDir?: string,
): Promise<string> {
  const { filename, doc } = await exportJson(id, db, baseDir);
  const { join } = await import("std/path");
  const path = join(dir, filename);
  await Deno.writeTextFile(path, JSON.stringify(doc, null, 2));
  return path;
}

/** Accept a SavedCommand-ish object or a §1.4 metadata document. */
export async function importJson(
  data: unknown,
  db?: Db,
  baseDir?: string,
): Promise<CommandRecord> {
  const d = await dbOrDefault(db);
  const wire = WireMetadataSchema.parse(data);
  const obj = data as Record<string, unknown>;
  const isWire = wire.kind === "command-metadata" || typeof wire.command === "string";
  if (!isWire) {
    // Plain SavedCommand shape — must still carry a command template.
    const fields = mapToRowFields(obj);
    void fields;
  }
  const rowFields = mapToRowFields({
    command: wire.command ?? obj["cmd"],
    title: wire.name ?? obj["name"] ?? obj["title"],
    description: wire.description ?? obj["desc"],
    source_folder: wire.workingDirectory ?? obj["cwd"] ?? obj["source_folder"],
    tags: wire.tags ?? wire.tag ?? obj["tags"] ?? obj["tag"],
  });
  const ids = await existingIds(d);
  const LOTTERY = typeof wire.id === "string" && isValidCommandId(wire.id) && !ids.has(wire.id)
    ? wire.id
    : ensureUniqueCommandId((c) => ids.has(c));
  const variables = Array.isArray(wire.variables) ? wire.variables : [];
  const askMode = wire.askMode === "once" ? "once" : "every";
  return await saveCommand(
    { id: LOTTERY, ...rowFields },
    {
      id: LOTTERY,
      askMode: askMode as "every" | "once",
      variables: variables as MetadataDoc["variables"],
      fromHub: typeof obj["fromHub"] === "string" ? obj["fromHub"] as string : undefined,
    },
    d,
    baseDir,
  );
}

export { sidecarPath };
