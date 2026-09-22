// Task: binding errors must never surface as "[object Object]" in the UI.
// Covers plain Errors, strings, bare objects, zod-style issues and nesting.
import { assert, assertEquals } from "jsr:@std/assert@^1";
import { toBindingError } from "../bindings.ts";

function check(input: unknown): string {
  const r = toBindingError(input);
  assert(!r.message.includes("[object Object]"), `got ${r.message} for ${String(input)}`);
  assert(r.message.length > 0, "empty message");
  assertEquals(typeof r.name, "string");
  assertEquals(typeof r.stack, "string");
  return r.message;
}

Deno.test("toBindingError keeps real messages intact", () => {
  assertEquals(check(new Error("disk full")), "disk full");
  assertEquals(check("plain failure"), "plain failure");
  const r = toBindingError(new TypeError("bad type"));
  assertEquals(r.name, "TypeError");
  assertEquals(r.message, "bad type");
});

Deno.test("toBindingError degrades gracefully without .message", () => {
  assertEquals(check({}), "Unknown error");
  assertEquals(check(undefined), "Unknown error");
  assertEquals(check(null), "Unknown error");
  assertEquals(check(""), "Unknown error");
});

Deno.test("toBindingError extracts structured causes", () => {
  const z = check({ name: "ZodError", issues: [{ message: "name too short" }, { code: "custom" }] });
  assert(z.includes("name too short") && z.includes("custom"), z);
  const coded = check({ code: "ERR_SQLITE_ERROR", errstr: "SQL logic error" });
  assert(coded.includes("ERR_SQLITE_ERROR") && coded.includes("SQL logic error"), coded);
  const named = check({ name: "WeirdError" });
  assert(named.includes("WeirdError"), named);
});
