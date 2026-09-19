// Grammar tests — the Phase B gate (§1.2, §15).
// Covers: three positions alone + combined, every colon-default form per
// type, occurrence keying, all 7 aliases, retired read-tolerance,
// unknown-token passthrough, rangeSpec (with the =default fix), exampleFor
// across all 30 live types, the :autogenerate literal rule, and the
// grammar.js staleness hash.
import {
  assert,
  assertEquals,
} from "jsr:@std/assert@^1";
import {
  CC_INPUT_ALIASES,
  CC_INPUT_TYPES,
  CC_RETIRED_TYPES,
  lookupType,
} from "../registry.ts";
import {
  ccAutoGenerate,
  exampleFor,
  parseToken,
  parseVarInstances,
  parseVars,
  rangeSpec,
  renderCmd,
} from "../grammar.ts";

Deno.test("registry shape: 30 live + 108 retired + 7 aliases", () => {
  assertEquals(CC_INPUT_TYPES.length, 30);
  assertEquals(CC_RETIRED_TYPES.length, 108);
  assertEquals(Object.keys(CC_INPUT_ALIASES).length, 7);
  const live = new Set(CC_INPUT_TYPES.map((r) => r[0]));
  const ret = new Set(CC_RETIRED_TYPES.map((r) => r[0]));
  for (const n of live) assert(!ret.has(n), `overlap: ${n}`);
  assertEquals(live.size + ret.size, 138);
});

Deno.test("live widget histogram", () => {
  const hist: Record<string, number> = {};
  for (const r of CC_INPUT_TYPES) hist[r[1]] = (hist[r[1]] || 0) + 1;
  assertEquals(hist["select"], 7);
  assertEquals(hist["text"], 5);
  assertEquals(hist["file"], 3);
  assertEquals(hist["number"], 2);
  for (
    const w of [
      "date",
      "color",
      "password",
      "radio",
      "buttongroup",
      "checkbox",
      "switch",
      "range",
      "time",
      "datetime",
      "textarea",
      "multiselect",
      "keyvalue",
    ]
  ) {
    assertEquals(hist[w], 1, w);
  }
});

Deno.test("14 live rows carry built-in defaults", () => {
  const withDef = CC_INPUT_TYPES.filter((r) => r[3]);
  assertEquals(withDef.length, 14);
});

Deno.test("aliases resolve to live targets", () => {
  const cases: Record<string, string> = {
    "input.hexcolor": "input.color",
    "input.bgcolor": "input.color",
    "input.fgcolor": "input.color",
    "input.token": "input.password",
    "input.apikey": "input.password",
    "input.secret": "input.password",
    "input.since": "input.date",
  };
  for (const [alias, target] of Object.entries(cases)) {
    const r = lookupType(alias);
    assert(r, alias);
    assertEquals(r!.row[0], target);
    assertEquals(r!.retired, false);
  }
});

Deno.test("retired names resolve flagged; unknown returns null", () => {
  const r = lookupType("input.vcodec");
  assert(r);
  assertEquals(r!.retired, true);
  assertEquals(r!.row[1], "select");
  assertEquals(lookupType("input.nope"), null);
  assertEquals(lookupType("input.TEXT"), null); // case-sensitive
});

Deno.test("position 1 (type) + position 2 (dot-suffix) are distinct fields", () => {
  const a = parseToken("input.uuid")!;
  assertEquals(a.auto, false);
  assertEquals(a.default, "");
  const b = parseToken("input.uuid.autogenerate")!;
  assertEquals(b.auto, true);
  assertEquals(b.default, "");
  assertEquals(b.key, "input.uuid.autogenerate");
});

Deno.test("position 3 (colon default) is always literal", () => {
  assertEquals(parseToken("input.text:hello")!.default, "hello");
  assertEquals(parseToken("input.port:8080")!.default, "8080");
  assertEquals(parseToken("input.color:#1677ff")!.default, "#1677ff");
  // The legacy tolerance is NOT ported: a default literally named
  // "autogenerate" stays a default and never sets auto.
  const t = parseToken("input.text:autogenerate")!;
  assertEquals(t.default, "autogenerate");
  assertEquals(t.auto, false);
});

Deno.test("select/radio colon forms", () => {
  const s1 = parseToken("input.select:zip,tar.gz")!;
  assertEquals(s1.optionsArr, ["zip", "tar.gz"]);
  assertEquals(s1.default, "");
  const s2 = parseToken("input.select:zip,tar.gz=tar.gz")!;
  assertEquals(s2.optionsArr, ["zip", "tar.gz"]);
  assertEquals(s2.default, "tar.gz");
  // bare select falls back to registry defaults
  const s3 = parseToken("input.select")!;
  assert(s3.optionsArr!.length > 2, "registry defaults");
  assertEquals(parseToken("input.radio:yes,no")!.optionsArr, ["yes", "no"]);
});

Deno.test("range colon forms", () => {
  const r1 = parseToken("input.range:18-28")!;
  assertEquals(r1.rangeDef, { min: 18, max: 28, def: "" });
  const r2 = parseToken("input.range:0-100=75")!;
  assertEquals(r2.rangeDef, { min: 0, max: 100, def: "75" });
  assertEquals(r2.default, "75");
});

Deno.test("checkbox colon forms", () => {
  const on = parseToken("input.checkbox:--rm")!;
  assertEquals(on.checkedDef, true);
  assertEquals(on.default, "--rm");
  const off = parseToken("input.checkbox:--dry-run=off")!;
  assertEquals(off.checkedDef, false);
  assert(off.key.endsWith("=off"), off.key);
});

Deno.test("occurrence keying", () => {
  const inst = parseVarInstances("cp {{input.dir}} {{input.dir}}");
  assertEquals(inst.length, 2);
  assertEquals(inst[0].iid, "input.dir");
  assertEquals(inst[1].iid, "input.dir#2");
  assertEquals(inst[0].total, 2);
  assertEquals(inst[1].total, 2);
  assertEquals(parseVars("cp {{input.dir}} {{input.dir}}").length, 1);
});

Deno.test("renderCmd occurrence → base → raw", () => {
  assertEquals(
    renderCmd("cp {{input.dir}} {{input.dir}}", {
      "input.dir": "A",
      "input.dir#2": "B",
    }),
    "cp A B",
  );
  assertEquals(renderCmd("x {{input.dir}}", { "input.dir": "A" }), "x A");
  assertEquals(renderCmd("x {{input.nope}}", {}), "x {{input.nope}}");
  assertEquals(renderCmd("x {{input.dir}}", null), "x {{input.dir}}");
  // meta.example fallback (§8.2): occurrence-key → base-key → meta → raw
  assertEquals(
    renderCmd("x {{input.dir}}", {}, { "input.dir": { example: "M" } as never }),
    "x M",
  );
  assertEquals(
    renderCmd("x {{input.dir}}", {}, { "input.dir": "N" }),
    "x N",
  );
});

Deno.test("rangeSpec strips =default before bounds (the §1.5 fix)", () => {
  assertEquals(rangeSpec("18-28=23"), { min: 18, max: 28, step: 1 });
  assertEquals(rangeSpec("0-100=75"), { min: 0, max: 100, step: 1 });
  assertEquals(rangeSpec("0-100"), { min: 0, max: 100, step: 1 });
  assertEquals(rangeSpec(""), { min: 0, max: 100, step: 1 });
  assertEquals(rangeSpec("18-28:0.5"), { min: 18, max: 28, step: 0.5 });
});

Deno.test("exampleFor across all 30 live types", () => {
  for (const row of CC_INPUT_TYPES) {
    const t = parseToken(row[0]);
    assert(t, row[0]);
    const ex = exampleFor(t!);
    assert(
      typeof ex === "string" && ex.length > 0,
      `${row[0]} gave empty example`,
    );
  }
  // spot checks
  assertEquals(exampleFor(parseToken("input.range:18-28=23")!), "23");
  assertEquals(
    exampleFor(parseToken("input.select:zip,tar.gz=tar.gz")!),
    "tar.gz",
  );
  assertEquals(exampleFor(parseToken("input.checkbox:--dry-run=off")!), "");
  assertEquals(
    exampleFor(parseToken("input.uuid")!),
    "123e4567-e89b-12d3-a456-426614174000",
  );
  // meta.example wins (the command.html half of the merge)
  assertEquals(
    exampleFor(parseToken("input.text")!, {
      key: "input.text",
      iid: "input.text",
      occ: 1,
      total: 1,
      type: "text",
      name: "input.text",
      params: "",
      auto: false,
      default: "",
      token: "{{input.text}}",
      example: "custom",
    }),
    "custom",
  );
});

Deno.test("ccAutoGenerate ladder", () => {
  const uuid = ccAutoGenerate({ name: "input.uuid", type: "text" })!;
  assert(/^[0-9a-f-]{36}$/.test(uuid), uuid);
  assert(ccAutoGenerate({ name: "input.password", type: "password" })!.startsWith("pw-"));
  assertEquals(ccAutoGenerate({ name: "input.fps", type: "number" }), "30");
  assertEquals(ccAutoGenerate({ name: "input.range", type: "range" }), null);
});

Deno.test("retired token parses with retired:true", () => {
  const t = parseToken("input.vcodec:h264")!;
  assertEquals(t.retired, true);
  assertEquals(t.type, "select");
  assertEquals(t.optionsArr, ["h264"]);
});

Deno.test("grammar.js staleness: rebuild reproduces committed file", async () => {
  // Ground truth: regenerate the bundle; the committed file must be current.
  // (The bundle embeds a deterministic content hash, so a stale file fails
  // either via changed output or via the hash mismatch below.)
  const before = await Deno.readTextFile(
    new URL("../static/grammar.js", import.meta.url),
  );
  const cmd = new Deno.Command(Deno.execPath(), {
    args: ["task", "build:grammar"],
    cwd: new URL("..", import.meta.url).pathname.replace(/^\//, ""),
    stdout: "piped",
    stderr: "piped",
  });
  const r = await cmd.output();
  assert(r.success, new TextDecoder().decode(r.stderr));
  const after = await Deno.readTextFile(
    new URL("../static/grammar.js", import.meta.url),
  );
  assertEquals(after, before);
});
