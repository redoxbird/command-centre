// Task C4: widget → <e-input> mapping (no accidental default fallthrough).
import { assert, assertEquals } from "jsr:@std/assert@^1";
import {
  CC_INPUT_TYPES,
  CC_RETIRED_TYPES,
  lookupType,
  widgetToEInput,
} from "../registry.ts";

const REAL_TYPES = new Set([
  "text",
  "password",
  "number",
  "date",
  "color",
  "range",
  "select",
  "combobox",
  "radio",
  "checkbox-group",
  "checkbox",
  "textarea",
]);

Deno.test("every live token resolves to a real <e-input> type", () => {
  for (const [name, widget] of CC_INPUT_TYPES) {
    const m = widgetToEInput({ name, type: widget });
    assert(m, `${name} unmapped`);
    assert(REAL_TYPES.has(m!.type) || m!.type === "text", `${name} → ${m!.type}`);
  }
});

Deno.test("text-family format mapping", () => {
  assertEquals(widgetToEInput({ name: "input.text", type: "text" }), { type: "text" });
  assertEquals(widgetToEInput({ name: "input.email", type: "text" }), {
    type: "text",
    format: "email",
  });
  assertEquals(widgetToEInput({ name: "input.url", type: "text" }), {
    type: "text",
    format: "url",
  });
  assertEquals(widgetToEInput({ name: "input.search", type: "text" }), {
    type: "text",
    format: "search",
  });
  assertEquals(widgetToEInput({ name: "input.uuid", type: "text" }), {
    type: "text",
    format: "uuid",
  });
});

Deno.test("select family (7 lists) → select", () => {
  for (
    const n of [
      "input.select",
      "input.country",
      "input.timezone",
      "input.currency",
      "input.language",
      "input.locale",
      "input.license",
    ]
  ) {
    const r = lookupType(n)!;
    assertEquals(widgetToEInput({ name: n, type: r.row[1] })!.type, "select", n);
  }
});

Deno.test("file tokens → text + browse", () => {
  for (const n of ["input.file", "input.dir", "input.files"]) {
    assertEquals(widgetToEInput({ name: n, type: "file" }), {
      type: "text",
      actionButton: "browse",
    });
  }
});

Deno.test("remaining widget spot checks", () => {
  assertEquals(widgetToEInput({ name: "input.number", type: "number" })!.type, "number");
  assertEquals(widgetToEInput({ name: "input.port", type: "number" })!.type, "number");
  assertEquals(widgetToEInput({ name: "input.date", type: "date" })!.type, "date");
  assertEquals(widgetToEInput({ name: "input.time", type: "time" })!.type, "date");
  assertEquals(widgetToEInput({ name: "input.datetime", type: "datetime" })!.type, "date");
  assertEquals(widgetToEInput({ name: "input.color", type: "color" })!.type, "color");
  assertEquals(widgetToEInput({ name: "input.password", type: "password" })!.type, "password");
  assertEquals(widgetToEInput({ name: "input.radio", type: "radio" })!.type, "radio");
  assertEquals(widgetToEInput({ name: "input.buttongroup", type: "buttongroup" })!.type, "radio");
  assertEquals(widgetToEInput({ name: "input.multiselect", type: "multiselect" })!.type, "checkbox-group");
  assertEquals(widgetToEInput({ name: "input.checkbox", type: "checkbox" })!.type, "checkbox");
  assertEquals(widgetToEInput({ name: "input.switch", type: "switch" })!.type, "checkbox");
  assertEquals(widgetToEInput({ name: "input.range", type: "range" })!.type, "range");
  assertEquals(widgetToEInput({ name: "input.textarea", type: "textarea" })!.type, "textarea");
  const kv = widgetToEInput({ name: "input.keyvalue", type: "keyvalue" })!;
  assertEquals(kv.type, "text");
  assertEquals(kv.paired, true);
});

Deno.test("retired tokens resolve through the same table", () => {
  for (const [name, widget] of CC_RETIRED_TYPES) {
    const m = widgetToEInput({ name, type: widget });
    assert(m, `retired ${name} unmapped`);
  }
  // Spot checks across retired widgets.
  assertEquals(widgetToEInput({ name: "input.vcodec", type: "select" })!.type, "select");
  assertEquals(widgetToEInput({ name: "input.crf", type: "range" })!.type, "range");
  assertEquals(widgetToEInput({ name: "input.verbose", type: "checkbox" })!.type, "checkbox");
});

Deno.test("unknown widget → null (explicit, never silent default)", () => {
  assertEquals(widgetToEInput({ name: "input.nope", type: "nope" }), null);
});

// ── renderToken (task C5) ────────────────────────────────────────────────────
import { parseToken } from "../grammar.ts";
import { renderToken } from "../render.ts";

Deno.test("select token yields one option child per entry with author labels", () => {
  const t = parseToken("input.select:zip,tar.gz=tar.gz")!;
  const r = renderToken(t, "", {
    options: [{ value: "tar.gz", label: "Tarball", description: "Compressed tar" }],
  })!;
  assertEquals(r.tag, "e-input");
  assertEquals(r.type, "select");
  assertEquals(r.options.length, 2);
  assertEquals(r.options[0], { tag: "e-select-option", value: "zip", label: "zip" });
  assertEquals(r.options[1].label, "Tarball");
  assertEquals(r.options[1].description, "Compressed tar");
});

Deno.test("repeated tokens yield distinct names from iid", () => {
  const a = parseToken("input.dir")!;
  const b = { ...a, iid: "input.dir#2", occ: 2, total: 2 };
  assertEquals(renderToken(a, "A")!.name, "input.dir");
  assertEquals(renderToken(b, "B")!.name, "input.dir#2");
});

Deno.test("checkbox with =off starts unchecked; bare starts checked", () => {
  const off = parseToken("input.checkbox:--dry-run=off")!;
  assertEquals(renderToken(off)!.checked, false);
  assertEquals(renderToken(off)!.value, "");
  const on = parseToken("input.checkbox:--rm")!;
  assertEquals(renderToken(on)!.checked, true);
});

Deno.test("no descriptor without a type", () => {
  assertEquals(
    renderToken({ iid: "x", name: "input.nope", type: "nope", params: "", optionsArr: null, checkedDef: null }, ""),
    null,
  );
});

Deno.test("range carries min/max/step; radio uses e-radio-option", () => {
  const t = parseToken("input.range:18-28")!;
  const r = renderToken(t)!;
  assertEquals([r.min, r.max, r.step], [18, 28, 1]);
  const radio = parseToken("input.radio:yes,no")!;
  const rr = renderToken(radio)!;
  assert(rr.options.every((o) => o.tag === "e-radio-option"));
});
