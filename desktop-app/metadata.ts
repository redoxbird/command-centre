// {id}.metadata.json sidecars — task C1.
// All command metadata (variables, values, shell, askMode, provenance)
// lives here. The DB row is the index only.
import { dirname, join } from "std/path";
import { defaultMetadata, MetadataDocSchema, type MetadataDoc } from "./types.ts";
import { appBaseDir } from "./db/db.ts";

export function sidecarDir(baseDir?: string): string {
  return join(baseDir ?? appBaseDir(), "commands");
}

export function sidecarPath(id: string, baseDir?: string): string {
  const safe = String(id ?? "").replace(/[^a-zA-Z0-9_-]+/g, "-");
  return join(sidecarDir(baseDir), `${safe}.metadata.json`);
}

/** Read + validate a sidecar. Missing → null. Corrupt → tolerant default. */
export async function readMetadata(
  id: string,
  baseDir?: string,
): Promise<MetadataDoc | null> {
  const path = sidecarPath(id, baseDir);
  let raw: string;
  try {
    raw = await Deno.readTextFile(path);
  } catch {
    return null;
  }
  try {
    const parsed = MetadataDocSchema.safeParse(JSON.parse(raw));
    if (parsed.success) return parsed.data;
  } catch {
    // fall through to tolerant default
  }
  // Corrupt file: never throw; return a default scoped to this id.
  return defaultMetadata(id);
}

export async function writeMetadata(
  id: string,
  doc: MetadataDoc,
  baseDir?: string,
): Promise<void> {
  const path = sidecarPath(id, baseDir);
  await Deno.mkdir(dirname(path), { recursive: true });
  const parsed = MetadataDocSchema.parse({ ...doc, id });
  const tmp = `${path}.tmp`;
  await Deno.writeTextFile(tmp, JSON.stringify(parsed, null, 2));
  await Deno.rename(tmp, path);
}

export async function removeMetadata(id: string, baseDir?: string): Promise<void> {
  try {
    await Deno.remove(sidecarPath(id, baseDir));
  } catch {
    // already gone
  }
}

/** All sidecar ids present on disk (stem without .metadata.json). */
export async function listSidecarIds(baseDir?: string): Promise<string[]> {
  const out: string[] = [];
  try {
    for await (const e of Deno.readDir(sidecarDir(baseDir))) {
      if (e.isFile && e.name.endsWith(".metadata.json")) {
        out.push(e.name.slice(0, -".metadata.json".length));
      }
    }
  } catch {
    // no dir yet
  }
  return out.sort();
}
