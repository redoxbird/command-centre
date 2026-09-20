// Guards the learn.html reference skeleton (task E5).
// Rows render client-side from window.CCGrammar.CC_INPUT_TYPES (the same
// table Deno tests), so the page cannot drift from the 30-row registry.
// This task therefore asserts the tbody is populated by runtime output only:
// it must contain no hand-maintained <tr> rows. Run: deno task build:learn
import { dirname, join } from "std/path";

const dir = new URL(".", import.meta.url).pathname.replace(/^\//, "");
const htmlPath = join(dir, "..", "static", "learn.html");

const html = await Deno.readTextFile(htmlPath);
const m = html.match(/<tbody[^>]*id="rows"[^>]*>([\s\S]*?)<\/tbody>/);
if (!m) throw new Error("learn.html has no <tbody id=\"rows\"> skeleton");
const body = m[1].replace(/<!--[\s\S]*?-->/g, "").trim();
if (/<tr[\s>]/.test(body)) {
  throw new Error(
    "learn.html tbody contains hand-maintained rows — rows render client-side from CC_INPUT_TYPES; remove them",
  );
}
console.log("learn skeleton OK: tbody populated at runtime from the live registry");
export {};
