// Emits static/grammar.js from grammar.ts. Run: deno task build:grammar
// STUB (Phase A): the real generator lands in Phase B (task B3).
// Writes a placeholder so pages load without a 404 until then.
const out = new URL("../static/grammar.js", import.meta.url);
await Deno.mkdir(new URL("../static/", import.meta.url), { recursive: true });
await Deno.writeTextFile(
  out,
  "// GENERATED STUB — replaced by scripts/build-grammar.ts in Phase B (task B3).\n"
  + "window.CCGrammar = window.CCGrammar || {};\n",
);
console.log("Wrote stub", out.href);
