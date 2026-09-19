// Command Centre grammar — the shared brain (§1.2, §8.2).
// Parses {{input.*}} tokens: three positions (type, .autogenerate, :default).
// Ported verbatim from design/add.html + design/index.html, with two fixes:
//   - rangeSpec strips the =default before the bounds regex (§1.5 row 3)
//   - exampleFor is the merged implementation (add's ladder + command's
//     meta-first override; §1.5 row 4)
// RULES.md: unknown input.* names stay literal (parseToken → null).

import { lookupType, type TypeRow } from "./registry.ts";

export interface Token {
  key: string;
  type: string; // widget
  name: string; // input.* name
  params: string;
  auto: boolean;
  default: string;
  optionsArr: string[] | null;
  rangeDef: { min: number; max: number; def: string } | null;
  checkedDef: boolean | null;
  token: string; // the raw {{...}} text
  retired: boolean;
  occ: number;
  iid: string;
  total: number;
}

export interface VarMeta {
  key: string;
  iid: string;
  occ: number;
  total: number;
  type: string;
  name: string;
  params: string;
  auto: boolean;
  default: string;
  token: string;
  checkedDef?: boolean | null;
  optionsArr?: string[] | null;
  label?: string;
  description?: string;
  options?: Array<{ value: string; label?: string; description?: string }>;
  example?: string;
}

const TOKEN_RE = /^input\.([a-z0-9]+)(\.autogenerate)?(?::([\s\S]*))?$/;
const OUTER_RE = /\{\{\s*([^{}]*?)\s*\}\}/g;
const CHECK_RE = /^(1|t|true|on|checked|yes|y|0|f|false|off|unchecked|no|n)$/i;
const CHECK_TRUE_RE = /^(1|t|true|on|checked|yes|y)$/i;

function splitOpts(s: string): string[] {
  return s.split(",").map((x) => x.trim()).filter((x) => x !== "");
}

export function parseToken(inner: string): Token | null {
  inner = String(inner ?? "").trim();
  const m = inner.match(TOKEN_RE);
  if (!m) return null;
  const name = "input." + m[1];
  const resolved = lookupType(name);
  if (!resolved) return null;
  const def = resolved.row;
  const widget = def[1];
  // NOTE (§1.2, B4): the design's `:autogenerate` tolerance (treating a colon
  // default literally named "autogenerate" as the .autogenerate modifier) is
  // intentionally NOT ported — it hijacks a real default. Colon content is
  // always literal; only the dot-suffix sets auto. Stored `:autogenerate`
  // tokens still parse, as the literal default "autogenerate".
  const auto = !!m[2];
  const raw = (m[3] != null ? m[3] : "").trim();
  let params = raw;
  let defVal = "";
  let optsArr: string[] | null = null;
  let rangeDef: Token["rangeDef"] = null;
  let checkedDef: boolean | null = null;

  if (widget === "multiselect") {
    if (raw === "") {
      params = def[3] || "";
      optsArr = params ? splitOpts(params) : [];
      defVal = "";
    } else {
      const eq = raw.indexOf("=");
      if (eq >= 0) {
        const ml = raw.slice(0, eq).trim();
        const mr = raw.slice(eq + 1).trim();
        const mlo = ml ? splitOpts(ml) : [];
        const mrd = mr ? splitOpts(mr) : [];
        if (mlo.length) {
          optsArr = mlo;
          defVal = mrd.join(",");
          params = mlo.join(",") + (mrd.length ? "=" + mrd.join(",") : "");
        } else {
          optsArr = splitOpts(raw);
          params = optsArr.join(",");
        }
      } else {
        optsArr = splitOpts(raw);
        params = optsArr.join(",");
      }
    }
  } else if (
    widget === "select" || widget === "radio" ||
    widget === "buttongroup" || widget === "license"
  ) {
    if (raw === "") {
      params = def[3] || "";
      optsArr = params ? splitOpts(params) : [];
    } else {
      const dm = raw.match(/^(.*)=\s*([^=,]+?)\s*$/);
      if (dm && dm[1].trim() !== "" && dm[2].trim() !== "") {
        const left = dm[1].trim();
        const right = dm[2].trim();
        const lopts = splitOpts(left);
        if (lopts.length && right.indexOf(",") < 0) {
          optsArr = lopts;
          defVal = right;
          params = lopts.join(",") + "=" + right;
        } else {
          optsArr = splitOpts(raw);
          params = optsArr.join(",");
        }
      } else {
        optsArr = splitOpts(raw);
        params = optsArr.join(",");
      }
    }
  } else if (widget === "range") {
    params = raw === "" ? def[3] || "" : raw;
    const rm = params.match(
      /(-?\d+(?:\.\d+)?)\s*-\s*(-?\d+(?:\.\d+)?)(?:\s*=\s*(-?\d+(?:\.\d+)?))?/,
    );
    if (rm) {
      rangeDef = {
        min: +rm[1],
        max: +rm[2],
        def: rm[3] != null && rm[3] !== "" ? rm[3] : "",
      };
      if (rangeDef.def !== "") defVal = rangeDef.def;
    }
  } else if (widget === "checkbox" || widget === "switch") {
    if (raw === "") {
      params = def[3] || "";
      checkedDef = true;
      if (params !== "") defVal = params;
    } else {
      const cm = raw.match(/^(.*)=\s*([^\s=]+?)\s*$/);
      if (
        cm && cm[1].trim() !== "" && CHECK_RE.test(cm[2].trim())
      ) {
        params = cm[1].trim() || "--flag";
        checkedDef = CHECK_TRUE_RE.test(cm[2].trim());
        defVal = params;
      } else {
        params = raw;
        checkedDef = true;
        defVal = params;
      }
    }
  } else {
    if (params === "") params = def[3] || "";
    defVal = params;
  }

  let key = name + (auto ? ".autogenerate" : "") +
    (params !== "" ? ":" + params : "");
  if ((widget === "checkbox" || widget === "switch") && checkedDef === false) {
    key += "=off";
  }
  return {
    key,
    type: widget,
    name,
    params,
    auto,
    default: defVal,
    optionsArr: optsArr,
    rangeDef,
    checkedDef,
    token: "{{" + inner + "}}",
    retired: resolved.retired,
    occ: 1,
    iid: name,
    total: 1,
  };
}

export function ccInstanceKey(base: string, occ: number): string {
  return occ <= 1 ? base : base + "#" + occ;
}

export function parseVarInstances(t: string): Token[] {
  const out: Token[] = [];
  const counts: Record<string, number> = {};
  const re = new RegExp(OUTER_RE.source, "g");
  let m: RegExpExecArray | null;
  while ((m = re.exec(String(t ?? "")))) {
    let p: Token | null = null;
    try {
      p = parseToken(m[1]);
    } catch {
      p = null;
    }
    if (!p) continue;
    const occ = (counts[p.key] || 0) + 1;
    counts[p.key] = occ;
    p.occ = occ;
    p.iid = ccInstanceKey(p.key, occ);
    out.push(p);
  }
  const totals: Record<string, number> = {};
  for (const v of out) totals[v.key] = (totals[v.key] || 0) + 1;
  for (const v of out) v.total = totals[v.key] || 1;
  return out;
}

export function parseVars(t: string): Token[] {
  const out: Token[] = [];
  const seen = new Set<string>();
  const re = new RegExp(OUTER_RE.source, "g");
  let m: RegExpExecArray | null;
  while ((m = re.exec(String(t ?? "")))) {
    const p = parseToken(m[1]);
    if (p && !seen.has(p.key)) {
      seen.add(p.key);
      out.push(p);
    }
  }
  return out;
}

/** Substitute occurrence-key → base-key → leave raw. */
export function renderCmd(
  t: string,
  vals: Record<string, string> | null | undefined,
): string {
  const counts: Record<string, number> = {};
  return String(t ?? "").replace(
    new RegExp(OUTER_RE.source, "g"),
    (m: string, inner: string) => {
      const p = parseToken(inner);
      if (!p || !vals) return m;
      const occ = (counts[p.key] || 0) + 1;
      counts[p.key] = occ;
      const k = ccInstanceKey(p.key, occ);
      if (k in vals) return vals[k];
      if (p.key in vals) return vals[p.key];
      return m;
    },
  );
}

export interface RangeSpec {
  min: number;
  max: number;
  step: number;
}

/**
 * Parse range bounds from token params.
 * FIX (§1.5 row 3): the design's version splits on ":" and ignores the
 * declared bounds whenever params contain "=default" — which is every demo
 * range token. Strip the =default first, then match bounds.
 */
export function rangeSpec(params: string): RangeSpec {
  const noDefault = String(params ?? "").split("=")[0];
  const parts = String(params ?? "").split(":");
  const mm = (noDefault || "").trim().match(
    /^(-?\d+(?:\.\d+)?)\s*-\s*(-?\d+(?:\.\d+)?)$/,
  );
  let min = mm ? parseFloat(mm[1]) : 0;
  let max = mm ? parseFloat(mm[2]) : 100;
  if (!isFinite(min)) min = 0;
  if (!isFinite(max)) max = 100;
  if (max <= min) max = min + 100;
  let step = parts.length > 1 ? parseFloat(parts[1]) : 1;
  if (!isFinite(step) || step <= 0) step = 1;
  return { min, max, step };
}

function ccUuid(): string {
  try {
    if (
      typeof crypto !== "undefined" &&
      typeof (crypto as { randomUUID?: () => string }).randomUUID === "function"
    ) {
      return (crypto as { randomUUID: () => string }).randomUUID();
    }
  } catch {
    // fall through
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === "x" ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function ccRandStr(n: number): string {
  const ch = "abcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  for (let i = 0; i < (n || 8); i++) {
    s += ch[Math.floor(Math.random() * ch.length)];
  }
  return s;
}

function ccRandInt(a: number, b: number): string {
  a = +a;
  b = +b;
  if (!isFinite(a)) a = 0;
  if (!isFinite(b)) b = 100;
  return String(a + Math.floor(Math.random() * (b - a + 1)));
}

/** add.html's ladder, verbatim (randomized values for .autogenerate). */
export function ccAutoGenerate(v: Pick<Token, "name" | "type">): string | null {
  const n = v.name;
  const w = v.type;
  if (n === "input.uuid") return ccUuid();
  if (w === "password") return "pw-" + ccRandStr(12);
  if (w === "color") {
    return "#" + ("000000" + Math.floor(Math.random() * 16777215).toString(16)).slice(-6);
  }
  if (w === "date" || n === "input.since") {
    try {
      return new Date().toISOString().slice(0, 10);
    } catch {
      return "2026-09-12";
    }
  }
  if (w === "time") {
    try {
      return new Date().toISOString().slice(11, 16);
    } catch {
      return "12:30";
    }
  }
  if (w === "datetime") {
    try {
      return new Date().toISOString().slice(0, 16);
    } catch {
      return "2026-09-12T12:30";
    }
  }
  if (w === "number") {
    if (n === "input.port") return ccRandInt(3000, 8999);
    if (n === "input.bitrate") return ccRandInt(800, 6000);
    if (n === "input.fps") return "30";
    if (n === "input.count" || n === "input.quantity" || n === "input.replicas") {
      return ccRandInt(1, 9);
    }
    return ccRandInt(1, 999);
  }
  if (n === "input.email") return "user-" + ccRandStr(5) + "@example.com";
  if (n === "input.url") return "https://example.com/" + ccRandStr(6);
  if (n === "input.ip") {
    return ccRandInt(11, 250) + "." + ccRandInt(0, 250) + "." +
      ccRandInt(0, 250) + "." + ccRandInt(2, 250);
  }
  if (n === "input.username") return "user-" + ccRandStr(5);
  if (n === "input.hostname" || n === "input.domain") {
    return "host-" + ccRandStr(4) + ".example.com";
  }
  if (w === "text" || w === "file") {
    return n === "input.uuid" ? ccUuid() : ccRandStr(8);
  }
  return null;
}

const FILE_EXAMPLES: Record<string, string> = {
  "input.file": "input.mp4",
  "input.output": "output.mp4",
  "input.subtitle": "subs.srt",
  "input.poster": "poster.jpg",
  "input.thumbnail": "thumb.jpg",
  "input.path": "./src/app.js",
  "input.dir": "./dist",
  "input.folder": "./dist",
  "input.files": "input.mp4 input2.mp4",
  "input.template": "template.hbs",
  "input.config": "config.json",
  "input.logfile": "app.log",
  "input.workdir": "C:\\projects\\app",
  "input.varfile": "vars.tfvars",
  "input.planfile": "plan.out",
};

const NUMBER_EXAMPLES: Record<string, string> = {
  "input.port": "8080",
  "input.bitrate": "2500",
  "input.fps": "30",
  "input.count": "3",
  "input.quantity": "2",
  "input.replicas": "3",
  "input.timeout": "30",
  "input.retries": "3",
  "input.delay": "5",
  "input.cpu": "2",
  "input.speed": "1.5",
};

const TEXT_EXAMPLES: Record<string, string> = {
  "input.text": "hello",
  "input.message": "hello world",
  "input.title": "Release notes",
  "input.description": "Small fix release",
  "input.username": "ada",
  "input.hostname": "web-01",
  "input.domain": "example.com",
  "input.ip": "192.168.1.10",
  "input.email": "you@example.com",
  "input.url": "https://example.com",
  "input.search": "button styles",
  "input.regex": "[a-z]+",
  "input.duration": "00:01:20",
  "input.seek": "00:00:10",
  "input.filename": "app.js",
  "input.glob": "*.js",
  "input.pattern": "*.test.js",
  "input.script": "build",
  "input.package": "opencode",
  "input.version": "1.2.0",
  "input.semver": "1.2.0",
  "input.branch": "main",
  "input.tag": "v1.2.0",
  "input.commit": "a1b2c3d",
  "input.author": "Ada Lovelace",
  "input.repos": "open-design/app",
  "input.org": "acme",
  "input.cimage": "node:20",
  "input.containername": "web",
  "input.mount": "./data:/data",
  "input.network": "app-net",
  "input.memory": "512m",
  "input.entrypoint": "npm start",
  "input.header": "Authorization: Bearer TOKEN",
  "input.query": "q=hello&page=2",
  "input.cidr": "10.0.0.0/24",
  "input.sql": "SELECT * FROM users",
  "input.mac": "02:42:ac:11:00:02",
  "input.database": "appdb",
  "input.table": "users",
  "input.dbuser": "admin",
  "input.cron": "0 * * * *",
  "input.namespace": "default",
  "input.deployment": "web",
  "input.service": "api",
  "input.pod": "web-0",
  "input.context": "prod",
  "input.region": "us-east-1",
  "input.profile": "default",
  "input.bucket": "assets",
  "input.bucketkey": "video/input.mp4",
  "input.workspace": "main",
  "input.hexcolor": "#1677ff",
  "input.bgcolor": "#ffffff",
  "input.fgcolor": "#1f2328",
  "input.colorname": "steelblue",
  "input.flag": "--flag",
  "input.confirm": "--yes",
  "input.verbose": "--verbose",
  "input.quiet": "--quiet",
  "input.force": "--force",
  "input.dryrun": "--dry-run",
};

/**
 * Merged example implementation (§1.5 row 4): command.html's meta-first
 * override wins, then add.html's ladder. The two sources disagreed
 * (s3cr3t vs ••••••, input.mp4 vs path/to/file) — meta.example is the
 * tiebreaker, then the richer ladder below.
 */
export function exampleFor(
  v: Pick<
    Token,
    "name" | "type" | "params" | "default" | "optionsArr" | "rangeDef" | "checkedDef" | "auto"
  >,
  meta?: VarMeta | null,
): string {
  if (
    meta && meta.example !== undefined && meta.example !== null &&
    meta.example !== ""
  ) {
    return String(meta.example);
  }
  const n = v.name;
  const w = v.type;
  const p = v.params || "";
  if (n === "input.uuid" && v.default) return v.default;
  if (n === "input.uuid" && !v.auto) return "123e4567-e89b-12d3-a456-426614174000";
  if (w === "multiselect") {
    const mo = (v.optionsArr && v.optionsArr.length)
      ? v.optionsArr
      : p.split(",").map((s) => s.trim()).filter((s) => s !== "");
    if (!mo.length) return "opt";
    const md = String(v.default || "").split(",").map((s) => s.trim()).filter((s) =>
      mo.indexOf(s) >= 0
    );
    if (md.length) return md.join(",");
    return mo[0];
  }
  if (w === "select" || w === "radio" || w === "buttongroup" || w === "license") {
    const o = (v.optionsArr && v.optionsArr.length)
      ? v.optionsArr
      : p.split(",").map((s) => s.trim()).filter((s) => s !== "");
    if (!o.length) return "opt";
    if (v.default && o.indexOf(v.default) >= 0) return v.default;
    return o[0];
  }
  if (w === "range") {
    if (v.rangeDef && v.rangeDef.def !== "" && isFinite(+v.rangeDef.def)) {
      return String(+v.rangeDef.def);
    }
    if (v.default !== "" && isFinite(+v.default)) return String(+v.default);
    const rm = p.match(/(-?\d+)\s*-\s*(-?\d+)/);
    if (rm) {
      const a = +rm[1];
      const b = +rm[2];
      return String(Math.round((a + b) / 2));
    }
    return "50";
  }
  if (w === "checkbox" || w === "switch") {
    if (v.checkedDef === false) return "";
    return p || "--flag";
  }
  if (v.default !== "") return v.default;
  if (v.auto) {
    try {
      const ag = ccAutoGenerate(v);
      if (ag != null && ag !== "") return ag;
    } catch {
      // fall through
    }
  }
  if (w === "color") {
    if (n === "input.colorname") return "steelblue";
    return "#1677ff";
  }
  if (w === "date" || n === "input.since") return "2026-09-12";
  if (w === "password") return "s3cr3t";
  if (w === "time") return "12:30";
  if (w === "datetime") return "2026-09-12T12:30";
  if (w === "textarea") return "hello world";
  if (w === "keyvalue") {
    const kv = String(p || "");
    if (kv.indexOf("=") >= 0) return kv;
    return "KEY=value";
  }
  if (w === "file") return FILE_EXAMPLES[n] || "input.mp4";
  if (w === "number") {
    if (NUMBER_EXAMPLES[n]) return NUMBER_EXAMPLES[n];
    return "42";
  }
  if (TEXT_EXAMPLES[n]) return TEXT_EXAMPLES[n];
  return "hello";
}
