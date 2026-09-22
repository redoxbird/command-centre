// Task: binding errors must never surface as "[object Object]" in the UI.
// Covers plain Errors, strings, bare objects, zod-style issues and nesting.
import { assert, assertEquals } from "jsr:@std/assert@^1";
import { rethrowAsError, toBindingError } from "../bindings.ts";

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

Deno.test("rethrowAsError always throws real Error instances", () => {
  // Bare objects (the old "[object Object]" source) become Errors, because
  // the desktop bridge String()s non-Error rejections on delivery.
  // NOTE: rethrowAsError throws synchronously — capture directly.
  const grab = (fn: () => never): unknown => {
    try {
      fn();
      return null;
    } catch (e) {
      return e;
    }
  };
  const e1 = grab(() => rethrowAsError({}, "probe"));
  assert(e1 instanceof Error, "must be an Error instance");
  assertEquals((e1 as Error).message, "Unknown error");

  // Real messages survive the round trip intact.
  const e2 = grab(() => rethrowAsError(new Error("disk full"), "probe"));
  assert(e2 instanceof Error);
  assertEquals((e2 as Error).message, "disk full");

  // Structured causes are flattened into the message.
  const e3 = grab(() => rethrowAsError({ code: "E_FAIL", detail: "bad disk" }, "probe"));
  assert(e3 instanceof Error);
  const m3 = (e3 as Error).message;
  assert(m3.includes("E_FAIL") && m3.includes("bad disk"), m3);
  for (const m of [(e1 as Error).message, (e2 as Error).message, m3]) {
    assert(!m.includes("[object Object]"), m);
  }
});
