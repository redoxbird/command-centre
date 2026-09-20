// Shell registry — task D1.
// The resolved line is passed to the shell's own -Command/-lc flag so the
// shell parses it exactly once. Never build an argv array from a split string.
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
    const cmd = new Deno.Command("where.exe", {
      args: [bin],
      stdout: "piped",
      stderr: "piped",
    });
    const r = await cmd.output();
    if (!r.success) return null;
    const first = new TextDecoder().decode(r.stdout).split(/\r?\n/).map((s) => s.trim()).find(Boolean);
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
