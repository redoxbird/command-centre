// Binding surface — task C6 (Phase C slice) + D2 execution bindings.
// Bindings are the API (no HTTP routes for data). Every handler zod-parses
// its arguments; throws surface to the webview as {name, message, stack}.
// Values/shells are sidecar-backed (no command_values/shell_prefs tables).
// Execution (run/getRunProgress/cancelRun) delegates to runner.ts;
// hub/publish bodies land in Phase F (stubs here validate + report pending).
import { z } from "zod";
import { spawn, spawnSync } from "node:child_process";
import {
  buildInstallLine,
  buildSearchArgs,
  buildStatusArgs,
  buildUninstallLine,
  isStatusHit,
  MANAGERS,
  parseBunInfo,
  parseScoopSearch,
  parseWingetSearch,
  probeInstalledManagers,
} from "./pkgmanagers.ts";
import type { DesktopWindow } from "./main.ts";
import {
  AppSettingsSchema,
  CommandIdSchema,
  HubQuerySchema,
  PkgInstallSchema,
  PkgSearchSchema,
  SubmitRequestSchema,
} from "./types.ts";
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
import { probeInstalledShells } from "./shell.ts";
import { cancelRun, getRunProgress, runCommand, writeRunInput } from "./runner.ts";
import { APP_VERSION } from "./version.ts";
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

/** Shape any thrown value into a {name, message, stack} triple for
 * rethrowAsError. Backend rejections do not always carry .message (bare
 * objects, bridge artifacts) — String() of those is "[object Object]".
 * This never returns that string. */
export function toBindingError(e: unknown): { name: string; message: string; stack: string } {
  if (e === null || e === undefined) return { name: "Error", message: "Unknown error", stack: "" };
  if (typeof e === "string") {
    return { name: "Error", message: e || "Unknown error", stack: "" };
  }
  if (typeof e === "object") {
    const o = e as Record<string, unknown>;
    const stack = typeof o.stack === "string" ? o.stack : "";
    const name = typeof o.name === "string" && o.name ? o.name : "Error";
    if (typeof o.message === "string" && o.message) return { name, message: o.message, stack };
    // zod-style issues array
    if (Array.isArray(o.issues) && o.issues.length > 0) {
      const parts = (o.issues as unknown[]).map((i) => {
        if (i && typeof i === "object") {
          const m = (i as Record<string, unknown>).message;
          if (typeof m === "string" && m) return m;
          const c = (i as Record<string, unknown>).code;
          if (typeof c === "string") return c;
        }
        return null;
      }).filter((p): p is string => p !== null);
      if (parts.length > 0) return { name, message: parts.join("; "), stack };
    }
    // named fields before falling back to JSON
    const bits: string[] = [];
    for (const k of ["code", "errstr", "detail", "hint", "reason"]) {
      const v = o[k];
      if (typeof v === "string" && v) bits.push(k === "code" ? v : `${k}: ${v}`);
    }
    if (bits.length > 0) return { name, message: bits.join(" · "), stack };
    try {
      const s = JSON.stringify(o);
      if (s && s !== "{}") return { name, message: s, stack };
    } catch {
      // fall through
    }
  }
  const s = String(e);
  return { name: "Error", message: s && s !== "[object Object]" ? s : "Unknown error", stack: "" };
}

/**
 * Re-throw any failure as a real Error instance carrying the shaped message.
 * The desktop bridge String()s non-Error rejections, which used to surface
 * every backend failure in the webview as "Error: [object Object]" no matter
 * what the original message was. Throwing Error instances keeps messages
 * intact across the boundary. Exported for tests.
 */
export function rethrowAsError(e: unknown, binding: string): never {
  const shaped = toBindingError(e);
  const err = new Error(shaped.message);
  err.name = shaped.name;
  // Preserve the original server stack when present; otherwise the fresh
  // capture below still pinpoints the failing binding.
  if (shaped.stack) {
    try {
      err.stack = shaped.stack;
    } catch {
      // non-writable stack (frozen Error subclass) — keep the fresh one
    }
  }
  console.error(`binding "${binding}" failed:`, e);
  throw err;
}

export function registerBindings(win: DesktopWindow): void {
  const bind = (name: string, handler: (...args: unknown[]) => unknown) => {
    win.bind(name, (async (...args: unknown[]) => {
      try {
        return await handler(...args);
      } catch (e) {
        throw rethrowAsError(e, name);
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
  bind("writeRunInput", async (data: unknown) => {
    const d = z.string().min(1).max(4096).parse(data);
    return writeRunInput(d);
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
  // ── package managers (N2; installs run through runner.ts) ───────────────
  bind("pmList", async () => probeInstalledManagers());
  bind("pkgSearch", async (req: unknown) => {
    const { manager, query } = PkgSearchSchema.parse(req);
    const info = MANAGERS[manager];
    // where.exe resolution doubles as the installed check (same as shell.ts).
    const probe = probeInstalledManagers().find((found) => found.id === manager);
    if (!probe || !probe.installed || !probe.path) {
      throw err("NotInstalled", `${info.label} is not installed`);
    }
    try {
      const found = spawnSync(probe.path, buildSearchArgs(manager, query), {
        windowsHide: true,
        encoding: "utf8",
        timeout: 60000,
      });
      if (found.error) throw found.error;
      if (found.status !== 0) {
        throw err("SearchFailed", `${info.label} search failed (exit ${found.status ?? "?"})`);
      }
      const stdout = String(found.stdout ?? "");
      if (manager === "winget") return parseWingetSearch(stdout).slice(0, 50);
      if (manager === "scoop") return parseScoopSearch(stdout).slice(0, 50);
      const single = parseBunInfo(stdout);
      return single ? [single] : [];
    } catch (e) {
      if (e instanceof Error && (e.name === "NotInstalled" || e.name === "SearchFailed")) throw e;
      throw err("SearchFailed", e instanceof Error ? e.message : String(e));
    }
  });
  bind("pkgInstall", async (req: unknown) => {
    const { manager, spec } = PkgInstallSchema.parse(req);
    return await runCommand({
      commandId: `pkg:${manager}:${spec}`,
      shell: "powershell",
      cwd: Deno.cwd(),
      line: buildInstallLine(manager, spec),
      allowUnresolved: false,
    });
  });
  bind("pkgUninstall", async (req: unknown) => {
    const { manager, spec } = PkgInstallSchema.parse(req);
    return await runCommand({
      commandId: `pkg:${manager}:${spec}`,
      shell: "powershell",
      cwd: Deno.cwd(),
      line: buildUninstallLine(manager, spec),
      allowUnresolved: false,
    });
  });
  bind("pkgStatus", async (req: unknown) => {
    const { manager, spec } = PkgInstallSchema.parse(req);
    const probe = probeInstalledManagers().find((found) => found.id === manager);
    if (!probe || !probe.installed || !probe.path) {
      return { installed: false, managerInstalled: false };
    }
    try {
      const found = spawnSync(probe.path, buildStatusArgs(manager, spec), {
        windowsHide: true,
        encoding: "utf8",
        timeout: 30000,
      });
      if (found.error) throw found.error;
      return {
        installed: isStatusHit(manager, String(found.stdout ?? ""), spec),
        managerInstalled: true,
      };
    } catch {
      return { installed: false, managerInstalled: true };
    }
  });
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
