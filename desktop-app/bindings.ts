// Binding surface — task C6 (Phase C slice) + D2 execution bindings.
// Bindings are the API (no HTTP routes for data). Every handler zod-parses
// its arguments; throws surface to the webview as {name, message, stack}.
// Values/shells are sidecar-backed (no command_values/shell_prefs tables).
// Execution (run/getRunProgress/cancelRun) delegates to runner.ts;
// hub/publish bodies land in Phase F (stubs here validate + report pending).
import { z } from "zod";
import { spawn } from "node:child_process";
import type { DesktopWindow } from "./main.ts";
import { APP_VERSION } from "./version.ts";
import { CommandIdSchema, HubQuerySchema, SubmitRequestSchema } from "./types.ts";
import { openDatabase } from "./db/db.ts";
import { appBaseDir } from "./db/db.ts";
import {
  duplicateCommand,
  exportJson,
  getCommand,
  getShell as libGetShell,
  getValues as libGetValues,
  importJson,
  listCommands,
  removeCommand,
  saveCommand,
  saveValues as libSaveValues,
  clearValues as libClearValues,
  setShell as libSetShell,
  writeExportFile,
} from "./library.ts";
import { loadSettings, saveSettings } from "./settings.ts";
import { AppSettingsSchema } from "./types.ts";
import { probeInstalledShells } from "./shell.ts";
import { cancelRun, getRunProgress, runCommand } from "./runner.ts";
import { join } from "std/path";

const IdArg = z.object({ id: z.string().min(1) });
const CommandIdArg = z.object({ commandId: CommandIdSchema });

function err(name: string, message: string): Error {
  const e = new Error(message);
  e.name = name;
  return e;
}

async function platformShells(): Promise<{ id: string; label: string; icon: string }[]> {
  const found = await probeInstalledShells();
  return found.map(({ id, label, icon }) => ({ id, label, icon }));
}

async function pickFolderNative(): Promise<string | null> {
  // Compressy pattern: FolderBrowserDialog via a hidden PowerShell
  // subprocess (node honors windowsHide; Deno.Command would flash a console).
  // The CEF webview cannot reveal absolute paths through <input type=file>.
  try {
    const ps = `Add-Type -AssemblyName System.Windows.Forms; $d = New-Object System.Windows.Forms.FolderBrowserDialog; $d.ShowDialog() | Out-Null; $d.SelectedPath`;
    const out = await runHidden(ps);
    return out || null;
  } catch {
    return null;
  }
}

async function pickFileNative(filter: string): Promise<string | null> {
  try {
    const ps = `Add-Type -AssemblyName System.Windows.Forms; $d = New-Object System.Windows.Forms.OpenFileDialog; $d.Filter = "${String(filter || "All files (*.*)|*.*").replace(/"/g, "")}"; $d.ShowDialog() | Out-Null; $d.FileName`;
    const out = await runHidden(ps);
    return out || null;
  } catch {
    return null;
  }
}

/** Run a PowerShell snippet with no console window; resolve trimmed stdout. */
function runHidden(ps: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const proc = spawn(
      "powershell.exe",
      ["-NoLogo", "-NoProfile", "-NonInteractive", "-Command", ps],
      { windowsHide: true, windowsVerbatimArguments: false },
    );
    let out = "";
    proc.stdout.on("data", (d: unknown) => {
      out += String(d);
    });
    proc.on("error", (e: Error) => reject(e));
    proc.on("close", () => resolve(out.trim()));
  });
}

export function registerBindings(win: DesktopWindow): void {
  const bind = (name: string, handler: (...args: unknown[]) => unknown) => {
    win.bind(name, (async (...args: unknown[]) => {
      try {
        return await handler(...args);
      } catch (e) {
        const error = e as Error;
        throw { name: error.name ?? "Error", message: error.message ?? String(e), stack: error.stack ?? "" };
      }
    }) as (...args: unknown[]) => unknown);
  };

  // ── app ────────────────────────────────────────────────────────────────
  bind("getVersion", async () => APP_VERSION);
  bind("getPlatform", async () => ({
    os: Deno.build.os,
    arch: Deno.build.arch,
    shells: await platformShells(),
  }));

  // ── library ────────────────────────────────────────────────────────────
  bind("listCommands", async () => {
    await openDatabase();
    const all = await listCommands();
    return all.map((c) => ({
      id: c.row.id,
      name: c.row.title,
      cmd: c.row.command,
      desc: c.row.description,
      tag: c.row.tags[0] ?? "custom",
      tags: c.row.tags,
      cwd: c.row.source_folder,
      askMode: c.metadata.askMode,
      custom: c.metadata.custom,
      fromHub: c.metadata.fromHub ?? undefined,
      variables: c.metadata.variables,
    }));
  });
  bind("getCommand", async (id: unknown) => {
    const { id: cid } = IdArg.parse({ id });
    await openDatabase();
    const found = await getCommand(cid);
    if (!found) return null;
    return {
      id: found.row.id,
      name: found.row.title,
      cmd: found.row.command,
      desc: found.row.description,
      tag: found.row.tags[0] ?? "custom",
      tags: found.row.tags,
      cwd: found.row.source_folder,
      askMode: found.metadata.askMode,
      custom: found.metadata.custom,
      fromHub: found.metadata.fromHub ?? undefined,
      variables: found.metadata.variables,
    };
  });
  bind("saveCommand", async (cmd: unknown) => {
    await openDatabase();
    // Split sidecar-owned keys out of the row payload (additive: plain row
    // objects without them keep working).
    const obj = { ...(cmd as Record<string, unknown>) };
    const metaKeys = ["variables", "askMode", "shell", "values", "custom", "fromHub"];
    const meta: Record<string, unknown> = {};
    for (const k of metaKeys) {
      if (k in obj) {
        meta[k] = obj[k];
        delete obj[k];
      }
    }
    const rec = await saveCommand(obj, meta);
    return { id: rec.row.id };
  });
  bind("deleteCommand", async (id: unknown) => {
    const { id: cid } = IdArg.parse({ id });
    await openDatabase();
    await removeCommand(cid);
  });
  bind("duplicateCommand", async (id: unknown) => {
    const { id: cid } = IdArg.parse({ id });
    await openDatabase();
    const dup = await duplicateCommand(cid);
    return { id: dup.row.id };
  });
  bind("exportCommand", async (id: unknown) => {
    const { id: cid } = IdArg.parse({ id });
    await openDatabase();
    const dir = join(appBaseDir(), "exports");
    await Deno.mkdir(dir, { recursive: true });
    const path = await writeExportFile(cid, dir);
    return { path };
  });
  bind("importCommand", async (json: unknown) => {
    await openDatabase();
    const rec = await importJson(json);
    return { id: rec.row.id };
  });

  // ── values + shells (sidecars) ─────────────────────────────────────────
  bind("getValues", async (commandId: unknown) => {
    const { commandId: cid } = CommandIdArg.parse({ commandId });
    return await libGetValues(cid);
  });
  bind("saveValues", async (commandId: unknown, v: unknown) => {
    const { commandId: cid } = CommandIdArg.parse({ commandId });
    const vals = z.record(z.string()).parse(v);
    await libSaveValues(cid, vals);
  });
  bind("clearValues", async (commandId: unknown) => {
    const { commandId: cid } = CommandIdArg.parse({ commandId });
    await libClearValues(cid);
  });
  bind("getShells", async () => {
    await openDatabase();
    const all = await listCommands();
    const out: Record<string, string> = {};
    for (const c of all) {
      if (c.metadata.shell) out[c.row.id] = c.metadata.shell;
    }
    return out;
  });
  bind("setShell", async (commandId: unknown, shell: unknown) => {
    const { commandId: cid } = CommandIdArg.parse({ commandId });
    const s = z.enum(["powershell", "bash", "ubuntu"]).parse(shell);
    await libSetShell(cid, s);
  });

  // ── execution (runner.ts; §8.4 — polled progress, tree kill) ────────────
  bind("run", async (req: unknown) => {
    return await runCommand(req as Parameters<typeof runCommand>[0]);
  });
  bind("getRunProgress", async (cursor: unknown) => {
    const c = cursor === undefined || cursor === null
      ? undefined
      : z.number().int().min(0).parse(cursor);
    return getRunProgress(c);
  });
  bind("cancelRun", async () => {
    await cancelRun();
  });

  // ── filesystem ─────────────────────────────────────────────────────────
  bind("pickFolder", async () => await pickFolderNative());
  bind("pickFile", async (filter: unknown) => {
    const f = z.string().default("").parse(filter);
    return await pickFileNative(f);
  });
  bind("openFolder", async (path: unknown) => {
    const p = z.string().min(1).parse(path);
    // NOTE: no windowsHide here — CREATE_NO_WINDOW would suppress explorer's
    // own window entirely (probe-verified in Compressy). Fire and forget.
    spawn("explorer.exe", [p]);
  });

  // ── hub / publish (Phase F bodies; validated stubs now) ────────────────
  const pending = (phase: string) => {
    throw err("NotImplemented", `${phase} lands in Phase F`);
  };
  bind("hubList", async (query: unknown) => {
    HubQuerySchema.parse(query ?? {});
    pending("hubList");
  });
  bind("hubRecents", async () => pending("hubRecents"));
  bind("hubInstall", async (pkg: unknown) => {
    z.object({ pkg: z.string().min(1) }).parse({ pkg });
    pending("hubInstall");
  });
  bind("hubAdd", async (commandId: unknown) => {
    z.object({ commandId: z.string().min(1) }).parse({ commandId });
    pending("hubAdd");
  });
  bind("hubRefresh", async () => pending("hubRefresh"));
  bind("publishExport", async (id: unknown) => {
    const { id: cid } = IdArg.parse({ id });
    await openDatabase();
    const { doc } = await exportJson(cid);
    return doc;
  });
  bind("publishSubmit", async (rec: unknown) => {
    SubmitRequestSchema.parse(rec);
    pending("publishSubmit");
  });
  bind("publishQueue", async () => {
    await openDatabase();
    return [];
  });

  // ── settings ───────────────────────────────────────────────────────────
  bind("loadSettings", async () => {
    await openDatabase();
    return await loadSettings();
  });
  bind("saveSettings", async (s: unknown) => {
    const parsed = AppSettingsSchema.parse(s);
    await openDatabase();
    await saveSettings(parsed);
  });
}
