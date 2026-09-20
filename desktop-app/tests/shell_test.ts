// Task D1: shell registry + probe.
import { assert, assertEquals } from "jsr:@std/assert@^1";
import {
  isShellAvailable,
  probeInstalledShells,
  resolveBin,
  SHELL_ORDER,
  SHELLS,
  shellArgv,
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
