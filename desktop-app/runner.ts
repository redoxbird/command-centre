// Real shell execution — task D2 (see §8.4).
// One run at a time. Spawns via node:child_process with windowsHide
// (console-flash suppression — Deno.Command has no such option in 2.9.x).
// Not a PTY: interactive prompts block; stderr is surfaced so the user sees why.
import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { RunRequestSchema, type RunRequest } from "./types.ts";
import { SHELLS, shellArgv } from "./shell.ts";

export interface OutputLine {
  stream: "stdout" | "stderr";
  text: string;
}

export interface RunProgress {
  running: boolean;
  /** Monotonic output cursor; pass back to fetch only new lines. */
  cursor: number;
  exitCode: number | null;
  signal: string | null;
  startedAt: number;
  /** Lines appended since the requested cursor (or tail when omitted). */
  lines: OutputLine[];
  /** OS pid while running (v1 extension for tree-kill verification). */
  pid: number | null;
}

export interface RunResult {
  exitCode: number | null;
  signal: string | null;
  cancelled: boolean;
  durationMs: number;
  output: OutputLine[];
  pid: number | null;
}

/** Capped ring buffer; oldest lines drop first. */
export const MAX_OUTPUT_LINES = 5000;

interface ActiveRun {
  child: ChildProcess;
  pid: number;
  startedAt: number;
  lines: OutputLine[];
  /** Total lines ever appended (monotonic cursor domain). */
  appended: number;
  /** Incomplete trailing line per stream, completed by the next chunk. */
  pending: Record<OutputLine["stream"], string>;
  cancelled: boolean;
  settle: (r: RunResult) => void;
  fail: (e: Error) => void;
  cancelTimer?: ReturnType<typeof setTimeout>;
  done: boolean;
}

let active: ActiveRun | null = null;
let lastCompleted: RunResult | null = null;

function pushLine(run: ActiveRun, stream: OutputLine["stream"], text: string): void {
  run.lines.push({ stream, text });
  run.appended++;
  while (run.lines.length > MAX_OUTPUT_LINES) run.lines.shift();
}

function append(run: ActiveRun, stream: OutputLine["stream"], chunk: string): void {
  const parts = (run.pending[stream] + chunk).split(/\r?\n/);
  // The last part may be an incomplete line — hold it for the next chunk.
  // (A trailing "" means the chunk ended exactly on a newline: no pending.)
  run.pending[stream] = parts.pop() ?? "";
  for (const text of parts) pushLine(run, stream, text);
}

/** Flush incomplete trailing lines at process end. */
function flushPending(run: ActiveRun): void {
  for (const stream of ["stdout", "stderr"] as const) {
    if (run.pending[stream] !== "") {
      pushLine(run, stream, run.pending[stream]);
      run.pending[stream] = "";
    }
  }
}

function bufferStart(run: ActiveRun): number {
  return run.appended - run.lines.length;
}

function finish(run: ActiveRun, partial: Omit<RunResult, "output" | "pid">): void {
  if (run.done) return;
  run.done = true;
  if (run.cancelTimer !== undefined) clearTimeout(run.cancelTimer);
  flushPending(run);
  const result: RunResult = {
    ...partial,
    output: [...run.lines],
    pid: run.pid,
  };
  lastCompleted = result;
  if (active === run) active = null;
  run.settle(result);
}

async function killTree(pid: number): Promise<void> {
  // Windows: taskkill the whole tree (/T) by force (/F), hidden
  // (Deno.Command would flash a console on every cancel).
  try {
    spawnSync("taskkill", ["/PID", String(pid), "/T", "/F"], {
      windowsHide: true,
      timeout: 15000,
      stdio: "ignore",
    });
  } catch {
    // best effort — the close handler still settles the run
  }
}

/**
 * Run a resolved command line in `req.cwd` under `req.shell`.
 * Rejects while another run is active, and refuses lines that still contain
 * an unresolved {{token}} unless allowUnresolved is set. Always rejects
 * (never throws synchronously) so binding callers see uniform errors.
 */
export async function runCommand(req: RunRequest): Promise<RunResult> {
  const parsed = RunRequestSchema.parse(req);
  if (active) throw new Error("a command is already running — cancel it first");
  if (!parsed.allowUnresolved && parsed.line.includes("{{")) {
    throw new Error("refusing to run: unresolved {{input …}} token in command line");
  }
  const shell = SHELLS[parsed.shell];
  const startedAt = Date.now();

  return new Promise<RunResult>((resolve, reject) => {
    const run: ActiveRun = {
      child: undefined as unknown as ChildProcess,
      pid: -1,
      startedAt,
      lines: [],
      appended: 0,
      pending: { stdout: "", stderr: "" },
      cancelled: false,
      settle: resolve,
      fail: (e: Error) => {
        if (active === run) active = null;
        reject(e);
      },
      done: false,
    };
    let child: ChildProcess;
    try {
      child = spawn(shell.bin, shellArgv(parsed.shell, parsed.line), {
        cwd: parsed.cwd,
        windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch (e) {
      run.fail(e instanceof Error ? e : new Error(String(e)));
      return;
    }
    run.child = child;
    run.pid = child.pid ?? -1;
    active = run;

    child.stdout?.on("data", (d: unknown) => append(run, "stdout", String(d)));
    child.stderr?.on("data", (d: unknown) => append(run, "stderr", String(d)));
    child.on("error", (e: Error) => {
      run.fail(new Error(`failed to start ${shell.bin} in ${parsed.cwd}: ${e.message}`));
    });
    child.on("close", (code: number | null, signal: NodeJS.Signals | null) => {
      finish(run, {
        exitCode: code,
        signal: signal ? String(signal) : null,
        cancelled: run.cancelled,
        durationMs: Date.now() - startedAt,
      });
    });
  });
}

/**
 * Polled by the frontend (~250 ms) while running. Pass the previous cursor
 * to receive only new lines; omitting it returns the current tail.
 */
export function getRunProgress(cursor?: number): RunProgress | null {
  if (active) {
    const from = cursor ?? Math.max(0, active.appended - 200);
    const start = Math.max(from, bufferStart(active));
    return {
      running: true,
      cursor: active.appended,
      exitCode: null,
      signal: null,
      startedAt: active.startedAt,
      lines: active.lines.slice(start - bufferStart(active)),
      pid: active.pid,
    };
  }
  if (lastCompleted) {
    return {
      running: false,
      cursor: lastCompleted.output.length,
      exitCode: lastCompleted.exitCode,
      signal: lastCompleted.signal,
      startedAt: 0,
      lines: [],
      pid: null,
    };
  }
  return null;
}

/** Kill the process TREE (taskkill /T /F); the run settles cancelled:true. */
export async function cancelRun(): Promise<void> {
  const run = active;
  if (!run) return;
  run.cancelled = true;
  if (run.pid > 0) await killTree(run.pid);
  // If the close event never arrives (already reaped), settle defensively.
  run.cancelTimer = setTimeout(() => {
    finish(run, {
      exitCode: null,
      signal: null,
      cancelled: true,
      durationMs: Date.now() - run.startedAt,
    });
  }, 3000);
}
