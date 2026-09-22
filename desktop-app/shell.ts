// Shell registry — task D1.
// The resolved line is passed to the shell's own -Command/-lc flag so the
// shell parses it exactly once. Never build an argv array from a split string.
import { spawnSync } from "node:child_process";
import { join } from "std/path";
import type { ShellId } from "./types.ts";

export interface ShellInfo {
  id: ShellId;
  label: string;
  /** Served from /icons/ (design/icons/*.svg vendored into static/). */
  icon: string;
  bin: string;
}

export const SHELLS: Record<ShellId, ShellInfo> = {
  powershell: { id: "powershell", label: "PowerShell", icon: "icons/powershell.svg", bin: "powershell.exe" },
  bash: { id: "bash", label: "Bash", icon: "icons/bash.svg", bin: "bash.exe" },
  ubuntu: { id: "ubuntu", label: "Ubuntu", icon: "icons/ubuntu.svg", bin: "wsl.exe" },
};

export const SHELL_ORDER: ShellId[] = ["powershell", "bash", "ubuntu"];

/** argv for the shell binary; `line` is always the LAST element. */
export function shellArgv(shell: ShellId, line: string): string[] {
  switch (shell) {
    case "powershell":
      return ["-NoLogo", "-NoProfile", "-Command", line];
    case "bash":
      return ["-lc", line];
    case "ubuntu":
      return ["-e", "bash", "-lc", line];
  }
}

async function probeWindows(bin: string): Promise<string | null> {
  try {
    // spawnSync + windowsHide (CREATE_NO_WINDOW): Deno.Command flashes a
    // console window on every probe — this runs on each page load.
    const r = spawnSync("where.exe", [bin], {
      windowsHide: true,
      encoding: "utf8",
      timeout: 10000,
    });
    if (r.status !== 0) return null;
    const first = String(r.stdout || "").split(/\r?\n/).map((s) => s.trim()).find(Boolean);
    return first ?? null;
  } catch {
    return null;
  }
}

async function probePosix(bin: string): Promise<string | null> {
  try {
    // Strip any .exe suffix for non-Windows PATH lookups.
    const name = bin.replace(/\.exe$/i, "");
    const cmd = new Deno.Command("/bin/sh", {
      args: ["-c", `command -v ${name}`],
      stdout: "piped",
      stderr: "piped",
    });
    const r = await cmd.output();
    if (!r.success) return null;
    const first = new TextDecoder().decode(r.stdout).split("\n").map((s) => s.trim()).find(Boolean);
    return first ?? null;
  } catch {
    return null;
  }
}

/** Resolve the shell binary to an absolute path, or null when absent. */
export async function resolveBin(shell: ShellId): Promise<string | null> {
  const bin = SHELLS[shell].bin;
  if (Deno.build.os === "windows") return await probeWindows(bin);
  return await probePosix(bin);
}

export async function isShellAvailable(shell: ShellId): Promise<boolean> {
  return (await resolveBin(shell)) !== null;
}

/** Installed shells in SHELL_ORDER — the UI must offer exactly these. */
export async function probeInstalledShells(): Promise<ShellInfo[]> {
  const out: ShellInfo[] = [];
  for (const id of SHELL_ORDER) {
    if (await isShellAvailable(id)) out.push(SHELLS[id]);
  }
  return out;
}

// ── working-directory resolution ───────────────────────────────────────────
// Deno's permission sandbox cannot scope \\wsl.localhost UNC paths (it
// demands all-access), and node:child_process cannot use them as spawn cwd
// either — so WSL paths never touch Deno fs or spawn options. They are
// translated instead; Ubuntu runs get an explicit `cd … &&` prefix.

/** Windows drive path (C:\x or C:/x) → WSL form (/mnt/c/x). Null otherwise. */
export function toWslPath(windowsPath: string): string | null {
  const m = windowsPath.match(/^([a-zA-Z]):[\\/](.*)$/);
  if (!m) return null;
  return `/mnt/${m[1].toLowerCase()}/${m[2].replace(/\\/g, "/")}`;
}

/** Split a \\host\distro\rest UNC. Null when not a UNC path. */
export function fromWslHostUnc(p: string): { windows: string | null; wsl: string } | null {
  const m = p.match(/^\\\\[^\\/]+\\[^\\/]+(.*)$/);
  if (!m) return null;
  let rest = m[1].replace(/\\/g, "/");
  if (!rest.startsWith("/")) rest = "/" + rest;
  const dm = rest.match(/^\/mnt\/([a-zA-Z])(\/.*)?$/);
  if (dm) {
    const tail = (dm[2] ?? "").replace(/\//g, "\\").replace(/^\\/, "");
    return { windows: `${dm[1].toUpperCase()}:\\${tail}`, wsl: rest };
  }
  return { windows: null, wsl: rest };
}

export interface ResolvedCwd {
  /** cwd option for spawn; undefined = inherit (always paired with a prefix). */
  spawnCwd: string | undefined;
  /** Shell prefix guaranteeing the directory (Ubuntu only, else ""). */
  prefix: string;
  /** Windows-native form, or null for Linux-only paths. */
  windowsDir: string | null;
  /** WSL form (Ubuntu only), or null. */
  wslDir: string | null;
}

function quoteWsl(s: string): string {
  return `'${s.replace(/'/g, `'\\''`)}'`;
}

/**
 * Resolve a user-supplied working directory for a specific shell. Throws a
 * human-readable error for unusable combinations (e.g. a Linux-only path in
 * PowerShell) instead of letting spawn/Deno fail cryptically.
 */
export function resolveCwdForShell(shell: ShellId, cwd: string): ResolvedCwd {
  const trimmed = cwd.trim();
  const unc = fromWslHostUnc(trimmed);
  if (shell === "ubuntu") {
    let wslDir: string;
    let windowsDir: string | null;
    if (unc) {
      wslDir = unc.wsl;
      windowsDir = unc.windows;
    } else if (trimmed.startsWith("/")) {
      wslDir = trimmed;
      windowsDir = null;
    } else if (/^[a-zA-Z]:[\\/]/.test(trimmed)) {
      const w = toWslPath(trimmed);
      if (!w) throw new Error(`cannot use working directory in Ubuntu shell: ${cwd}`);
      wslDir = w;
      windowsDir = trimmed;
    } else if (/^[a-zA-Z]:/.test(trimmed)) {
      throw new Error(`cannot use drive-relative working directory in Ubuntu shell: ${cwd}`);
    } else {
      // Relative: resolve against the desktop process cwd, then translate.
      const w = toWslPath(join(Deno.cwd(), trimmed));
      if (!w) throw new Error(`cannot use working directory in Ubuntu shell: ${cwd}`);
      wslDir = w;
      windowsDir = null;
    }
    return { spawnCwd: undefined, prefix: `cd ${quoteWsl(wslDir)} && `, windowsDir, wslDir };
  }
  // powershell / bash run as Windows binaries: they need a Windows directory.
  if (unc) {
    if (!unc.windows) {
      throw new Error(
        `working directory is a Linux-only path with no Windows form: ${cwd} — switch the command to the Ubuntu shell`,
      );
    }
    return { spawnCwd: unc.windows, prefix: "", windowsDir: unc.windows, wslDir: unc.wsl };
  }
  return { spawnCwd: trimmed, prefix: "", windowsDir: trimmed, wslDir: null };
}

/** Hidden `test -d` probe inside WSL (mirrors the Deno-side existence check). */
export function checkWslDir(wslPath: string): boolean {
  try {
    const r = spawnSync("wsl.exe", ["-e", "bash", "-lc", `test -d ${quoteWsl(wslPath)}`], {
      windowsHide: true,
      timeout: 15000,
      stdio: "ignore",
    });
    return r.status === 0;
  } catch {
    return false;
  }
}
