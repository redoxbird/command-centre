import { dirname, join } from "std/path";

export interface WindowGeometry {
  width?: number;
  height?: number;
  x?: number | null;
  y?: number | null;
}

/**
 * Stub geometry persistence so main.ts wires up in Phase A.
 * Real settings (DEFAULT_SETTINGS + load/save via the drizzle settings
 * table) land in Phase C (task C1).
 */
function geomPath(): string {
  const root = Deno.env.get("LOCALAPPDATA") ??
    Deno.env.get("USERPROFILE") ??
    Deno.env.get("HOME") ??
    ".";
  return join(root, "command-centre", "window.json");
}

export async function loadWindowGeometry(): Promise<WindowGeometry> {
  try {
    return JSON.parse(await Deno.readTextFile(geomPath()));
  } catch {
    return {};
  }
}

export async function saveWindowGeometry(g: WindowGeometry): Promise<void> {
  const p = geomPath();
  await Deno.mkdir(dirname(p), { recursive: true });
  const tmp = `${p}.tmp`;
  await Deno.writeTextFile(tmp, JSON.stringify(g));
  await Deno.rename(tmp, p);
}
