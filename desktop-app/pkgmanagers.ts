// Package manager probe + command builders — task N1.
// Pure builders/parsers only: installs execute through runner.ts runCommand
// (shared single-ActiveRun gate) and searches run through pkgSearch in
// bindings.ts, so this module never spawns an install itself. Probes use
// where.exe + windowsHide so no console window flashes (same reason as the
// probeWindows helper in shell.ts).
import { spawnSync } from "node:child_process";
import type { ManagerId } from "./types.ts";

export const MANAGER_ORDER: readonly ManagerId[] = ["winget", "scoop", "bun"];

export interface ManagerInfo {
  id: ManagerId;
  label: string;
  icon: string;
  /** Binary resolved with where.exe. */
  bin: string;
  /** bin + versionArgs prints the manager version on stdout. */
  versionArgs: string[];
  description: string;
}

export const MANAGERS: Record<ManagerId, ManagerInfo> = {
  winget: {
    id: "winget",
    label: "WinGet",
    icon: "icons/winget.svg",
    bin: "winget",
    versionArgs: ["--version"],
    description: "Windows Package Manager, bundled with Windows 11.",
  },
  scoop: {
    id: "scoop",
    label: "Scoop",
    icon: "icons/scoop.svg",
    bin: "scoop",
    versionArgs: ["--version"],
    description: "Command-line installer for portable dev tools.",
  },
  bun: {
    id: "bun",
    label: "Bun",
    icon: "icons/bun.svg",
    bin: "bun",
    versionArgs: ["--version"],
    description: "Fast JavaScript runtime; installs global JavaScript packages.",
  },
};

export interface ManagerProbe {
  id: ManagerId;
  label: string;
  icon: string;
  installed: boolean;
  version: string | null;
  path: string | null;
}

// Specs come from GUI text input and are embedded in a PowerShell line, so
// anything outside this set is rejected rather than escaped. Builders wrap
// every spec in double quotes; the set excludes quotes, $ and backticks, so
// the quoted form cannot break out of its argument.
const SAFE_SPEC = /^[A-Za-z0-9._/@:+=~-]+$/;

function checkedSpec(spec: string): string {
  const trimmed = spec.trim();
  if (!SAFE_SPEC.test(trimmed)) {
    throw new Error(`unsafe package spec: ${JSON.stringify(spec.slice(0, 60))}`);
  }
  return trimmed;
}

function quoted(spec: string): string {
  return `"${checkedSpec(spec)}"`;
}

/** Full PowerShell line for an install; runs via runCommand (shell powershell). */
export function buildInstallLine(manager: ManagerId, spec: string): string {
  switch (manager) {
    case "winget":
      return `winget install --id ${quoted(spec)} -e --silent --accept-package-agreements --accept-source-agreements`;
    case "scoop":
      return `scoop install ${quoted(spec)}`;
    case "bun":
      return `bun add -g ${quoted(spec)}`;
  }
}

/** Full PowerShell line for an uninstall; runs via runCommand (shell powershell). */
export function buildUninstallLine(manager: ManagerId, spec: string): string {
  switch (manager) {
    case "winget":
      return `winget uninstall --id ${quoted(spec)} -e --silent`;
    case "scoop":
      return `scoop uninstall ${quoted(spec)}`;
    case "bun":
      return `bun remove -g ${quoted(spec)}`;
  }
}

/**
 * argv for a package search (spawned synchronously, never through a shell,
 * so free-text queries are safe here). Bun has no registry search command;
 * `bun info` resolves an exact name to its registry record instead.
 */
export function buildSearchArgs(manager: ManagerId, query: string): string[] {
  const trimmed = query.trim();
  if (!trimmed) throw new Error("search query is required");
  switch (manager) {
    case "winget":
      return ["search", "--query", trimmed, "--source", "winget", "--accept-source-agreements"];
    case "scoop":
      return ["search", trimmed];
    case "bun":
      return ["info", trimmed, "--json"];
  }
}

/**
 * argv whose stdout answers "is spec installed" via isStatusHit (spawned
 * synchronously, never through a shell). Bun lists globals and the caller
 * matches the spec name inside that output.
 */
export function buildStatusArgs(manager: ManagerId, spec: string): string[] {
  switch (manager) {
    case "winget":
      return ["list", "--id", checkedSpec(spec), "-e", "--accept-source-agreements"];
    case "scoop":
      return ["list", checkedSpec(spec)];
    case "bun":
      return ["pm", "ls", "-g"];
  }
}

export interface WingetRow {
  name: string;
  id: string;
  version: string;
}

export interface ScoopRow {
  name: string;
  version: string;
  bucket: string;
}

export interface BunInfo {
  name: string;
  version: string;
  description: string;
}

function stringField(record: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value !== "") return value;
  }
  return null;
}

function wingetJsonRows(parsed: unknown): WingetRow[] | null {
  let items: unknown = parsed;
  if (!Array.isArray(items)) {
    if (items === null || typeof items !== "object" || !("Data" in items)) return null;
    items = items.Data;
  }
  if (!Array.isArray(items)) return null;
  const rows: WingetRow[] = [];
  for (const item of items) {
    if (item === null || typeof item !== "object") continue;
    if (!("Name" in item || "name" in item)) continue;
    const record = item as Record<string, unknown>;
    const name = stringField(record, ["Name", "name"]);
    const id = stringField(record, ["Id", "id", "PackageIdentifier"]);
    if (!name || !id) continue;
    rows.push({ name, id, version: stringField(record, ["Version", "version"]) ?? "" });
  }
  return rows;
}

function wingetTableRows(text: string): WingetRow[] {
  const rows: WingetRow[] = [];
  let dataStarted = false;
  for (const line of text.split(/\r?\n/)) {
    if (!dataStarted) {
      if (/^-{3,}(\s|$)/.test(line.trim())) dataStarted = true;
      continue;
    }
    if (line.trim() === "") continue;
    const columns = line.split(/\s{2,}/).map((column) => column.trim()).filter(Boolean);
    if (columns.length < 2) continue;
    const [name, id, version = ""] = columns;
    if (!name || !id) continue;
    rows.push({ name, id, version });
  }
  return rows;
}

/**
 * Parse `winget search` stdout. Accepts the JSON shape when a newer winget
 * emits it ({ Data: [...] } or a bare array) and the classic aligned table
 * otherwise (header row, dash separator row, one package per line with 2+
 * spaces between columns).
 */
export function parseWingetSearch(stdout: string): WingetRow[] {
  const text = String(stdout ?? "");
  const trimmed = text.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const rows = wingetJsonRows(JSON.parse(trimmed));
      if (rows) return rows;
    } catch {
      // Not JSON after all — fall through to table parsing.
    }
  }
  return wingetTableRows(text);
}

/**
 * Parse `scoop search` stdout: `'bucket' bucket:` section headers followed
 * by `name (version)` lines (trailing `---> includes ...` hints ignored).
 */
export function parseScoopSearch(stdout: string): ScoopRow[] {
  const rows: ScoopRow[] = [];
  let bucket = "";
  for (const line of String(stdout ?? "").split(/\r?\n/)) {
    const bucketMatch = line.match(/^'([^']+)'\s+bucket:/);
    if (bucketMatch) {
      bucket = bucketMatch[1];
      continue;
    }
    const appMatch = line.match(/^\s{2,}(\S+)\s+\(([^)]+)\)/);
    if (appMatch) {
      rows.push({ name: appMatch[1], version: appMatch[2].trim(), bucket });
    }
  }
  return rows;
}

/** Parse `bun info <name> --json` stdout; null when the record is unusable. */
export function parseBunInfo(stdout: string): BunInfo | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(String(stdout ?? ""));
  } catch {
    return null;
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  if (!("name" in parsed)) return null;
  const record = parsed as Record<string, unknown>;
  const name = stringField(record, ["name"]);
  if (!name) return null;
  const distTags = "dist-tags" in record ? record["dist-tags"] : null;
  const latest = distTags !== null && typeof distTags === "object" && !Array.isArray(distTags)
    ? stringField(distTags as Record<string, unknown>, ["latest"])
    : null;
  return {
    name,
    version: stringField(record, ["version"]) ?? latest ?? "",
    description: stringField(record, ["description"]) ?? "",
  };
}

/**
 * Decide "installed" from buildStatusArgs stdout. Exit codes alone lie
 * (winget list can exit 0 with "No installed package found"), so match the
 * spec text: winget/scoop rows echo the id or name, bun globals print
 * `name` or `name@version` tokens.
 */
export function isStatusHit(manager: ManagerId, stdout: string, spec: string): boolean {
  const text = String(stdout ?? "").toLowerCase();
  const needle = checkedSpec(spec).toLowerCase();
  if (manager === "bun") {
    return text.split(/\s+/).some((token) => token === needle || token.startsWith(`${needle}@`));
  }
  return text.includes(needle);
}

function runHidden(bin: string, args: string[], timeoutMs = 15000): { status: number | null; stdout: string } {
  try {
    const result = spawnSync(bin, args, { windowsHide: true, encoding: "utf8", timeout: timeoutMs });
    return {
      status: typeof result.status === "number" ? result.status : null,
      stdout: String(result.stdout ?? ""),
    };
  } catch {
    return { status: null, stdout: "" };
  }
}

function whereBinary(bin: string): string | null {
  const found = Deno.build.os === "windows"
    ? runHidden("where.exe", [bin])
    : runHidden("/bin/sh", ["-c", `command -v ${bin}`]);
  if (Deno.build.os === "windows" && found.status !== 0) return null;
  return found.stdout.split(/\r?\n/).map((line) => line.trim()).find(Boolean) ?? null;
}

/** Probe all three managers in MANAGER_ORDER; synchronous (spawnSync). */
export function probeInstalledManagers(): ManagerProbe[] {
  return MANAGER_ORDER.map((id) => {
    const info = MANAGERS[id];
    const path = whereBinary(info.bin);
    if (!path) {
      return { id, label: info.label, icon: info.icon, installed: false, version: null, path: null };
    }
    const versionOut = runHidden(path, info.versionArgs);
    const version = versionOut.stdout.split(/\r?\n/).map((line) => line.trim()).find(Boolean) ?? null;
    return { id, label: info.label, icon: info.icon, installed: true, version, path };
  });
}
