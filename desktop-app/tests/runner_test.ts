// Task D3: runner against real shells (powershell.exe; bash.exe when present).
// Requires --allow-run (in the deno task test flags) or these fail NotCapable.
import { assert, assertEquals, assertRejects } from "jsr:@std/assert@^1";
import { isShellAvailable } from "../shell.ts";
import { cancelRun, getRunProgress, runCommand } from "../runner.ts";

async function tempCwd(): Promise<string> {
  return await Deno.makeTempDir({ prefix: "cc-run-" });
}

async function pidAlive(pid: number): Promise<boolean> {
  try {
    const cmd = new Deno.Command("tasklist", {
      args: ["/FI", `PID eq ${pid}`, "/FO", "CSV", "/NH"],
      stdout: "piped",
      stderr: "piped",
    });
    const r = await cmd.output();
    const out = new TextDecoder().decode(r.stdout);
    return !out.includes("No tasks");
  } catch {
    return false;
  }
}

Deno.test("echo yields stdout, exit 0, not cancelled", async () => {
  const cwd = await tempCwd();
  try {
    const r = await runCommand({
      commandId: "sami-siru-sona",
      shell: "powershell",
      cwd,
      line: "Write-Output hello-runner",
    });
    assertEquals(r.exitCode, 0);
    assertEquals(r.cancelled, false);
    assert(r.output.some((l) => l.stream === "stdout" && l.text.includes("hello-runner")));
    assert(r.durationMs >= 0);
  } finally {
    await Deno.remove(cwd, { recursive: true }).catch(() => {});
  }
});

Deno.test("cwd is honored", async () => {
  const cwd = await tempCwd();
  try {
    const r = await runCommand({
      commandId: "sami-siru-sona",
      shell: "powershell",
      cwd,
      line: "(Get-Location).Path",
    });
    assertEquals(r.exitCode, 0);
    const got = r.output.map((l) => l.text).join("\n").toLowerCase();
    assert(got.includes(cwd.toLowerCase()), `cwd ${cwd} not in ${got}`);
  } finally {
    await Deno.remove(cwd, { recursive: true }).catch(() => {});
  }
});

Deno.test("non-zero exit code is reported", async () => {
  const cwd = await tempCwd();
  try {
    const r = await runCommand({
      commandId: "sami-siru-sona",
      shell: "powershell",
      cwd,
      line: "exit 3",
    });
    assertEquals(r.exitCode, 3);
    assertEquals(r.cancelled, false);
  } finally {
    await Deno.remove(cwd, { recursive: true }).catch(() => {});
  }
});

Deno.test("stderr is captured with its stream", async () => {
  const cwd = await tempCwd();
  try {
    const r = await runCommand({
      commandId: "sami-siru-sona",
      shell: "powershell",
      cwd,
      line: "[Console]::Error.WriteLine('oops-here')",
    });
    assert(r.output.some((l) => l.stream === "stderr" && l.text.includes("oops-here")));
  } finally {
    await Deno.remove(cwd, { recursive: true }).catch(() => {});
  }
});

Deno.test("missing working directory is refused with a clear message", async () => {
  const err = await runCommand({
    commandId: "sami-siru-sona",
    shell: "powershell",
    cwd: "C:\\does-not-exist-xyz-123",
    line: "echo hi",
  }).then(
    () => null,
    (e: unknown) => e,
  );
  assert(err instanceof Error, "expected a rejection");
  assert(err.message.includes("working directory does not exist"), err.message);
  assert(err.message.includes("C:\\does-not-exist-xyz-123"), err.message);
});

Deno.test("unresolved {{token}} is refused with a visible message", async () => {
  const cwd = await tempCwd();
  try {
    await assertRejects(
      () =>
        runCommand({
          commandId: "sami-siru-sona",
          shell: "powershell",
          cwd,
          line: "echo {{input.text}}",
        }),
      Error,
      "unresolved",
    );
    // ...unless explicitly allowed (then the shell sees it literally).
    const r = await runCommand({
      commandId: "sami-siru-sona",
      shell: "powershell",
      cwd,
      line: "echo {{input.text}}",
      allowUnresolved: true,
    });
    assertEquals(r.exitCode, 0);
  } finally {
    await Deno.remove(cwd, { recursive: true }).catch(() => {});
  }
});

Deno.test("second run while active is rejected", async () => {
  const cwd = await tempCwd();
  const base = { commandId: "sami-siru-sona", shell: "powershell" as const, cwd };
  const first = runCommand({ ...base, line: "ping -n 6 127.0.0.1" });
  try {
    await assertRejects(
      () => runCommand({ ...base, line: "echo nope" }),
      Error,
      "already running",
    );
  } finally {
    await cancelRun();
    await first;
    await Deno.remove(cwd, { recursive: true }).catch(() => {});
  }
});

Deno.test("progress polls incrementally by cursor", async () => {
  const cwd = await tempCwd();
  const p = runCommand({
    commandId: "sami-siru-sona",
    shell: "powershell",
    cwd,
    line: "ping -n 4 127.0.0.1",
  });
  try {
    // Wait for some output, then poll twice with the cursor.
    let prog = getRunProgress();
    assert(prog && prog.running, "expected a running progress");
    const pid = prog.pid;
    assert(pid !== null && pid > 0, "expected a pid while running");
    await new Promise((r) => setTimeout(r, 1500));
    prog = getRunProgress();
    assert(prog && prog.running);
    assert(prog.cursor > 0, "expected output by now");
    const tail = getRunProgress(prog.cursor);
    assert(tail && tail.running);
    assertEquals(tail.lines.length, 0, "no new lines immediately after cursor");
    assertEquals(tail.cursor, prog.cursor);
    await p;
    const done = getRunProgress();
    assert(done && !done.running, "expected completed progress after run");
  } finally {
    await cancelRun();
    await p.catch(() => {});
    await Deno.remove(cwd, { recursive: true }).catch(() => {});
  }
});

Deno.test("cancelling ping -t leaves no surviving process", async () => {
  const cwd = await tempCwd();
  const p = runCommand({
    commandId: "sami-siru-sona",
    shell: "powershell",
    cwd,
    line: "ping -t 127.0.0.1",
  });
  try {
    await new Promise((r) => setTimeout(r, 1500));
    const prog = getRunProgress();
    assert(prog && prog.running && prog.pid, "expected a running pid");
    const pid = prog.pid!;
    assert(await pidAlive(pid), "ping should be alive before cancel");
    await cancelRun();
    const r = await p;
    assertEquals(r.cancelled, true);
    // A tree-killed process never exits clean: exitCode is null (reaped) or
    // non-zero (taskkill reports 1). Either way it is not a clean exit.
    assert(r.exitCode !== 0, `expected non-clean exit, got ${r.exitCode}`);
    // Give the tree kill a beat, then assert the pid is gone.
    await new Promise((r2) => setTimeout(r2, 1500));
    assert(!(await pidAlive(pid)), `pid ${pid} survived cancellation`);
  } finally {
    await cancelRun();
    await p.catch(() => {});
    await Deno.remove(cwd, { recursive: true }).catch(() => {});
  }
});

Deno.test("bash: echo + exit code (skips cleanly when unavailable)", async () => {
  if (!(await isShellAvailable("bash"))) {
    console.log("skip: bash.exe unavailable");
    return;
  }
  const cwd = await tempCwd();
  try {
    const r = await runCommand({
      commandId: "sami-siru-sona",
      shell: "bash",
      cwd,
      line: "echo bash-here; pwd",
    });
    assertEquals(r.exitCode, 0);
    assert(r.output.some((l) => l.text.includes("bash-here")));
    const bad = await runCommand({
      commandId: "sami-siru-sona",
      shell: "bash",
      cwd,
      line: "exit 7",
    });
    assertEquals(bad.exitCode, 7);
  } finally {
    await Deno.remove(cwd, { recursive: true }).catch(() => {});
  }
});
