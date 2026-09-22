// Task D1: shell registry + probe.
import { assert, assertEquals } from "jsr:@std/assert@^1";
import {
  fromWslHostUnc,
  isShellAvailable,
  probeInstalledShells,
  resolveBin,
  resolveCwdForShell,
  SHELL_ORDER,
  SHELLS,
  shellArgv,
  toWslPath,
} from "../shell.ts";

Deno.test("registry has the three shells in order", () => {
  assertEquals(SHELL_ORDER, ["powershell", "bash", "ubuntu"]);
  assertEquals(SHELLS.powershell.label, "PowerShell");
  assertEquals(SHELLS.bash.label, "Bash");
  assertEquals(SHELLS.ubuntu.label, "Ubuntu");
  for (const id of SHELL_ORDER) {
    assert(SHELLS[id].icon.startsWith("icons/"), SHELLS[id].icon);
    assert(SHELLS[id].bin.length > 0);
  }
});

Deno.test("argv passes the resolved line to the shell's own flag, last", () => {
  const line = "echo hi";
  assertEquals(shellArgv("powershell", line), ["-NoLogo", "-NoProfile", "-Command", line]);
  assertEquals(shellArgv("bash", line), ["-lc", line]);
  assertEquals(shellArgv("ubuntu", line), ["-e", "bash", "-lc", line]);
});

Deno.test("probe: PowerShell present; results feed the UI offer list", async () => {
  assertEquals(await isShellAvailable("powershell"), true);
  assertEquals(typeof await isShellAvailable("bash"), "boolean");
  assertEquals(typeof await isShellAvailable("ubuntu"), "boolean");
  // resolveBin agrees with availability.
  for (const id of SHELL_ORDER) {
    const bin = await resolveBin(id);
    assertEquals((bin !== null), await isShellAvailable(id), id);
  }
  const offered = await probeInstalledShells();
  assert(offered.length >= 1, "at least one shell offered");
  assertEquals(offered[0].id, "powershell");
  for (const s of offered) {
    assert(SHELL_ORDER.includes(s.id), s.id);
  }
});

Deno.test("toWslPath translates drive paths, rejects the rest", () => {
  assertEquals(toWslPath("C:\\projects\\app"), "/mnt/c/projects/app");
  assertEquals(toWslPath("D:/x"), "/mnt/d/x");
  assertEquals(toWslPath("c:\\"), "/mnt/c/");
  assertEquals(toWslPath("/home/u"), null);
  assertEquals(toWslPath("relative\\dir"), null);
  assertEquals(toWslPath("\\\\wsl.localhost\\Ubuntu\\x"), null);
});

Deno.test("fromWslHostUnc splits host/distro/rest", () => {
  assertEquals(fromWslHostUnc("\\\\wsl.localhost\\Ubuntu\\mnt\\c\\projects\\app"), {
    windows: "C:\\projects\\app",
    wsl: "/mnt/c/projects/app",
  });
  assertEquals(fromWslHostUnc("\\\\wsl.localhost\\Ubuntu\\home\\ada"), {
    windows: null,
    wsl: "/home/ada",
  });
  assertEquals(fromWslHostUnc("C:\\projects\\app"), null);
  assertEquals(fromWslHostUnc("/mnt/c/x"), null);
});

Deno.test("resolveCwdForShell: ubuntu always gets a cd prefix, never a UNC", () => {
  const a = resolveCwdForShell("ubuntu", "C:\\projects\\app");
  assertEquals(a, {
    spawnCwd: undefined,
    prefix: "cd '/mnt/c/projects/app' && ",
    windowsDir: "C:\\projects\\app",
    wslDir: "/mnt/c/projects/app",
  });
  const b = resolveCwdForShell("ubuntu", "\\\\wsl.localhost\\Ubuntu\\mnt\\d\\work\\x");
  assertEquals(b.spawnCwd, undefined);
  assert(b.prefix.includes("/mnt/d/work/x"), b.prefix);
  assert(!b.prefix.includes("\\"), b.prefix);
  const c = resolveCwdForShell("ubuntu", "/home/ada");
  assertEquals(c, {
    spawnCwd: undefined,
    prefix: "cd '/home/ada' && ",
    windowsDir: null,
    wslDir: "/home/ada",
  });
});

Deno.test("resolveCwdForShell: windows shells map distro paths back, reject linux-only", () => {
  const a = resolveCwdForShell("powershell", "\\\\wsl.localhost\\Ubuntu\\mnt\\c\\projects\\app");
  assertEquals(a.spawnCwd, "C:\\projects\\app");
  assertEquals(a.prefix, "");
  let threw: unknown = null;
  try {
    resolveCwdForShell("powershell", "\\\\wsl.localhost\\Ubuntu\\home\\ada");
  } catch (e) {
    threw = e;
  }
  assert(threw instanceof Error, "expected a rejection");
  assert((threw as Error).message.includes("Ubuntu shell"), (threw as Error).message);
  const b = resolveCwdForShell("bash", "C:\\work");
  assertEquals(b, { spawnCwd: "C:\\work", prefix: "", windowsDir: "C:\\work", wslDir: null });
});
