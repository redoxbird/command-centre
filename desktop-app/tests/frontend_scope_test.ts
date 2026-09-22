// Guards the app.js IIFE scoping contract: helpers defined in the first
// (core) IIFE must only be called bare inside it; every later component IIFE
// must go through window.__cc (CC.*). A bare call outside core is a
// guaranteed ReferenceError in the browser (e.g. runFlow's former
// `CC.errorMessage` in reverse — an undefined bare name).
import { assertEquals } from "jsr:@std/assert@^1";

const CORE_HELPERS = [
  "termShow",
  "termAppend",
  "termNote",
  "termPlaceholder",
  "wireTermActions",
  "trackValidity",
  "gateScope",
  "safeValidate",
  "quickCheck",
  "refreshValidity",
  "buildVarControl",
  "collectInputs",
  "showBad",
  "runFlow",
  "restoreRunButtons",
  "errorMessage",
  "paintCmdline",
  "paintPrompt",
  "cycleShell",
  "shellFor",
  "humanize",
  "metaLabel",
  "originOf",
  "matchMeta",
];

Deno.test("no bare core-helper calls outside the core IIFE", async () => {
  const src = await Deno.readTextFile(new URL("../static/app.js", import.meta.url));
  const lines = src.split("\n");
  const bounds: number[] = [];
  lines.forEach((l, i) => {
    if (/^}\)\(\);$/.test(l)) bounds.push(i + 1);
  });
  assertEquals(bounds.length > 1, true, "expected multiple IIFEs");
  const bad: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (i + 1 <= bounds[0]) continue; // core region: bare calls are fine
    const l = lines[i];
    for (const fn of CORE_HELPERS) {
      const re = new RegExp(`(^|[^.\\w])${fn}\\s*\\(`, "g");
      let m: RegExpExecArray | null;
      while ((m = re.exec(l))) {
        const before = l.slice(Math.max(0, m.index - 12), m.index + 1);
        if (/CC\.|window\.__cc/.test(before)) continue;
        // `function NAME(` definitions and `async NAME(` methods are declarations.
        if (/^\s*(async\s+)?function\s+/.test(l) || new RegExp(`^\\s*(async\\s+)?${fn}\\s*\\(`).test(l)) continue;
        bad.push(`line ${i + 1}: bare ${fn}() — ${l.trim().slice(0, 80)}`);
      }
    }
  }
  assertEquals(bad, []);
});
