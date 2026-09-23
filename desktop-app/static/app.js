// Command Centre frontend — tasks E2 (commands), E6 (status bar), E7 (events).
// E3 (detail), E4 (author) and E5 (learn) components are appended below.
// Shape follows implementation.md §10 (Compressy pattern): one IIFE,
// `alpine:init` listener, `Alpine.data(...)` components; explicit render
// functions own list DOM. Backend is reached only through `bindings.*`.
// Grammar comes from window.CCGrammar (static/grammar.js, generated).
(function () {
  "use strict";

  /* ── tiny DOM helpers ─────────────────────────────────────────────────── */
  function $(id) {
    return document.getElementById(id);
  }
  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined && text !== null) e.textContent = text;
    return e;
  }
  function on(elm, ev, fn) {
    if (elm) elm.addEventListener(ev, fn);
  }
  // Human message out of any thrown shape: backend rejections cross the
  // CEF bridge as plain objects that do not always carry .message (which
  // produced "Could not save: [object Object]"). This wrapper guarantees the
  // UI never shows exactly that string, no matter which branch below fires.
  function errorMessage(e, fallback) {
    const m = shapeErrorMessage(e, fallback);
    return m === "[object Object]" ? (fallback || "Unknown error") : m;
  }

  function shapeErrorMessage(e, fallback) {
    const fb = fallback || "Unknown error";
    if (e === null || e === undefined) return fb;
    if (typeof e === "string") return e || fb;
    // A literal "[object Object]" message means the payload was poisoned
    // upstream (bridge String() of a bare object) — treat as absent so the
    // chain below (or the fallback) produces something actionable instead.
    if (typeof e.message === "string" && e.message && e.message !== "[object Object]") return e.message;
    if (Array.isArray(e.issues) && e.issues.length) {
      const parts = e.issues.map((i) => {
        if (!i) return "";
        if (typeof i.message === "string" && i.message) return i.message;
        if (typeof i.code === "string") return i.code;
        try {
          const s = JSON.stringify(i);
          return s === "{}" ? "" : s;
        } catch (err2) {
          return "";
        }
      }).filter(Boolean);
      if (parts.length) return parts.join("; ");
    }
    if (e.error !== undefined && e.error !== null && e.error !== e) {
      return shapeErrorMessage(e.error, fb);
    }
    try {
      const keys = Object.keys(e);
      if (keys.length) {
        const bits = [];
        for (const k of ["name", "code", "detail", "hint", "reason"]) {
          if (typeof e[k] === "string" && e[k]) bits.push(k === "name" ? e[k] : k + ": " + e[k]);
        }
        if (bits.length) return bits.join(" · ");
        const s = JSON.stringify(e);
        if (s && s !== "{}") return s;
      }
    } catch (err3) { /* fall through */ }
    // Last resort: name the shape instead of "[object Object]".
    return describeError(e, fb);
  }

  // Structural fingerprint of a thrown value for diagnostics: constructor,
  // all own property names (enumerable or not), and a short rendering of
  // each value. Used when errorMessage has nothing better to show.
  function describeError(e, fallback) {
    try {
      if (e === null || e === undefined) return fallback || "Unknown error";
      if (typeof e !== "object" && typeof e !== "function") {
        const s = String(e);
        return s && s !== "[object Object]" ? s : (fallback || "Unknown error");
      }
      const ctor = (e.constructor && e.constructor.name) || typeof e;
      const keys = Object.getOwnPropertyNames(e);
      const shown = keys.slice(0, 8).map((k) => {
        let v;
        try {
          v = e[k];
        } catch (err4) {
          return k + "=<unreadable>";
        }
        if (typeof v === "string") return k + "=" + (v.length > 120 ? v.slice(0, 120) + "…" : v || "(empty)");
        if (v === null || v === undefined) return k + "=empty";
        if (typeof v === "object") {
          try {
            const s = JSON.stringify(v);
            return k + "=" + ((s && s !== "{}") ? s.slice(0, 120) : "(empty object)");
          } catch (err5) {
            return k + "=<unserializable>";
          }
        }
        return k + "=" + String(v).slice(0, 120);
      });
      return ctor + " (" + (keys.length ? "keys: " + shown.join(", ") : "no own keys") + ")";
    } catch (err6) {
      return fallback || "Unknown error";
    }
  }
  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  /* ── backend + grammar access ─────────────────────────────────────────── */
  function B() {
    const b = window.bindings;
    if (!b) throw new Error("backend bindings unavailable (run inside the desktop app)");
    return b;
  }
  function G() {
    const g = window.CCGrammar;
    if (!g) throw new Error("grammar.js failed to load");
    return g;
  }

  /* ── shells (prompt paint + availability) ─────────────────────────────── */
  const SHELL_PROMPTS = {
    powershell: { label: "PowerShell", icon: "icons/powershell.svg", pre: "PS ", post: "> " },
    bash: { label: "Bash", icon: "icons/bash.svg", pre: "", post: " $ " },
    ubuntu: { label: "Ubuntu", icon: "icons/ubuntu.svg", pre: "", post: " $ " },
  };
  const SHELL_ORDER = ["powershell", "bash", "ubuntu"];
  let allowedShells = new Set(SHELL_ORDER);
  async function refreshShells() {
    try {
      const p = await B().getPlatform();
      const ids = (p && p.shells || []).map((s) => s.id).filter((id) => SHELL_ORDER.includes(id));
      if (ids.length) allowedShells = new Set(ids);
    } catch (e) {
      console.warn("getPlatform failed, offering all shells", e);
    }
  }
  function shellLabel(id) {
    return (SHELL_PROMPTS[id] || SHELL_PROMPTS.powershell).label;
  }
  function shellIcon(id) {
    return (SHELL_PROMPTS[id] || SHELL_PROMPTS.powershell).icon;
  }
  function paintPrompt(scope, shellId) {
    const sh = SHELL_PROMPTS[shellId] || SHELL_PROMPTS.powershell;
    scope.querySelectorAll("[data-pre]").forEach((s) => { s.textContent = sh.pre; });
    scope.querySelectorAll("[data-post]").forEach((s) => { s.textContent = sh.post; });
    // Legacy design spans without data hooks (kept for verbatim markup).
    scope.querySelectorAll(".cmdline > .dim:first-child").forEach((s) => {
      if (!s.hasAttribute("data-pre")) s.textContent = sh.pre;
    });
    const btn = scope.querySelector("[data-shellbtn]");
    if (btn) {
      const img = btn.querySelector("img");
      if (img) img.src = sh.icon;
      btn.setAttribute("aria-label", "Shell: " + sh.label + " — activate to change shell");
      btn.setAttribute("title", "Shell: " + sh.label + " (click to change)");
    }
  }
  function cycleShell(id) {
    const order = SHELL_ORDER.filter((s) => allowedShells.has(s));
    const cur = order.includes(shellChoice[id]) ? shellChoice[id] : order[0];
    const next = order[(order.indexOf(cur) + 1) % order.length];
    shellChoice[id] = next;
    B().setShell(id, next).catch(console.error);
    return next;
  }
  const shellChoice = {};
  async function loadShellChoices() {
    try {
      const m = await B().getShells();
      for (const k of Object.keys(m || {})) {
        if (SHELL_ORDER.includes(m[k]) && allowedShells.has(m[k])) shellChoice[k] = m[k];
      }
    } catch (e) {
      console.warn("getShells failed", e);
    }
  }
  function shellFor(id) {
    if (shellChoice[id] && allowedShells.has(shellChoice[id])) return shellChoice[id];
    const first = SHELL_ORDER.find((s) => allowedShells.has(s)) || "powershell";
    return first;
  }

  /* ── labels / origins ─────────────────────────────────────────────────── */
  function humanize(name) {
    const s = String(name || "").replace(/^input\./, "").replace(/[-_]+/g, " ").trim();
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : "Value";
  }
  function metaLabel(inst, meta) {
    if (meta && meta.label && String(meta.label).trim() !== "") return String(meta.label).trim();
    let lbl = humanize(inst.name);
    if (inst.total > 1) lbl += " " + inst.occ;
    if (inst.auto) lbl += " (auto)";
    return lbl;
  }
  function originOf(cmd) {
    if (cmd.fromHub) return "Hub";
    if (cmd.custom) return "Local";
    return "Built-in";
  }
  function matchMeta(variables, inst, used) {
    const vars = variables || [];
    for (const m of vars) {
      const k = (m && (m.iid || m.key)) || "";
      if ((k === inst.iid || k === inst.key) && !used.has(k + "#" + (m.occ || 0))) {
        used.add(k + "#" + (m.occ || 0));
        return m;
      }
    }
    for (const m of vars) {
      const k = (m && (m.iid || m.key)) || "";
      if (k === inst.key || k === inst.iid) return m;
    }
    return null;
  }

  /* ── command-line preview with example chips ──────────────────────────── */
  function paintCmdline(box, pwdEl, template, cwd, variables) {
    const g = G();
    if (pwdEl) pwdEl.textContent = cwd || "C:\\projects\\app";
    box.innerHTML = "";
    const used = new Set();
    const re = /\{\{\s*([^{}]*?)\s*\}\}/g;
    let last = 0, m;
    const src = String(template || "");
    const counts = {};
    while ((m = re.exec(src))) {
      if (m.index > last) box.appendChild(document.createTextNode(src.slice(last, m.index)));
      const p = g.parseToken(m[1]);
      if (p) {
        const occ = (counts[p.key] || 0) + 1;
        counts[p.key] = occ;
        const meta = matchMeta(variables, { iid: g.ccInstanceKey(p.key, occ), key: p.key }, used);
        const chip = el("span", "ex", g.exampleFor(p, meta));
        chip.title = p.token;
        box.appendChild(chip);
      } else {
        box.appendChild(document.createTextNode(m[0]));
      }
      last = m.index + m[0].length;
    }
    if (last < src.length) box.appendChild(document.createTextNode(src.slice(last)));
  }

  /* ── terminal helpers ─────────────────────────────────────────────────── */
  function termBodyEl(scope) {
    return scope.querySelector(".term-body");
  }
  function termShow(scope) {
    // Reveal the terminal the design way: .open on the .term itself (detail
    // page rule) and on the enclosing card (commands page rule). Clearing the
    // hidden attribute alone is not enough — both pages hide .term in CSS.
    const t = scope.querySelector(".term");
    if (t) {
      t.hidden = false;
      t.classList.add("open");
    }
    const card = scope.closest ? scope.closest(".cmd") : null;
    if (card) card.classList.add("open");
  }
  function termAppend(body, stream, text) {
    const empty = body.querySelector(".term-empty");
    if (empty) empty.remove();
    const line = el("div", null, text);
    if (stream === "stderr") line.className = "red";
    body.appendChild(line);
    body.scrollTop = body.scrollHeight;
  }
  function termNote(body, text) {
    const line = el("div", "dim", text);
    body.appendChild(line);
    body.scrollTop = body.scrollHeight;
  }
  function termPlaceholder(body) {
    body.innerHTML = "";
    const s = el("span", "term-empty", "Not run yet — press Run to execute.");
    body.appendChild(s);
  }
  function wireTermActions(scope) {
    const body = termBodyEl(scope);
    if (!body) return;
    scope.querySelectorAll("[data-a]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const a = btn.getAttribute("data-a");
        if (a === "copy") {
          const txt = body.innerText;
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(txt).catch(console.error);
          }
        } else if (a === "clear") {
          termPlaceholder(body);
        } else if (a === "hide") {
          // Hide the way termShow reveals: drop .open (the hidden attribute
          // alone loses to the .open display rules).
          const t = scope.querySelector(".term");
          if (t) {
            t.hidden = true;
            t.classList.remove("open");
          }
          const card = scope.closest ? scope.closest(".cmd") : null;
          if (card) card.classList.remove("open");
        }
      });
    });
  }

  /* ── input-layer validity (E7) ──────────────────────────────────────────
   * The library owns presentation constraints; the runner stays the execution
   * gate. e:input/e:change/e:validate bubble → one delegated listener.
   * hook:onValidate does NOT bubble → attached per element after insertion.
   *
   * Two library quirks this works around (see enhanced-inputs audit):
   *  1. e:validate fires BEFORE the library computes validity, so its
   *     detail.valid is stale — validity is re-read from the element instead.
   *  2. The library's invalid-branch calls internals.setValidity with a bad
   *     anchor, throwing a TypeError. Automatic validation is therefore
   *     disabled (validate-on="") and validation runs explicitly through
   *     safeValidate(); a global filter swallows that one known rejection.
   */
  const validity = new WeakMap(); // e-input element → true (valid) | false
  function trackValidity(elm, valid) {
    validity.set(elm, valid !== false);
    gateScope(elm);
  }
  function gateScope(elm) {
    const scope = (elm.closest && elm.closest("[data-run-scope]")) || document;
    const inputs = scope.querySelectorAll ? scope.querySelectorAll("e-input") : [];
    let bad = 0;
    inputs.forEach((i) => {
      if (validity.get(i) === false) bad++;
    });
    // Gate the side Run buttons only: the panel's Run Command stays clickable
    // so a blocked run still surfaces the exact validation message (E2).
    scope.querySelectorAll("[data-run]").forEach((b) => {
      if (bad > 0) b.setAttribute("disabled", "");
      else b.removeAttribute("disabled");
    });
  }
  function safeValidate(input) {
    if (!input || typeof input.validate !== "function") return;
    try {
      const r = input.validate();
      if (r && typeof r.catch === "function") r.catch(() => { /* known EI anchor defect */ });
    } catch (e) { /* known EI anchor defect */ }
  }
  // App-owned synchronous check (design rules): checkbox/radio/select/range
  // and friends are always submittable; others need a value, numbers numeric.
  function quickCheck(elm) {
    const kind = (elm && elm._ccKind) || "";
    if (ALWAYS_VALID.has(kind)) return true;
    let v = null;
    try { v = elm.value; } catch (e) { return true; }
    if (v == null) return false;
    const s = Array.isArray(v) ? v.join(",") : String(v);
    if (s === "") return false;
    if (kind === "number" && !isFinite(Number(s))) return false;
    return true;
  }
  function refreshValidity(elm) {
    if (!elm || elm.tagName !== "E-INPUT") return;
    trackValidity(elm, quickCheck(elm));
  }
  window.addEventListener("unhandledrejection", (e) => {
    const msg = String((e && e.reason && (e.reason.message || e.reason)) || "");
    if (msg.includes("setValidity") && msg.includes("HTMLElement")) {
      e.preventDefault(); // known enhanced-inputs anchor defect, handled above
    }
  });
  // Real typing targets the INNER native input (light DOM); library
  // re-dispatches target the <e-input> host. closest() covers both.
  function hostOf(t) {
    if (!t || typeof t.closest !== "function") return null;
    if (t.tagName === "E-INPUT") return t;
    return t.closest("e-input");
  }
  document.addEventListener("e:input", (e) => {
    const h = hostOf(e.target);
    if (h) refreshValidity(h);
  });
  document.addEventListener("e:change", (e) => {
    const h = hostOf(e.target);
    if (h) refreshValidity(h);
  });
  document.addEventListener("e:validate", (e) => {
    const h = hostOf(e.target);
    if (h) refreshValidity(h);
  });
  document.addEventListener("e:success", (e) => {
    const h = hostOf(e.target);
    if (h) trackValidity(h, true);
  });
  document.addEventListener("e:error", (e) => {
    const h = hostOf(e.target);
    if (h) trackValidity(h, false);
  });
  // Blur re-gates only (no explicit validation: painting the error UI here
  // would shift layout mid-click and swallow the click that caused the blur).
  // Error painting happens in showBad, after the click has landed.
  document.addEventListener("focusout", (e) => {
    const h = hostOf(e.target);
    if (h && h.tagName === "E-INPUT") refreshValidity(h);
  });

  /* ── variable panel builder (shared by run forms) ─────────────────────── */
  const ALWAYS_VALID = new Set([
    "checkbox", "switch", "radio", "select", "range", "buttongroup",
    "color", "multiselect", "license", "time", "datetime",
  ]);
  const VALID_MSG = "Fill every value — numbers need numeric input, dates need a date.";
  const TOKEN_ALIAS_PASSWORD = new Set(["input.token", "input.apikey", "input.secret"]);

  function optionChildren(desc, pre) {
    const out = [];
    const preList = String(pre || "").split(",").map((s) => s.trim());
    for (const o of desc.options || []) {
      const c = document.createElement(o.tag);
      c.setAttribute("value", o.value);
      c.textContent = o.label || o.value;
      if (o.description) c.setAttribute("description", o.description);
      // The library reads `selected` from slotted children at connect.
      if (o.tag === "e-checkbox-option") {
        if (preList.includes(o.value)) c.setAttribute("checked", "");
      } else if (o.value === pre) {
        c.setAttribute("selected", "");
      }
      out.push(c);
    }
    return out;
  }

  function buildVarControl(vrows, token, pre, meta, opts) {
    const g = G();
    const desc = g.renderToken(token, pre == null ? "" : String(pre), {
      label: (meta && meta.label) || undefined,
      description: (meta && meta.description) || undefined,
      options: (meta && meta.options) || undefined,
      example: (meta && meta.example) || undefined,
    });
    opts = opts || {};
    const wrap = el("div", "vrow");
    const lb = el("label");
    lb.appendChild(document.createTextNode(metaLabel(token, meta) + " "));
    const sp = el("span", "vt", "· " + token.type +
      (token.total > 1 ? " · " + token.occ + " of " + token.total : "") + " · " + token.token);
    lb.appendChild(sp);
    if (token.auto) {
      const ap = el("span", "vbadge", "auto");
      ap.style.marginLeft = "6px";
      lb.appendChild(ap);
    }
    wrap.appendChild(lb);

    // Unknown widget (never for parsed tokens): raw fallback row.
    if (!desc) {
      const inp = document.createElement("input");
      inp.type = "text";
      inp.value = pre || "";
      inp.setAttribute("aria-label", token.token);
      wrap.appendChild(inp);
      vrows.appendChild(wrap);
      const getter = { v: token, el: inp, kind: "text", get: () => inp.value, focus: () => inp.focus() };
      wireHooks(inp, opts);
      return getter;
    }

    const kind = token.type === "license" ? "select"
      : token.type === "buttongroup" ? "radio"
      : token.type === "switch" ? "checkbox"
      : token.type;
    let input;
    if (desc.paired) {
      // keyvalue: two text fields joined with "=".
      const kw = el("div", "kvpair");
      const keyEl = document.createElement("e-input");
      keyEl.setAttribute("type", "text");
      keyEl.setAttribute("name", token.iid + "#k");
      keyEl.setAttribute("aria-label", metaLabel(token, meta) + " key");
      const valEl = document.createElement("e-input");
      valEl.setAttribute("type", "text");
      valEl.setAttribute("name", token.iid);
      valEl.setAttribute("aria-label", metaLabel(token, meta) + " value");
      const parts = String(pre || "").split("=");
      kw.appendChild(keyEl);
      kw.appendChild(document.createTextNode("="));
      kw.appendChild(valEl);
      wrap.appendChild(kw);
      input = valEl;
      vrows.appendChild(wrap);
      if (parts[0]) keyEl.setAttribute("value", parts[0]);
      if (parts.length > 1) valEl.setAttribute("value", parts.slice(1).join("="));
      wireHooks(keyEl, opts);
      wireHooks(valEl, opts);
      return {
        v: token, el: valEl, kind: "keyvalue",
        get: () => {
          const k = (keyEl.value || "").trim();
          const v = valEl.value || "";
          return k !== "" ? k + "=" + v : v;
        },
        focus: () => keyEl.focus(),
      };
    }

    input = document.createElement("e-input");
    input.setAttribute("type", desc.type);
    input.setAttribute("name", token.iid);
    input.setAttribute("aria-label", metaLabel(token, meta));
    // Automatic library validation is disabled (see E7 note above):
    // validation runs explicitly through safeValidate().
    input.setAttribute("validate-on", "");
    if (desc.format) input.setAttribute("format", desc.format);
    if (desc.placeholder) input.setAttribute("placeholder", desc.placeholder);
    if (desc.description) input.setAttribute("description", desc.description);
    if (desc.min !== undefined) input.setAttribute("min", String(desc.min));
    if (desc.max !== undefined) input.setAttribute("max", String(desc.max));
    if (desc.step !== undefined) input.setAttribute("step", String(desc.step));
    if (token.type === "password") {
      input.setAttribute("action-button", "show");
      if (TOKEN_ALIAS_PASSWORD.has(token.name)) input.setAttribute("strength-meter", "false");
    }
    if (!ALWAYS_VALID.has(kind)) input.setAttribute("required", "");
    for (const c of optionChildren(desc, pre)) input.appendChild(c);
    wrap.appendChild(input);

    // File widgets: the library renders no picker (unknown action-button is
    // inert), so the host provides a Browse button beside the field.
    let browseBtn = null;
    if (token.type === "file" || token.type === "dir" || token.type === "files") {
      browseBtn = el("button", "btn btn-g", "Browse…");
      browseBtn.type = "button";
      browseBtn.setAttribute("aria-label", "Browse for " + metaLabel(token, meta));
      browseBtn.addEventListener("click", async () => {
        try {
          let picked = null;
          if (token.name === "input.dir") picked = await B().pickFolder();
          else picked = await B().pickFile("");
          if (picked) {
            input.value = picked;
            safeValidate(input);
          }
        } catch (e) {
          console.error("browse failed", e);
        }
      });
      wrap.appendChild(browseBtn);
    }

    // Regen control for .autogenerate tokens (design ↻ Regenerate).
    if (token.auto && typeof opts.regen === "function") {
      const rb = el("button", "regen", "↻ Regenerate");
      rb.type = "button";
      rb.title = "Generate a new value — you can still edit";
      rb.addEventListener("click", () => {
        try {
          const nv = opts.regen(token) || "";
          setInputValue(input, kind, nv);
          safeValidate(input);
        } catch (e) {
          console.error("regenerate failed", e);
        }
      });
      wrap.appendChild(rb);
    }

    vrows.appendChild(wrap);
    // Set value AFTER insertion (select/radio collect slotted options on connect).
    setInputValue(input, kind, pre == null ? "" : String(pre), token);
    input._ccKind = kind;
    wireHooks(input, opts);
    safeValidate(input);
    return {
      v: token, el: input, kind,
      get: () => readInputValue(input, kind, token),
      focus: () => { try { input.focus(); } catch (e) { /* noop */ } },
    };
  }

  function setInputValue(input, kind, pre, token) {
    if (kind === "checkbox") {
      // checkedDef===false starts unchecked; otherwise any non-empty pre checks.
      const checked = token && token.checkedDef === false ? pre !== "" && pre !== undefined : pre !== "";
      try {
        input.checked = !!checked;
      } catch (e) { /* noop */ }
      if (!checked) {
        try { input.value = ""; } catch (e2) { /* noop */ }
      } else if (pre) {
        try { input.value = pre; } catch (e3) { /* noop */ }
      }
      return;
    }
    if (pre === "" || pre == null) return;
    try {
      input.value = pre;
    } catch (e) { /* noop */ }
  }

  function readInputValue(input, kind, token) {
    if (kind === "checkbox") {
      let checked = false;
      try {
        checked = !!input.checked;
      } catch (e) {
        checked = input.value === "on";
      }
      return checked ? (token.params || "--flag") : "";
    }
    if (kind === "multiselect") {
      const v = input.value;
      if (Array.isArray(v)) return v.join(",");
      return v == null ? "" : String(v);
    }
    const v = input.value;
    return v == null ? "" : String(v);
  }

  function wireHooks(input, opts) {
    // hook:* events do not bubble — attach per element after insertion.
    input.addEventListener("hook:onValidate", () => {
      refreshValidity(input);
    });
    input.addEventListener("hook:onInput", () => {
      if (opts && typeof opts.onInput === "function") {
        try { opts.onInput(); } catch (e) { console.error(e); }
      }
    });
  }

  /* Collect + validate a getter list (design rules, exact message). */
  function collectInputs(getters) {
    const vals = {};
    let bad = null;
    for (const gt of getters) {
      const val = gt.get();
      vals[gt.v.iid] = val;
      if (ALWAYS_VALID.has(gt.kind)) continue;
      if (!val || (gt.kind === "number" && !isFinite(Number(val)))) {
        if (!bad) bad = gt;
      }
    }
    return { vals, bad };
  }
  function showBad(verrEl, getters) {
    // Paint library error states first (post-click: no layout-shift hazard),
    // then apply the design's own collect rules and exact message.
    for (const gt of getters) {
      if (gt && gt.el) safeValidate(gt.el);
    }
    const r = collectInputs(getters);
    if (r.bad) {
      verrEl.textContent = VALID_MSG;
      verrEl.hidden = false;
      if (r.bad.focus) r.bad.focus();
      return r;
    }
    verrEl.hidden = true;
    return r;
  }

  /* ── shared run flow (real execution + 250 ms poll) ────────────────────── */
  async function runFlow(o) {
    // o: {commandId, shell, cwd, line, status, body, dot, buttons, tname}
    const status = o.status, body = o.body;
    termShow(o.scope);
    // Echo the resolved line so a silent command still visibly passes through.
    const ph = body.querySelector(".term-empty");
    if (ph) ph.remove();
    termNote(body, "$ " + o.line);
    o.buttons.forEach((b) => {
      if (!b.dataset.origText) b.dataset.origText = b.textContent;
      b.textContent = "■ Cancel";
    });
    status.textContent = "Running…";
    status.className = "status run";
    if (o.dot) o.dot.classList.add("live");
    let cancelled = false;
    const doCancel = async () => {
      cancelled = true;
      try { await B().cancelRun(); } catch (e) { console.error(e); }
    };
    o.buttons.forEach((b) => {
      b.onclick = () => { doCancel(); };
    });
    let res;
    window.__ccDirty.runActive = true;
    try {
      const resP = B().run({ commandId: o.commandId, shell: o.shell, cwd: o.cwd, line: o.line });
      let cursor = 0;
      let running = true;
      while (running) {
        if (cancelled) break;
        try {
          const pr = await B().getRunProgress(cursor);
          if (pr && pr.lines) {
            for (const l of pr.lines) termAppend(body, l.stream, l.text);
            cursor = pr.cursor;
          }
          running = !!(pr && pr.running);
        } catch (e) {
          console.error("progress poll failed", e);
          break;
        }
        if (running) await sleep(250);
      }
      res = await resP;
      // Drain anything the final poll missed.
      try {
        const pr = await B().getRunProgress(cursor);
        if (pr && pr.lines) for (const l of pr.lines) termAppend(body, l.stream, l.text);
      } catch (e) { console.error(e); }
    } catch (e) {
      const msg = errorMessage(e, "Run failed");
      console.error("run failed:", describeError(e));
      status.textContent = msg;
      termNote(body, "error: " + msg);
      status.className = "status stopped";
      if (o.dot) o.dot.classList.remove("live");
      restoreRunButtons(o.buttons);
      window.__ccDirty.runActive = false;
      return { ok: false, error: e };
    }
    restoreRunButtons(o.buttons);
    window.__ccDirty.runActive = false;
    const secs = ((res.durationMs || 0) / 1000).toFixed(1);
    if (res.cancelled || cancelled) {
      status.textContent = "Cancelled";
      status.className = "status stopped";
      if (o.dot) o.dot.classList.remove("live");
      termNote(body, "— cancelled —");
    } else if (res.exitCode === 0) {
      status.textContent = "✓ exit 0 (" + secs + "s)";
      status.className = "status ok";
      if (o.dot) o.dot.classList.remove("live");
      termNote(body, "— exit 0 in " + secs + "s —");
    } else {
      status.textContent = "✗ exit " + res.exitCode;
      status.className = "status stopped";
      if (o.dot) o.dot.classList.remove("live");
      termNote(body, "— exit " + res.exitCode + " in " + secs + "s —");
    }
    return { ok: !res.cancelled && res.exitCode === 0, result: res };
  }
  function restoreRunButtons(buttons) {
    buttons.forEach((b) => {
      if (b.dataset.origText) b.textContent = b.dataset.origText;
      b.onclick = null;
    });
  }

  /* Expose the shared core to later components in this file. */
  window.__ccDirty = { runActive: false, authorDirty: false };
  // Close guard (task G2): while a run is active or an authoring form has
  // unsaved changes, closing shows the native confirm dialog. Deno desktop
  // 2.9.6 surfaces no window-close event to main.ts, so the webview
  // beforeunload path is the native mechanism (preventDefault + returnValue).
  window.addEventListener("beforeunload", (e) => {
    if (window.__ccDirty.runActive || window.__ccDirty.authorDirty) {
      e.preventDefault();
      e.returnValue = "";
    }
  });
  window.__cc = {
    $, el, on, sleep, B, G, errorMessage, describeError,
    SHELL_PROMPTS, SHELL_ORDER, allowedShells,
    refreshShells, loadShellChoices, shellFor, cycleShell, paintPrompt,
    shellChoice, shellLabel, shellIcon,
    humanize, metaLabel, originOf, matchMeta,
    paintCmdline, termBodyEl, termShow, termAppend, termNote, termPlaceholder, wireTermActions,
    trackValidity, gateScope, safeValidate, quickCheck, refreshValidity,
    ALWAYS_VALID, VALID_MSG,
    buildVarControl, collectInputs, showBad,
    runFlow, restoreRunButtons,
  };
})();

/* ── ccCommands — task E2 (list/run/variables/terminal) + E6 (status bar) ── */
(function () {
  "use strict";
  var CC = window.__cc;

  function markMounted(name) {
    window.__ccMounted = window.__ccMounted || {};
    window.__ccMounted[name] = true;
  }

  function commandsData() {
    return {
      cmds: [],
      query: "",
      tagFilter: null,
      sortBy: "name-asc",
      view: "command",
      ready: false,

      async init() {
        this.ready = true;
        markMounted("commands");
        await CC.refreshShells();
        await CC.loadShellChoices();
        try {
          const s = await CC.B().loadSettings();
          if (s && s.sortBy) this.sortBy = s.sortBy;
        } catch (e) {
          console.warn("loadSettings failed", e);
        }
        try {
          const v = localStorage.getItem("cc-view");
          if (v === "command" || v === "control" || v === "tool") this.view = v;
        } catch (e) { /* private mode */ }
        await this.reload();
        this.wireChrome();
        this.paint();
        this.fillStatusbar();
      },

      async reload() {
        try {
          this.cmds = await CC.B().listCommands();
        } catch (e) {
          console.error("listCommands failed", e);
          this.cmds = [];
        }
      },

      wireChrome() {
        const q = document.getElementById("q");
        if (q) {
          q.addEventListener("input", () => {
            this.query = q.value;
            this.paint();
          });
          q.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
              q.value = "";
              this.query = "";
              this.tagFilter = null;
              this.paint();
            }
          });
        }
        const vc = document.getElementById("viewCommand");
        const vv = document.getElementById("viewControl");
        const vt = document.getElementById("viewTool");
        if (vc) vc.addEventListener("click", () => this.setView("command"));
        if (vv) vv.addEventListener("click", () => this.setView("control"));
        if (vt) vt.addEventListener("click", () => this.setView("tool"));
        const count = document.getElementById("count");
        if (count) {
          count.title = "Click to change sort order";
          count.style.cursor = "pointer";
          count.addEventListener("click", () => this.cycleSort());
        }
      },

      setView(view) {
        this.view = view;
        try { localStorage.setItem("cc-view", view); } catch (e) { /* noop */ }
        this.paint();
      },

      async cycleSort() {
        this.sortBy = this.sortBy === "name-asc" ? "name-desc" : "name-asc";
        try {
          const s = await CC.B().loadSettings();
          await CC.B().saveSettings(Object.assign({}, s, { sortBy: this.sortBy }));
        } catch (e) {
          console.warn("persisting sort failed", e);
        }
        this.paint();
      },

      filtered() {
        const q = this.query.trim().toLowerCase();
        let rows = this.cmds.filter((c) => {
          if (this.tagFilter) {
            const tags = c.tags && c.tags.length ? c.tags : [c.tag || "custom"];
            if (!tags.includes(this.tagFilter)) return false;
          }
          if (!q) return true;
          return ((c.name || "") + " " + (c.cmd || "") + " " + (c.desc || "") + " " + (c.cwd || ""))
            .toLowerCase().includes(q);
        });
        rows = rows.slice();
        if (this.sortBy === "name-desc") rows.sort((a, b) => String(b.name || "").localeCompare(String(a.name || "")));
        else rows.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
        return rows;
      },

      paint() {
        const rows = this.filtered();
        const list = document.getElementById("list");
        const count = document.getElementById("count");
        if (count) {
          let txt = rows.length + " saved";
          if (this.tagFilter) txt += " · tag: " + this.tagFilter + " (click a tag to clear)";
          count.textContent = txt;
          count.title = "Sort: " + (this.sortBy === "name-desc" ? "name ↓" : "name ↑") + " — click to change";
        }
        if (!list) return;
        list.innerHTML = "";
        if (!rows.length) {
          const p = document.createElement("p");
          p.style.color = "var(--muted)";
          p.appendChild(document.createTextNode("No commands match. "));
          const a = document.createElement("a");
          a.href = "add.html";
          a.style.color = "var(--accent)";
          a.textContent = "Add a new command";
          p.appendChild(a);
          list.appendChild(p);
        }
        rows.forEach((c) => list.appendChild(this.buildCard(c)));
        this.paintTool(rows);
        this.applyView();
        document.body.classList.add("painted");
      },

      paintTool(rows) {
        // Tool View master-detail (design/index.html paintTool verbatim): the
        // left list picks, the right detail hosts the moved card so it runs
        // in place. paint() rebuilds #list every time, so leaving Tool View
        // restores every card with no extra bookkeeping.
        const layout = document.getElementById("toolLayout");
        if (!layout) return;
        const lp = document.getElementById("toolList");
        const dt = document.getElementById("toolDetail");
        const list = document.getElementById("list");
        if (!lp || !dt || !list) return;
        dt.innerHTML = "";
        lp.innerHTML = "";
        this._toolCards = [];
        const g = CC.G();
        (rows || []).forEach((c) => {
          const vars = g.parseVarInstances(c.cmd || "");
          const nInputs = vars.length;
          const sh = CC.SHELL_PROMPTS[CC.shellFor(c.id)] || CC.SHELL_PROMPTS.powershell;
          const row = document.createElement("div");
          row.className = "tool-row";
          row.dataset.id = c.id;
          const pick = document.createElement("button");
          pick.type = "button";
          pick.className = "tool-pick";
          pick.dataset.id = c.id;
          pick.setAttribute("aria-label", (c.name || "?") + (nInputs ? " — open with " + nInputs + (nInputs === 1 ? " input" : " inputs") : " — open"));
          const tx = document.createElement("span");
          tx.className = "tool-pick-text";
          const nm = document.createElement("span");
          nm.className = "tool-pick-name";
          nm.textContent = c.name || "?";
          tx.appendChild(nm);
          const tg = document.createElement("span");
          tg.className = "tag";
          tg.textContent = ((c.tags && c.tags[0]) || c.tag || "command") + (nInputs ? " · " + nInputs + (nInputs === 1 ? " input" : " inputs") : "");
          tx.appendChild(tg);
          pick.appendChild(tx);
          const go = document.createElement("span");
          go.className = "tool-go";
          go.setAttribute("aria-hidden", "true");
          go.textContent = "→";
          pick.appendChild(go);
          pick.addEventListener("click", () => {
            this.toolSelId = c.id;
            this.renderToolSelection();
          });
          const shBtn = document.createElement("button");
          shBtn.type = "button";
          shBtn.className = "tool-shell";
          shBtn.setAttribute("data-shell-id", c.id);
          shBtn.setAttribute("aria-label", "Shell: " + sh.label + " — activate to change shell");
          shBtn.title = "Shell: " + sh.label + " (click to change)";
          const im = document.createElement("img");
          im.src = sh.icon;
          im.alt = "";
          shBtn.appendChild(im);
          shBtn.addEventListener("click", () => {
            const next = CC.cycleShell(c.id);
            const card = list.querySelector('.cmd[data-id="' + c.id + '"]') || dt.querySelector('.cmd[data-id="' + c.id + '"]');
            if (card) {
              CC.paintPrompt(card, next);
              const cmd = (this.cmds || []).find((x) => x.id === c.id);
              if (cmd) CC.paintCmdline(card.querySelector(".c"), card.querySelector(".cmdline .pwd"), cmd.cmd, cmd.cwd, cmd.variables);
            }
            const cur = CC.SHELL_PROMPTS[next] || CC.SHELL_PROMPTS.powershell;
            im.src = cur.icon;
            shBtn.setAttribute("aria-label", "Shell: " + cur.label + " — activate to change shell");
            shBtn.title = "Shell: " + cur.label + " (click to change)";
          });
          row.appendChild(shBtn);
          row.appendChild(pick);
          lp.appendChild(row);
          const card = list.querySelector('.cmd[data-id="' + c.id + '"]');
          if (card) this._toolCards.push({ id: c.id, el: card, ph: null });
        });
        if (!(rows || []).length) {
          const p = document.createElement("p");
          p.className = "tool-empty";
          p.appendChild(document.createTextNode("No tools match. "));
          const a = document.createElement("a");
          a.href = "add.html";
          a.textContent = "Add a new command";
          p.appendChild(a);
          lp.appendChild(p);
          return;
        }
        if (!this.toolSelId || !rows.some((c) => c.id === this.toolSelId)) this.toolSelId = rows[0].id;
        // Only Tool View hosts the detail panel. In Command/Control View every
        // card stays in #list: the design moves the selection unconditionally,
        // which would hide a card inside the hidden panel (design defect —
        // same class of fix as the #missing fallback in E3/A9).
        if (this.view === "tool") this.renderToolSelection();
        else {
          document.querySelectorAll("#toolList .tool-row").forEach((r) => {
            r.classList.toggle("on", r.dataset.id === this.toolSelId);
          });
        }
      },

      renderToolSelection() {
        const dt = document.getElementById("toolDetail");
        const list = document.getElementById("list");
        if (!dt || !list) return;
        (this._toolCards || []).forEach((o) => {
          if (o.ph && o.ph.parentNode) {
            o.ph.parentNode.insertBefore(o.el, o.ph);
            o.ph.parentNode.removeChild(o.ph);
            o.ph = null;
          } else if (o.el.parentNode !== list) {
            list.appendChild(o.el);
          }
        });
        const found = (this._toolCards || []).filter((o) => o.id === this.toolSelId)[0];
        if (found && found.el.parentNode === list) {
          const ph = document.createElement("span");
          ph.hidden = true;
          ph.setAttribute("data-tph", found.id);
          list.insertBefore(ph, found.el);
          found.ph = ph;
          dt.appendChild(found.el);
          const pv = found.el.querySelector(".preview");
          if (pv) pv.open = false;
          if (typeof found.el._ccOpenVars === "function") found.el._ccOpenVars(false);
        }
        document.querySelectorAll("#toolList .tool-row").forEach((r) => {
          r.classList.toggle("on", r.dataset.id === this.toolSelId);
        });
      },

      applyView() {
        const view = this.view;
        document.body.dataset.view = view;
        const bc = document.getElementById("viewCommand");
        const bv = document.getElementById("viewControl");
        const bt = document.getElementById("viewTool");
        [["command", bc], ["control", bv], ["tool", bt]].forEach(([v, b]) => {
          if (!b) return;
          const isOn = view === v;
          b.classList.toggle("on", isOn);
          b.setAttribute("aria-pressed", String(isOn));
        });
        const tl = document.getElementById("toolLayout");
        if (tl) tl.hidden = view !== "tool";
        // Command View: the command is always visible (design rule). Only
        // Control View may hide it behind the closed <details>.
        document.querySelectorAll("#list .cmd").forEach((card) => {
          const pv = card.querySelector(".preview");
          if (pv && view !== "control") pv.open = true;
        });
        if (view === "control") {
          document.querySelectorAll("#list .cmd").forEach((card) => {
            if (card._ccVars && card._ccVars.length && typeof card._ccOpenVars === "function") {
              const varsBox = card.querySelector(".vars");
              if (varsBox && varsBox.hidden) card._ccOpenVars();
            }
          });
        }
      },

      buildCard(cmd) {
        const g = CC.G();
        const shellId = CC.shellFor(cmd.id);
        const sh = CC.SHELL_PROMPTS[shellId] || CC.SHELL_PROMPTS.powershell;
        const tag = (cmd.tags && cmd.tags[0]) || cmd.tag || "command";
        const html = window.Mustache.render(window.CCTemplates.card, {
          id: cmd.id,
          idHref: "command.html?id=" + encodeURIComponent(cmd.id),
          name: cmd.name || "?",
          desc: cmd.desc || "",
          tag,
          origin: CC.originOf(cmd),
          cwd: cmd.cwd || "",
          shellAria: "Shell: " + sh.label + " — activate to change shell",
          shellTitle: "Shell: " + sh.label + " (click to change)",
          shellIcon: sh.icon,
          shellPre: sh.pre,
          shellPost: sh.post,
        });
        const tmp = document.createElement("template");
        tmp.innerHTML = html.trim();
        const card = tmp.content.firstChild;
        card.setAttribute("data-run-scope", "");
        card._ccVars = g.parseVarInstances(cmd.cmd || "");
        const askMode = cmd.askMode === "once" ? "once" : "every";

        CC.paintCmdline(card.querySelector(".c"), card.querySelector(".cmdline .pwd"), cmd.cmd, cmd.cwd, cmd.variables);
        CC.paintPrompt(card, shellId);
        CC.wireTermActions(card);

        // Clickable tag → tag filter (no markup change, no redesign).
        const tagEl = card.querySelector(".tags .tag");
        if (tagEl) {
          tagEl.setAttribute("role", "button");
          tagEl.setAttribute("tabindex", "0");
          tagEl.title = "Filter by this tag";
          const toggle = () => {
            this.tagFilter = this.tagFilter === tag ? null : tag;
            this.paint();
          };
          tagEl.addEventListener("click", toggle);
          tagEl.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toggle();
            }
          });
        }

        // Input-count badge → opens the variable panel.
        const vars = card._ccVars;
        if (vars.length) {
          const b = document.createElement("button");
          b.type = "button";
          b.className = "vbadge";
          b.textContent = vars.length + (vars.length === 1 ? " input" : " inputs");
          b.title = "Show inputs";
          b.setAttribute("aria-label", b.textContent + " needed — show inputs");
          card.querySelector(".tags").appendChild(b);
          b.addEventListener("click", () => this.openVars(card, cmd));
        }

        // Shell picker: cycles installed shells only, persists per command.
        const shellBtn = card.querySelector("[data-shellbtn]");
        if (shellBtn) {
          shellBtn.addEventListener("click", () => {
            const next = CC.cycleShell(cmd.id);
            CC.paintPrompt(card, next);
            CC.paintCmdline(card.querySelector(".c"), card.querySelector(".cmdline .pwd"), cmd.cmd, cmd.cwd, cmd.variables);
          });
        }

        const runBtn = card.querySelector("[data-run]");
        const vgo = card.querySelector(".vgo");
        const vedit = card.querySelector(".vedit");
        const vunlock = card.querySelector(".vunlock");
        const vlock = card.querySelector(".vlock");
        if (vgo) vgo.setAttribute("data-vgo", "");
        if (runBtn) runBtn.addEventListener("click", () => this.runSide(card, cmd));
        if (vgo) vgo.addEventListener("click", () => this.runFromPanel(card, cmd));
        if (vedit) vedit.addEventListener("click", () => this.openVars(card, cmd, true));
        const vclose = card.querySelector(".vclose");
        if (vclose) {
          vclose.addEventListener("click", () => {
            const varsBox = card.querySelector(".vars");
            if (varsBox) varsBox.hidden = true;
            if ((card._ccVars || []).length && this.view !== "control") {
              const vd = card.querySelector(".vedit");
              if (vd) vd.hidden = false;
            }
          });
        }
        if (vunlock) {
          vunlock.addEventListener("click", async () => {
            try { await CC.B().clearValues(cmd.id); } catch (e) { console.error(e); }
            card._ccLast = null;
            card._ccLocked = false;
            vunlock.hidden = true;
            if (vlock) vlock.checked = false;
            this.refreshSavedState(card, cmd);
          });
        }
        if (vlock) {
          vlock.addEventListener("change", async () => {
            if (!vlock.checked) {
              card._ccLocked = false;
              if (vunlock) vunlock.hidden = true;
              return;
            }
            if (!card._ccGetters || !card._ccGetters.length) this.openVars(card, cmd);
            const verr = card.querySelector(".verr");
            const r = CC.showBad(verr, card._ccGetters);
            if (r.bad) {
              vlock.checked = false;
              return;
            }
            card._ccLast = r.vals;
            try { await CC.B().saveValues(cmd.id, r.vals); } catch (e) { console.error(e); }
            card._ccLocked = true;
            if (vunlock) vunlock.hidden = false;
            this.refreshSavedState(card, cmd);
          });
        }

        card._ccOpenVars = (focus) => this.openVars(card, cmd, focus);
        this.refreshSavedState(card, cmd);
        return card;
      },

      async refreshSavedState(card, cmd) {
        const vars = card._ccVars || [];
        const st = card.querySelector(".status");
        const vedit = card.querySelector(".vedit");
        if (!st) return;
        if (!vars.length || cmd.askMode !== "once") {
          if (!st.classList.contains("ok") && !st.classList.contains("stopped")) st.textContent = "Ready";
          if (vedit && !vars.length) vedit.hidden = true;
          return;
        }
        let sv = null;
        try { sv = await CC.B().getValues(cmd.id); } catch (e) { console.error(e); }
        if (this.completeVals(vars, sv)) {
          st.textContent = "Saved values ready";
          st.classList.remove("needs");
          if (vedit) vedit.hidden = false;
        } else {
          st.textContent = "Needs " + vars.length + (vars.length === 1 ? " input" : " inputs");
          st.classList.add("needs");
          if (vedit) vedit.hidden = true;
        }
      },

      completeVals(vars, map) {
        if (!map) return false;
        return vars.every((v) => {
          const got = (v.iid in map) ? map[v.iid] : map[v.key];
          if (got === undefined) return false;
          if (CC.ALWAYS_VALID.has(v.type)) return true;
          return String(got).trim() !== "";
        });
      },

      openVars(card, cmd, focus) {
        const g = CC.G();
        const varsBox = card.querySelector(".vars");
        const vrows = card.querySelector(".vrows");
        const verr = card.querySelector(".verr");
        const varsHead = card.querySelector(".vars-h");
        if (varsHead) {
          varsHead.textContent = card._ccVars.length +
            (card._ccVars.length === 1 ? " input" : " inputs") + " for " + (cmd.name || "command");
        }
        varsBox.hidden = false;
        // Command View: inputs form and terminal are mutually exclusive —
        // opening vars keeps the terminal shut (design openVars).
        if (this.view === "command") card.classList.remove("open");
        else card.classList.add("open");
        if (!card._ccGetters) {
          card._ccGetters = card._ccVars.map((v) => {
            const used = new Set();
            const meta = CC.matchMeta(cmd.variables, v, used);
            let pre = meta && meta.example !== undefined && meta.example !== "" ? String(meta.example) : undefined;
            if (pre === undefined) {
              const sv = card._ccLastSaved || {};
              pre = (v.iid in sv) ? sv[v.iid] : (v.key in sv ? sv[v.key] : undefined);
            }
            if (pre === undefined) {
              pre = (v.auto && !v.default) ? g.ccAutoGenerate(v) || "" : g.exampleFor(v, meta);
            }
            return CC.buildVarControl(vrows, v, pre || "", meta, {
              regen: (t) => g.ccAutoGenerate(t),
              onInput: () => { verr.hidden = true; },
            });
          });
          CC.gateScope(card);
        }
        if (this.view !== "control" && !card.closest("#toolDetail")) {
          const pv = card.querySelector(".preview");
          if (pv) pv.open = true;
        }
        const first = card._ccGetters[0];
        if (focus !== false && first && first.focus) first.focus();
      },

      async runSide(card, cmd) {        const status = card.querySelector(".status");
        const body = card.querySelector(".term-body");
        try {
          await this.runSideInner(card, cmd);
        } catch (e) {
          console.error("run failed", e);
          const msg = CC.errorMessage(e, "Run failed");
          if (status) {
            status.textContent = msg;
            status.className = "status stopped";
          }
          if (body) {
            CC.termShow(card);
            CC.termNote(body, "error: " + msg);
          }
        }
      },

      hideVarsForRun(card, cmd) {
        // Command View: inputs form and terminal are mutually exclusive —
        // running hides the form and reveals the terminal (design runCmd).
        if (this.view !== "command") return;
        const varsBox = card.querySelector(".vars");
        if (varsBox) varsBox.hidden = true;
        if ((card._ccVars || []).length) {
          const vedit = card.querySelector(".vedit");
          if (vedit) vedit.hidden = false;
        }
      },

      async runSideInner(card, cmd) {
        const vars = card._ccVars || [];
        const shellId = CC.shellFor(cmd.id);
        const base = {
          commandId: cmd.id, shell: shellId, cwd: cmd.cwd || "C:\\projects\\app",
          status: card.querySelector(".status"),
          body: card.querySelector(".term-body"),
          dot: card.querySelector(".dot"),
          buttons: [card.querySelector("[data-run]")].filter(Boolean),
          scope: card,
        };
        if (!vars.length) {
          this.hideVarsForRun(card, cmd);
          await CC.runFlow(Object.assign({ line: cmd.cmd }, base));
          return;
        }
        if ((cmd.askMode || "every") === "once") {
          let sv = null;
          try { sv = await CC.B().getValues(cmd.id); } catch (e) { console.error(e); }
          if (this.completeVals(vars, sv)) {
            this.hideVarsForRun(card, cmd);
            await CC.runFlow(Object.assign({ line: CC.G().renderCmd(cmd.cmd, sv) }, base));
            return;
          }
        }
        if (card._ccLocked && card._ccLast) {
          this.hideVarsForRun(card, cmd);
          await CC.runFlow(Object.assign({ line: CC.G().renderCmd(cmd.cmd, card._ccLast) }, base));
          return;
        }
        this.openVars(card, cmd);
      },

      async runFromPanel(card, cmd) {
        const verr = card.querySelector(".verr");
        try {
          await this.runFromPanelInner(card, cmd, verr);
        } catch (e) {
          console.error("run failed", e);
          verr.textContent = CC.errorMessage(e, "Run failed");
          verr.hidden = false;
        }
      },

      async runFromPanelInner(card, cmd, verr) {
        const r = CC.showBad(verr, card._ccGetters || []);
        if (r.bad) return;
        card._ccLast = r.vals;
        if ((cmd.askMode || "every") === "once") {
          try { await CC.B().saveValues(cmd.id, r.vals); } catch (e) { console.error(e); }
          this.refreshSavedState(card, cmd);
        }
        const line = CC.G().renderCmd(cmd.cmd, r.vals);
        if (line.includes("{{")) {
          verr.textContent = "A value is still missing — fill every input.";
          verr.hidden = false;
          return;
        }
        this.hideVarsForRun(card, cmd);
        await CC.runFlow({
          commandId: cmd.id, shell: CC.shellFor(cmd.id), cwd: cmd.cwd || "C:\\projects\\app",
          line,
          status: card.querySelector(".status"),
          body: card.querySelector(".term-body"),
          dot: card.querySelector(".dot"),
          buttons: [card.querySelector(".vgo"), card.querySelector("[data-run]")].filter(Boolean),
          scope: card,
        });
      },

      async fillStatusbar() {
        const bar = document.getElementById("statusbar");
        if (!bar) return;
        try {
          const [v, p] = await Promise.all([CC.B().getVersion(), CC.B().getPlatform()]);
          const sv = document.getElementById("sbVersion");
          const sp = document.getElementById("sbPlatform");
          const ss = document.getElementById("sbShells");
          if (sv) sv.textContent = "Command Centre v" + v;
          if (sp) sp.textContent = (p && p.os ? p.os + " " + (p.arch || "") : "").trim() || "unknown platform";
          if (ss) ss.textContent = "Shells: " + ((p && p.shells || []).map((s) => s.label || s.id).join(", ") || "none");
        } catch (e) {
          console.warn("status bar failed", e);
        }
      },
    };
  }

  document.addEventListener("alpine:init", function () {
    const Alpine = window.Alpine;
    if (!Alpine || typeof Alpine.data !== "function") return;
    try {
      Alpine.data("ccCommands", commandsData);
    } catch (e) {
      console.error("ccCommands registration failed", e);
    }
  });
})();

/* ── ccDetail — task E3 (badges, preview, metadata, export, run) ─────────── */
(function () {
  "use strict";
  var CC = window.__cc;

  function badge(text, cls) {
    const b = document.createElement("span");
    b.className = "badge " + cls;
    b.textContent = text;
    return b;
  }

  function detailData() {
    return {
      cmd: null,
      ready: false,

      async init() {
        this.ready = true;
        window.__ccMounted = window.__ccMounted || {};
        window.__ccMounted.detail = true;
        await CC.refreshShells();
        await CC.loadShellChoices();
        let id = null;
        try {
          id = new URLSearchParams(location.search).get("id");
        } catch (e) { id = null; }
        if (!id) return this.showMissing();
        let found = null;
        try {
          found = await CC.B().getCommand(id);
        } catch (e) {
          console.error("getCommand failed", e);
        }
        if (!found) return this.showMissing();
        this.cmd = found;
        this.paint();
      },

      showMissing() {
        // The design never unhides #missing — unknown ids must not render
        // the showcase fallback. Show the real not-found state instead.
        const miss = document.getElementById("missing");
        const detail = document.getElementById("detail");
        if (miss) miss.hidden = false;
        if (detail) detail.hidden = true;
        document.title = "Not found — Command Center";
      },

      paint() {
        const c = this.cmd;
        const g = CC.G();
        const detail = document.getElementById("detail");
        const miss = document.getElementById("missing");
        if (miss) miss.hidden = true;
        if (detail) {
          detail.hidden = false;
          detail.setAttribute("data-run-scope", "");
        }
        document.title = (c.name || "Command") + " — Command Center";
        document.getElementById("dname").textContent = c.name || "";
        document.getElementById("ddesc").textContent = c.desc || "";

        const badges = document.getElementById("dbadges");
        badges.innerHTML = "";
        badges.appendChild(badge(c.tag || (c.tags && c.tags[0]) || "command", "badge-tag"));
        badges.appendChild(badge(CC.originOf(c), "badge-npub"));
        const pubBadge = badge("not published", "badge-npub");
        pubBadge.id = "pubBadge";
        badges.appendChild(pubBadge);
        this.refreshPublished(c, pubBadge);

        document.getElementById("draw").textContent = c.cmd || "";
        const insts = g.parseVarInstances(c.cmd || "");
        const used = new Set();
        const metas = insts.map((v) => CC.matchMeta(c.variables, v, used));
        this.paintPreview(c, insts, metas);

        this.paintFields(c);
        this.paintMeta(c, insts, metas);
        this.wireRun(c, insts);
        this.wireShell(c);

        const editBtn = document.getElementById("editBtn");
        if (editBtn) editBtn.href = "add.html?id=" + encodeURIComponent(c.id);
        const pubBtn = document.getElementById("pubBtn");
        if (pubBtn) pubBtn.href = "publish.html?id=" + encodeURIComponent(c.id);
        const dlBtn = document.getElementById("dlBtn");
        if (dlBtn) dlBtn.addEventListener("click", () => this.download(c));
      },

      indexOfInst(insts, key, occ) {
        let seen = 0;
        for (let i = 0; i < insts.length; i++) {
          if (insts[i].key === key && ++seen === occ) return i;
        }
        return -1;
      },

      paintPreview(c, insts, metas) {
        const g = CC.G();
        const prev = document.getElementById("dprev");
        prev.innerHTML = "";
        const dir = c.cwd || "C:\\projects\\app";
        const sh = CC.SHELL_PROMPTS[CC.shellFor(c.id)] || CC.SHELL_PROMPTS.powershell;
        prev.appendChild(CC.el("span", "dim", sh.pre));
        prev.appendChild(CC.el("span", "pwd", dir));
        prev.appendChild(CC.el("span", "dim", sh.post));
        const counts = {};
        const re = /\{\{\s*([^{}]*?)\s*\}\}/g;
        let last = 0, m;
        const src = String(c.cmd || "");
        while ((m = re.exec(src))) {
          if (m.index > last) prev.appendChild(document.createTextNode(src.slice(last, m.index)));
          const p = g.parseToken(m[1]);
          if (p) {
            const occ = (counts[p.key] || 0) + 1;
            counts[p.key] = occ;
            let label = p.token, ex = g.exampleFor(p, null);
            const idx = this.indexOfInst(insts, p.key, occ);
            if (idx >= 0) {
              label = CC.metaLabel(insts[idx], metas[idx]);
              ex = g.exampleFor(insts[idx], metas[idx]);
            }
            const chip = CC.el("span", "ex", label);
            chip.title = p.token + " = " + ex;
            prev.appendChild(chip);
          } else {
            prev.appendChild(document.createTextNode(m[0]));
          }
          last = m.index + m[0].length;
        }
        if (last < src.length) prev.appendChild(document.createTextNode(src.slice(last)));
      },

      wireShell(c) {
        const btn = document.getElementById("shellCycle");
        if (!btn) return;
        const sync = () => {
          const sh = CC.SHELL_PROMPTS[CC.shellFor(c.id)] || CC.SHELL_PROMPTS.powershell;
          const img = document.getElementById("shellCycleImg");
          if (img) img.src = sh.icon;
          btn.setAttribute("aria-label", "Shell: " + sh.label + " — activate to change shell");
          btn.title = "Shell: " + sh.label + " (click to change)";
        };
        sync();
        btn.addEventListener("click", () => {
          CC.cycleShell(c.id);
          sync();
          btn.classList.remove("spin");
          void btn.offsetWidth;
          btn.classList.add("spin");
          const g = CC.G();
          const insts = g.parseVarInstances(c.cmd || "");
          const used = new Set();
          this.paintPreview(c, insts, insts.map((v) => CC.matchMeta(c.variables, v, used)));
        });
      },

      paintFields(c) {
        const dl = document.getElementById("dfields");
        dl.innerHTML = "";
        const rows = [
          ["Working directory", c.cwd || "C:\\projects\\app"],
          ["Ask mode", (c.askMode || "every") === "once" ? "Once, then remember" : "Every time"],
          ["ID", c.id],
          ["Source", CC.originOf(c) + (c.fromHub ? " · " + c.fromHub : "")],
        ];
        rows.forEach(([k, v]) => {
          const wrap = document.createElement("div");
          const dt = document.createElement("dt");
          dt.textContent = k;
          const dd = document.createElement("dd");
          dd.textContent = v;
          wrap.appendChild(dt);
          wrap.appendChild(dd);
          dl.appendChild(wrap);
        });
      },

      paintMeta(c, insts, metas) {
        const g = CC.G();
        const box = document.getElementById("mrows");
        box.innerHTML = "";
        const mc = document.getElementById("mcount");
        if (mc) mc.textContent = insts.length ? insts.length + (insts.length === 1 ? " input" : " inputs") : "";
        insts.forEach((v, i) => {
          const sv = metas[i];
          const row = CC.el("div", "mrow");
          const top = CC.el("div", "vmeta");
          top.appendChild(CC.el("span", null, v.token));
          top.appendChild(CC.el("span", "vpill", v.type));
          if (v.total > 1) top.appendChild(CC.el("span", "ocpill", v.occ + " of " + v.total));
          if (v.auto) top.appendChild(CC.el("span", "apill", "auto"));
          const ex = g.exampleFor(v, sv);
          top.appendChild(CC.el("span", "vex", "→ " + (ex === "" ? "(empty)" : ex)));
          row.appendChild(top);
          const lab = CC.el("div", "mlabel");
          lab.appendChild(CC.el("strong", null, CC.metaLabel(v, sv)));
          const d = sv && sv.description && String(sv.description).trim() !== "" ? String(sv.description).trim() : "";
          lab.appendChild(CC.el("span", null, d === "" ? "No description yet." : d));
          row.appendChild(lab);
          if (["select", "radio", "buttongroup", "multiselect", "license"].includes(v.type)) {
            const opts = (sv && sv.options && sv.options.length) ? sv.options
              : (v.optionsArr || []).map((o) => ({ value: o, label: o, description: "" }));
            if (opts.length) {
              const t = document.createElement("table");
              t.className = "optable";
              const tr = document.createElement("tr");
              ["Option", "Label", "Description"].forEach((h) => {
                const th = document.createElement("th");
                th.textContent = h;
                tr.appendChild(th);
              });
              t.appendChild(tr);
              opts.forEach((o) => {
                const r = document.createElement("tr");
                const c1 = document.createElement("td");
                c1.className = "mono";
                c1.textContent = o.value;
                const c2 = document.createElement("td");
                c2.textContent = o.label || o.value;
                const c3 = document.createElement("td");
                c3.textContent = o.description || "";
                r.appendChild(c1);
                r.appendChild(c2);
                r.appendChild(c3);
                t.appendChild(r);
              });
              row.appendChild(t);
            }
          }
          box.appendChild(row);
        });
      },

      async refreshPublished(c, pubBadge) {
        try {
          const queue = await CC.B().publishQueue();
          const hit = (queue || []).find((r) => r && (r.commandId === c.id));
          if (hit) {
            pubBadge.textContent = "published ✓";
            pubBadge.className = "badge badge-pub";
            const ps = document.getElementById("pubStatus");
            if (ps) ps.textContent = "Status: " + (hit.status || "pending-review");
          }
        } catch (e) {
          console.warn("publishQueue failed", e);
        }
      },

      wireRun(c, insts) {
        const g = CC.G();
        const rrows = document.getElementById("rrows");
        const rerr = document.getElementById("rerr");
        const runBtn = document.getElementById("runBtn");
        const runStatus = document.getElementById("runStatus");
        const rterm = document.getElementById("rterm");
        const rbody = document.getElementById("rbody");
        const rdot = document.getElementById("rdot");
        const rtname = document.getElementById("rtname");
        if (rtname) rtname.textContent = c.name || "";
        const rc = document.getElementById("rcount");
        if (rc) rc.textContent = insts.length ? insts.length + (insts.length === 1 ? " input" : " inputs") : "";
        const runEmpty = document.getElementById("runEmpty");
        if (runEmpty) runEmpty.hidden = insts.length > 0;
        CC.wireTermActions(document.getElementById("detail"));
        runBtn.setAttribute("data-run", "");
        const getters = insts.map((v) => {
          const used = new Set();
          const meta = CC.matchMeta(c.variables, v, used);
          let pre = meta && meta.example !== undefined && meta.example !== "" ? String(meta.example) : undefined;
          if (pre === undefined) pre = (v.auto && !v.default) ? g.ccAutoGenerate(v) || "" : g.exampleFor(v, meta);
          return CC.buildVarControl(rrows, v, pre || "", meta, {
            regen: (t) => g.ccAutoGenerate(t),
            onInput: () => { rerr.hidden = true; },
          });
        });
        CC.gateScope(document.getElementById("detail"));
        // Prefill saved values for ask-once commands.
        if ((c.askMode || "every") === "once") {
          CC.B().getValues(c.id).then((sv) => {
            if (!sv) return;
            getters.forEach((gt) => {
              const got = (gt.v.iid in sv) ? sv[gt.v.iid] : sv[gt.v.key];
              if (got !== undefined) {
                try {
                  if (gt.kind === "checkbox") gt.el.checked = got !== "";
                  else gt.el.value = got;
                  CC.safeValidate(gt.el);
                } catch (e) { /* best effort */ }
              }
            });
          }).catch(console.error);
        }
        runBtn.addEventListener("click", async () => {
          try {
            const r = CC.showBad(rerr, getters);
            if (r.bad) return;
            if ((c.askMode || "every") === "once") {
              try { await CC.B().saveValues(c.id, r.vals); } catch (e) { console.error(e); }
            }
            const line = g.renderCmd(c.cmd, r.vals);
            if (line.includes("{{")) {
              rerr.textContent = "A value is still missing — fill every input.";
              rerr.hidden = false;
              return;
            }
            await CC.runFlow({
              commandId: c.id, shell: CC.shellFor(c.id), cwd: c.cwd || "C:\\projects\\app",
              line, status: runStatus, body: rbody, dot: rdot,
              buttons: [runBtn], scope: document.getElementById("detail"),
            });
          } catch (e) {
            console.error("run failed", e);
            rerr.textContent = CC.errorMessage(e, "Run failed");
            rerr.hidden = false;
          }
        });
      },

      async download(c) {
        let doc = null;
        try {
          doc = await CC.B().publishExport(c.id);
        } catch (e) {
          console.error("publishExport failed", e);
        }
        if (!doc) return;
        const blob = new Blob([JSON.stringify(doc, null, 2)], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "command-" + String(c.id).replace(/[^a-zA-Z0-9_-]+/g, "-") + ".metadata.json";
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          try { URL.revokeObjectURL(a.href); } catch (e) { /* noop */ }
          a.remove();
        }, 1000);
      },
    };
  }

  document.addEventListener("alpine:init", function () {
    const Alpine = window.Alpine;
    if (!Alpine || typeof Alpine.data !== "function") return;
    try {
      Alpine.data("ccDetail", detailData);
    } catch (e) {
      console.error("ccDetail registration failed", e);
    }
  });
})();

/* ── ccLearn — task E5 (reference rows from the live registry) ──────────────
 * Rows render client-side from window.CCGrammar.CC_INPUT_TYPES (the same
 * table Deno tests), so the page cannot drift from the 30-row table.
 * Retired names are never listed. build-learn.ts guards the skeleton.
 */
(function () {
  "use strict";
  var CC = window.__cc;

  // Design filter groups (learn.html #w values) → registry widgets.
  var GROUP_OF = {
    file: "file",
    text: "text",
    textarea: "text",
    keyvalue: "text",
    number: "number",
    date: "date",
    time: "date",
    datetime: "date",
    color: "date",
    password: "date",
    select: "choice",
    radio: "choice",
    buttongroup: "choice",
    multiselect: "choice",
    license: "choice",
    checkbox: "flag",
    switch: "flag",
    range: "range",
  };
  var GROUP_LABEL = {
    file: "File",
    text: "Text",
    number: "Number",
    date: "Date · Color · Secret",
    choice: "Choice",
    flag: "Flag",
    range: "Range",
  };
  var GROUP_ORDER = ["file", "text", "number", "date", "choice", "flag", "range"];

  function learnData() {
    return {
      rows: [],
      ready: false,

      init() {
        this.ready = true;
        window.__ccMounted = window.__ccMounted || {};
        window.__ccMounted.learn = true;
        this.build();
        const q = document.getElementById("q");
        const w = document.getElementById("w");
        if (q) q.addEventListener("input", () => this.paint());
        if (w) w.addEventListener("change", () => this.paint());
        this.paint();
      },

      build() {
        const g = CC.G();
        const tbody = document.getElementById("rows");
        tbody.innerHTML = "";
        this.rows = [];
        for (const row of g.CC_INPUT_TYPES) {
          const token = g.parseToken(row[0]);
          if (!token) continue;
          const tr = document.createElement("tr");
          tr.className = "row";
          tr.dataset.group = GROUP_OF[token.type] || "text";
          tr.dataset.search = (row[0] + " " + (row[2] || "") + " " + token.type).toLowerCase();
          // Option cell: token + label.
          const opt = document.createElement("td");
          opt.className = "opt";
          const code = document.createElement("code");
          code.className = "tok";
          const fullToken = "{{" + row[0] + (row[3] ? ":" + row[3] : "") + "}}";
          // Long default lists (country: 249 options) would make the row
          // unreadable — truncate display, keep full text on title. The Copy
          // button always copies the complete token.
          code.textContent = fullToken.length > 120 ? fullToken.slice(0, 117) + "…" : fullToken;
          code.title = fullToken;
          opt.appendChild(code);
          const pill = document.createElement("span");
          pill.className = "pill";
          pill.textContent = token.type;
          opt.appendChild(pill);
          opt.appendChild(document.createElement("br"));
          opt.appendChild(document.createTextNode(row[2] || ""));
          tr.appendChild(opt);
          // See-it cell: live control from the shared descriptor.
          const see = document.createElement("td");
          see.className = "see";
          const desc = g.renderToken(token, g.exampleFor(token, null), null);
          if (desc) {
            const input = document.createElement("e-input");
            input.setAttribute("type", desc.type);
            input.setAttribute("name", token.iid);
            input.setAttribute("aria-label", row[2] || row[0]);
            input.setAttribute("validate-on", "");
            if (desc.format) input.setAttribute("format", desc.format);
            if (desc.min !== undefined) input.setAttribute("min", String(desc.min));
            if (desc.max !== undefined) input.setAttribute("max", String(desc.max));
            if (desc.step !== undefined) input.setAttribute("step", String(desc.step));
            if (token.type === "password") input.setAttribute("action-button", "show");
            for (const o of desc.options || []) {
              const c = document.createElement(o.tag);
              c.setAttribute("value", o.value);
              c.textContent = o.label || o.value;
              if (o.value === desc.value || (o.tag !== "e-checkbox-option" && !desc.value)) {
                if (o.tag !== "e-checkbox-option") c.setAttribute("selected", "");
              }
              input.appendChild(c);
            }
            see.appendChild(input);
            // File rows: the library renders no picker, so the host provides
            // a Browse button beside the field (same as buildVarControl).
            if (token.name === "input.file" || token.name === "input.dir" || token.name === "input.files") {
              const browseBtn = document.createElement("button");
              browseBtn.type = "button";
              browseBtn.className = "btn btn-g";
              browseBtn.textContent = "Browse…";
              browseBtn.setAttribute("aria-label", "Browse for " + (row[2] || row[0]));
              browseBtn.addEventListener("click", async () => {
                try {
                  let picked = null;
                  if (token.name === "input.dir") picked = await CC.B().pickFolder();
                  else picked = await CC.B().pickFile("");
                  if (picked) {
                    input.value = picked;
                    CC.safeValidate(input);
                  }
                } catch (e) { console.error("browse failed", e); }
              });
              see.appendChild(browseBtn);
            }
            if (desc.value) {
              try { input.setAttribute("value", desc.value); } catch (e) { /* noop */ }
            }
            input.addEventListener("hook:onValidate", () => {
              CC.trackValidity(input, input.valid);
            });
          } else {
            see.appendChild(document.createTextNode("—"));
          }
          tr.appendChild(see);
          // Use cell: copy button.
          const use = document.createElement("td");
          use.className = "use";
          const cp = document.createElement("button");
          cp.type = "button";
          cp.className = "btn btn-g";
          cp.textContent = "Copy";
          cp.setAttribute("aria-label", "Copy " + row[0]);
          cp.addEventListener("click", () => {
            const tok = "{{" + row[0] + (row[3] ? ":" + row[3] : "") + "}}";
            if (navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard.writeText(tok).catch(console.error);
            }
            cp.textContent = "Copied ✓";
            setTimeout(() => { cp.textContent = "Copy"; }, 1200);
          });
          use.appendChild(cp);
          tr.appendChild(use);
          tbody.appendChild(tr);
          this.rows.push(tr);
        }
        // Group header rows (hidden with their group when filtered empty).
        const byGroup = {};
        this.rows.forEach((tr) => {
          (byGroup[tr.dataset.group] = byGroup[tr.dataset.group] || []).push(tr);
        });
        GROUP_ORDER.forEach((grp) => {
          const members = byGroup[grp] || [];
          if (!members.length) return;
          const hr = document.createElement("tr");
          hr.dataset.groupHeader = grp;
          const th = document.createElement("th");
          th.className = "group";
          th.colSpan = 3;
          th.textContent = GROUP_LABEL[grp] || grp;
          hr.appendChild(th);
          tbody.insertBefore(hr, members[0]);
        });
      },

      paint() {
        const q = (document.getElementById("q") || {}).value || "";
        const w = (document.getElementById("w") || {}).value || "";
        const needle = q.trim().toLowerCase();
        let shown = 0;
        this.rows.forEach((tr) => {
          const okQ = !needle || tr.dataset.search.includes(needle);
          const okW = !w || tr.dataset.group === w;
          const show = okQ && okW;
          tr.hidden = !show;
          if (show) shown++;
        });
        // Hide group headers whose group is fully hidden.
        document.querySelectorAll("#rows tr[data-group-header]").forEach((hr) => {
          const grp = hr.dataset.groupHeader;
          const anyShown = this.rows.some((tr) => tr.dataset.group === grp && !tr.hidden);
          hr.hidden = !anyShown;
        });
        const count = document.getElementById("count");
        if (count) count.textContent = shown === 1 ? "1 option" : shown + " options";
        const empty = document.getElementById("empty");
        if (empty) empty.hidden = shown !== 0;
      },
    };
  }

  document.addEventListener("alpine:init", function () {
    const Alpine = window.Alpine;
    if (!Alpine || typeof Alpine.data !== "function") return;
    try {
      Alpine.data("ccLearn", learnData);
    } catch (e) {
      console.error("ccLearn registration failed", e);
    }
  });
})();

/* ── ccAuthor — task E4 (editor, preview, metadata, save/edit) ──────────────
 * CodeMirror 6 mounts over #cmd when window.__ccCM is available (cm-boot.js);
 * the #cmd textarea is the offline fallback. cmdText() reads whichever lives.
 */
(function () {
  "use strict";
  var CC = window.__cc;

  function authorData() {
    return {
      editingId: null,
      cmView: null,
      meta: {}, // (iid|key) → {label, description, options:{value:{label,description}}}
      vals: {}, // iid → preview value (persisted as example on save)
      lastKeys: "",
      ready: false,

      async init() {
        this.ready = true;
        window.__ccMounted = window.__ccMounted || {};
        window.__ccMounted.author = true;
        await CC.refreshShells();
        await CC.loadShellChoices();
        this.readEditingId();
        this.tryMountCM();
        // Late CM arrival (slow module fetch) upgrades the textarea once.
        document.addEventListener("cc:cm-ready", () => this.tryMountCM(), { once: true });
        const markDirty = () => {
          if (!this._loading) window.__ccDirty.authorDirty = true;
        };
        const cmd = document.getElementById("cmd");
        if (cmd) cmd.addEventListener("input", () => this.paint());
        const nameEl = document.getElementById("name");
        if (nameEl) nameEl.addEventListener("input", () => this.clearStaleFlags());
        const cwd = document.getElementById("cwd");
        if (cwd) cwd.addEventListener("input", () => this.paintPreview());
        const form = document.getElementById("f");
        if (form) {
          form.addEventListener("submit", (e) => this.save(e));
          // Any user edit (fields, radios, variable controls) dirties the form.
          // Programmatic prefill assigns .value directly (no events) — safe.
          for (const t of ["input", "change", "e:input", "e:change"]) {
            form.addEventListener(t, markDirty);
          }
        }
        const cwdbtn = document.getElementById("cwdbtn");
        if (cwdbtn) {
          cwdbtn.addEventListener("click", async () => {
            try {
              const picked = await CC.B().pickFolder();
              if (picked && cwd) {
                cwd.value = picked;
                this.paintPreview();
              }
            } catch (e) {
              console.error("pickFolder failed", e);
            }
          });
        }
        if (this.editingId) await this.prefill();
        this.paint();
      },

      readEditingId() {
        let id = null;
        try {
          id = new URLSearchParams(location.search).get("id");
        } catch (e) { id = null; }
        if (id) {
          this.editingId = id;
          document.title = "Edit command — Command Center";
          const ft = document.getElementById("formTitle");
          if (ft) ft.textContent = "Edit command";
          const fl = document.getElementById("formLede");
          if (fl) fl.textContent = "Update the reusable command. Fields marked * are required.";
          this.addDuplicateButton();
        }
      },

      addDuplicateButton() {
        const saveBtn = document.getElementById("saveBtn");
        if (!saveBtn || document.getElementById("dupBtn")) return;
        const b = document.createElement("button");
        b.type = "button";
        b.id = "dupBtn";
        b.className = "btn btn-g";
        b.textContent = "Duplicate";
        b.addEventListener("click", async () => {
          try {
            const r = await CC.B().duplicateCommand(this.editingId);
            location.href = "add.html?id=" + encodeURIComponent(r.id);
          } catch (e) {
            console.error("duplicate failed", e);
          }
        });
        saveBtn.after(b);
      },

      tryMountCM() {
        if (this.cmView) return;
        const boot = window.__ccCM;
        const textarea = document.getElementById("cmd");
        if (!boot || !textarea) return;
        try {
          const view = boot.mount(textarea, () => {
            if (!this._loading) window.__ccDirty.authorDirty = true;
            this.paint();
          });
          if (view) {
            this.cmView = view;
            window.__cmView = view;
          }
        } catch (e) {
          console.warn("CodeMirror mount failed, keeping textarea", e);
        }
      },

      cmdText() {
        const textarea = document.getElementById("cmd");
        const boot = window.__ccCM;
        if (boot) {
          try { return boot.read(textarea, this.cmView); } catch (e) { /* fall through */ }
        }
        if (this.cmView && this.cmView.state) {
          try { return this.cmView.state.doc.toString(); } catch (e2) { /* fall through */ }
        }
        return textarea ? textarea.value : "";
      },

      focusCmd() {
        const boot = window.__ccCM;
        const textarea = document.getElementById("cmd");
        if (boot) boot.focus(this.cmView, textarea);
        else if (textarea) textarea.focus();
      },

      async prefill() {
        let found = null;
        this._loading = true;
        try {
          found = await CC.B().getCommand(this.editingId);
        } catch (e) {
          console.error("getCommand failed", e);
        } finally {
          if (!found) this._loading = false;
        }
        if (!found) return;
        // Restore author metadata + preview values FIRST: pushing the template
        // into the mounted editor below fires a synchronous paint, which must
        // already see the restored metadata.
        for (const m of found.variables || []) {
          const k = (m && (m.iid || m.key)) || "";
          if (!k) continue;
          const entry = {
            label: m.label || "",
            description: m.description || "",
            options: {},
          };
          for (const o of m.options || []) {
            entry.options[o.value] = { label: o.label || "", description: o.description || "" };
          }
          this.meta[k] = entry;
          if (m.example !== undefined && m.example !== "") this.vals[k] = String(m.example);
        }
        const set = (id, v) => {
          const n = document.getElementById(id);
          if (n) n.value = v || "";
        };
        set("name", found.name);
        set("desc", found.desc);
        set("cwd", found.cwd);
        set("tag", (found.tags && found.tags[0]) || found.tag || "custom");
        const template = found.cmd || "";
        const textarea = document.getElementById("cmd");
        if (textarea) textarea.value = template;
        if (this.cmView) {
          // Push the loaded template into the mounted editor.
          try {
            this.cmView.dispatch({
              changes: { from: 0, to: this.cmView.state.doc.length, insert: template },
            });
          } catch (e) {
            console.warn("CM doc sync failed", e);
          }
        }
        const radios = document.querySelectorAll('input[name="askmode"]');
        radios.forEach((r) => {
          r.checked = r.value === (found.askMode || "every");
        });
        // Force the varlist to (re)build against the restored metadata even
        // if an intermediate paint already ran on the same token set.
        this.lastKeys = "";
        this._loading = false;
      },

      paint() {
        this.paintPreview();
        this.paintVarlist();
        this.clearStaleFlags();
      },

      // Drop field-error flags that the current values no longer deserve.
      // Flags are only ever ADDED on submit; clearing here keeps the message
      // honest while typing (CodeMirror or textarea alike) without nagging
      // on first keystrokes.
      clearStaleFlags() {
        const nameEl = document.getElementById("name");
        if (nameEl && nameEl.value.trim().length > 1) {
          document.getElementById("fw-name").classList.remove("invalid");
        }
        if (this.cmdText().trim().length > 1) {
          document.getElementById("fw-cmd").classList.remove("invalid");
        }
      },

      cwdDisplay() {
        const cwd = document.getElementById("cwd");
        const v = cwd ? cwd.value.trim() : "";
        return v || "C:\\projects\\app";
      },

      paintPreview() {
        const g = CC.G();
        const prev = document.getElementById("prev");
        const raw = this.cmdText();
        const t = raw.trim();
        const dir = this.cwdDisplay();
        prev.innerHTML = "";
        const ps = document.createElement("span");
        ps.className = "dim";
        ps.textContent = "PS ";
        const pwd = document.createElement("span");
        pwd.className = "pwd";
        pwd.textContent = dir;
        const gt = document.createElement("span");
        gt.className = "dim";
        gt.textContent = "> ";
        prev.appendChild(ps);
        prev.appendChild(pwd);
        prev.appendChild(gt);
        if (!t) {
          const hint = document.createElement("span");
          hint.className = "dim";
          hint.textContent = "your command appears here…";
          prev.appendChild(hint);
          return;
        }
        const re = /\{\{\s*([^{}]*?)\s*\}\}/g;
        let last = 0, m;
        const occCounts = {};
        while ((m = re.exec(raw))) {
          if (m.index > last) prev.appendChild(document.createTextNode(raw.slice(last, m.index)));
          const p = g.parseToken(m[1]);
          if (p) {
            const occ = (occCounts[p.key] || 0) + 1;
            occCounts[p.key] = occ;
            const iid = g.ccInstanceKey(p.key, occ);
            const shown = (iid in this.vals) ? this.vals[iid]
              : (p.key in this.vals) ? this.vals[p.key]
              : ((p.auto && !p.default) ? (g.ccAutoGenerate(p) || "") : g.exampleFor(p, null));
            const chip = document.createElement("span");
            chip.className = "ex";
            chip.textContent = shown;
            chip.title = p.token;
            prev.appendChild(chip);
          } else {
            prev.appendChild(document.createTextNode(m[0]));
          }
          last = m.index + m[0].length;
        }
        if (last < raw.length) prev.appendChild(document.createTextNode(raw.slice(last)));
      },

      metaFor(v) {
        const store = this.meta;
        const k = (v && (v.iid || v.key)) || "";
        let m = store[k];
        if (!m && v && v.iid && v.iid !== v.key && store[v.key]) {
          m = store[v.key];
          store[k] = m;
        }
        if (!m) {
          let lbl = CC.humanize(v.name);
          if (v.total > 1) lbl += " " + v.occ;
          if (v.auto) lbl += " (auto)";
          m = { label: lbl, description: "", options: {} };
          store[k] = m;
        }
        if (!m.options) m.options = {};
        return m;
      },

      paintVarlist() {
        const g = CC.G();
        const list = document.getElementById("varlist");
        const rows = document.getElementById("varrows");
        const ask = document.getElementById("fw-ask");
        const insts = g.parseVarInstances(this.cmdText());
        const keys = insts.map((v) => v.iid).join("|");
        if (keys !== this.lastKeys) {
          this.lastKeys = keys;
          rows.innerHTML = "";
          insts.forEach((v) => this.buildAuthorRow(rows, v));
        }
        const show = insts.length > 0;
        list.hidden = !show;
        if (ask) ask.hidden = !show;
      },

      buildAuthorRow(rows, v) {
        const g = CC.G();
        const meta = this.metaFor(v);
        const ik = v.iid || v.key;
        if (!Object.prototype.hasOwnProperty.call(this.vals, ik)) {
          this.vals[ik] = (v.auto && !v.default) ? (g.ccAutoGenerate(v) || "") : g.exampleFor(v, meta.example ? { example: meta.example } : null);
        }
        const row = document.createElement("div");
        row.className = "vrow";
        // Value control (shared input layer + regen).
        const holder = document.createElement("div");
        row.appendChild(holder);
        const vex = document.createElement("div");
        vex.className = "vex";
        row.appendChild(vex);
        const commit = (val) => {
          this.vals[ik] = val;
          this.paintPreview();
          vex.textContent = "→ " + (val === "" ? "(empty)" : val);
        };
        const getter = CC.buildVarControl(holder, v, this.vals[ik], meta, {
          regen: (t) => g.ccAutoGenerate(t),
          onInput: () => {
            try { commit(getter.get()); } catch (e) { /* control not ready */ }
          },
        });
        // The shared builder wraps its control in div.vrow; the author row
        // already carries .vrow, so drop the nested one (no double styling).
        const nested = holder.querySelector(":scope > .vrow");
        if (nested) nested.classList.remove("vrow");
        // Seed the → readout without overwriting the stored value.
        try {
          const cur = getter.get();
          vex.textContent = "→ " + (cur === "" ? "(empty)" : cur);
        } catch (e) { /* noop */ }
        // Metadata editors (label / description / per-option labels).
        const wrap = document.createElement("div");
        wrap.className = "mwrap";
        const grid = document.createElement("div");
        grid.className = "mgrid";
        const lab = document.createElement("input");
        lab.type = "text";
        lab.value = meta.label || "";
        lab.placeholder = "Label — e.g. " + CC.humanize(v.name);
        lab.setAttribute("aria-label", "Label for " + v.token);
        lab.maxLength = 60;
        lab.addEventListener("input", () => {
          meta.label = lab.value;
          this.paintPreview();
        });
        const des = document.createElement("input");
        des.type = "text";
        des.value = meta.description || "";
        des.placeholder = "Description — e.g. value for " + v.token;
        des.setAttribute("aria-label", "Description for " + v.token);
        des.addEventListener("input", () => { meta.description = des.value; });
        grid.appendChild(lab);
        grid.appendChild(des);
        wrap.appendChild(grid);
        if (["select", "radio", "buttongroup", "multiselect", "license"].includes(v.type)) {
          const arr = (v.optionsArr && v.optionsArr.length ? v.optionsArr : []);
          arr.forEach((optVal) => {
            const orow = document.createElement("div");
            orow.className = "mgrid";
            const oval = document.createElement("span");
            oval.className = "mono";
            oval.textContent = optVal;
            const olab = document.createElement("input");
            olab.type = "text";
            olab.value = ((meta.options[optVal] || {}).label) || "";
            olab.placeholder = "Label — defaults to " + optVal;
            olab.setAttribute("aria-label", "Label for option " + optVal);
            const odesc = document.createElement("input");
            odesc.type = "text";
            odesc.value = ((meta.options[optVal] || {}).description) || "";
            odesc.placeholder = "Description (optional)";
            odesc.setAttribute("aria-label", "Description for option " + optVal);
            olab.addEventListener("input", () => {
              meta.options[optVal] = meta.options[optVal] || {};
              meta.options[optVal].label = olab.value;
            });
            odesc.addEventListener("input", () => {
              meta.options[optVal] = meta.options[optVal] || {};
              meta.options[optVal].description = odesc.value;
            });
            orow.appendChild(oval);
            orow.appendChild(olab);
            orow.appendChild(odesc);
            wrap.appendChild(orow);
          });
        }
        row.appendChild(wrap);
        rows.appendChild(row);
      },

      async save(e) {
        e.preventDefault();
        const g = CC.G();
        const nameEl = document.getElementById("name");
        const name = nameEl.value.trim();
        const template = this.cmdText().trim();
        const okN = name.length > 1, okC = template.length > 1;
        document.getElementById("fw-name").classList.toggle("invalid", !okN);
        document.getElementById("fw-cmd").classList.toggle("invalid", !okC);
        if (!okN) { nameEl.focus(); return; }
        if (!okC) { this.focusCmd(); return; }
        const vars = g.parseVarInstances(this.cmdText()).map((v) => {
          const out = {
            key: v.key, iid: v.iid, occ: v.occ, total: v.total,
            type: v.type, name: v.name, params: v.params, auto: v.auto,
            default: v.default, token: v.token,
          };
          if (v.checkedDef !== null && v.checkedDef !== undefined) out.checkedDef = v.checkedDef;
          if (v.optionsArr) out.optionsArr = v.optionsArr.slice();
          if (v.rangeDef) out.rangeDef = Object.assign({}, v.rangeDef);
          const m = this.meta[(v.iid || v.key)] || this.meta[v.key];
          if (m) {
            out.label = (m.label || "").trim();
            out.description = (m.description || "").trim();
            if (["select", "radio", "buttongroup", "multiselect", "license"].includes(v.type)) {
              const arr = v.optionsArr && v.optionsArr.length ? v.optionsArr : [];
              out.options = arr.map((o) => {
                const om = (m.options || {})[o] || {};
                return { value: o, label: (om.label || "").trim() || o, description: (om.description || "").trim() };
              });
            }
          }
          const vs = this.vals[(v.iid || v.key)];
          if (vs !== undefined) out.example = vs;
          return out;
        });
        const picked = document.querySelector('input[name="askmode"]:checked');
        const askMode = vars.length && picked ? picked.value : "every";
        const cwdEl = document.getElementById("cwd");
        const dir = (cwdEl ? cwdEl.value.trim() : "") || "";
        const descEl = document.getElementById("desc");
        const descText = (descEl ? descEl.value.trim() : "") || "Custom command added by user.";
        const tagEl = document.getElementById("tag");
        const tagText = (tagEl && tagEl.value.trim()) || "custom";
        const payload = {
          command: template,
          title: name,
          description: descText,
          source_folder: dir,
          tags: [tagText],
          variables: vars,
          askMode,
          custom: true,
        };
        if (this.editingId) payload.id = this.editingId;
        let id = this.editingId;
        const formErr = document.getElementById("formErr");
        if (formErr) formErr.hidden = true;
        try {
          const r = await CC.B().saveCommand(payload);
          id = r.id;
        } catch (err) {
          console.error("save failed", err);
          // The field values are valid here (checked above) — report the
          // backend failure on the form, not on the command field.
          if (formErr) {
            formErr.textContent = "Could not save: " + CC.errorMessage(err);
            formErr.hidden = false;
          }
          return;
        }
        const ok = document.getElementById("ok");
        if (ok) ok.style.display = "block";
        window.__ccDirty.authorDirty = false;
        location.href = "command.html?id=" + encodeURIComponent(id);
      },

      focusCmd() {
        const boot = window.__ccCM;
        const textarea = document.getElementById("cmd");
        if (boot) boot.focus(this.cmView, textarea);
        else if (textarea) textarea.focus();
      },
    };
  }

  document.addEventListener("alpine:init", function () {
    const Alpine = window.Alpine;
    if (!Alpine || typeof Alpine.data !== "function") return;
    try {
      Alpine.data("ccAuthor", authorData);
    } catch (e) {
      console.error("ccAuthor registration failed", e);
    }
  });
})();

/* ── ccHub (static data) / ccPublish stub.
 * The hub renders the design's featured packages (PKGS) and all package
 * managers (PMS) from static data with the design's localStorage simulation
 * (cc-pm, cc-pkgs, cc-clis, cc-hub-tab). The commands panel stays empty until
 * Phase F (hub.ts + F3 component) fills it from real data — the design's demo
 * HUB array is deliberately NOT ported. ccPublish stays a stub (F4).
 */
(function () {
  "use strict";

  function markMounted(name) {
    window.__ccMounted = window.__ccMounted || {};
    window.__ccMounted[name] = true;
  }

  function hubStaticData() {
    return {
      ready: false,
      async init() {
        /* ---- Tabs (Commands / Packages / Package Managers) — design verbatim ---- */
        const TAB_IDS = ["commands", "packages", "managers"];
        let activeTab = "commands";
        try {
          const u = new URLSearchParams(location.search).get("tab");
          const s = localStorage.getItem("cc-hub-tab");
          activeTab = TAB_IDS.includes(u) ? u : (TAB_IDS.includes(s) ? s : "commands");
        } catch (e) { /* noop */ }
        function setTab(name, focus) {
          if (!TAB_IDS.includes(name)) name = "commands";
          activeTab = name;
          TAB_IDS.forEach(function (t) {
            const b = document.getElementById("tab-" + t), p = document.getElementById("panel-" + t);
            if (!b) return;
            const on = t === name;
            b.classList.toggle("on", on);
            b.setAttribute("aria-selected", on ? "true" : "false");
            if (on) { b.removeAttribute("tabindex"); } else { b.setAttribute("tabindex", "-1"); }
            if (p) { if (on) { p.removeAttribute("hidden"); } else { p.setAttribute("hidden", ""); } }
          });
          try { localStorage.setItem("cc-hub-tab", name); } catch (e) { /* noop */ }
          if (focus) document.getElementById("tab-" + name).focus();
        }
        TAB_IDS.forEach(function (t) {
          const b = document.getElementById("tab-" + t);
          if (b) b.addEventListener("click", function () { setTab(t); });
        });
        const htabs = document.querySelector(".htabs");
        if (htabs) htabs.addEventListener("keydown", function (e) {
          const i = TAB_IDS.indexOf(activeTab);
          let n = null;
          if (e.key === "ArrowRight") n = TAB_IDS[(i + 1) % TAB_IDS.length];
          else if (e.key === "ArrowLeft") n = TAB_IDS[(i + TAB_IDS.length - 1) % TAB_IDS.length];
          else if (e.key === "Home") n = TAB_IDS[0];
          else if (e.key === "End") n = TAB_IDS[TAB_IDS.length - 1];
          if (n) { e.preventDefault(); setTab(n, true); }
        });

        /* ---- Package managers (static data from design/hub.html) ---- */
        const PMS = [
          { id: "winget", name: "WinGet", kind: "bundled", by: "Microsoft · bundled with Windows 11", desc: "Windows Package Manager. Ships with Windows 11 — check it before installing anything else.", cmd: "winget --version", provides: "winget" },
          { id: "scoop", name: "Scoop", kind: "script", by: "@scoop-installer · demo", desc: "Command-line installer for portable dev tools. Keeps shims outside Program Files.", cmd: "Set-ExecutionPolicy Bypass -Scope Process -Force; irm get.scoop.sh | iex", provides: "scoop" },
          { id: "choco", name: "Chocolatey", kind: "script", by: "@chocolatey · demo", desc: "Machine-wide Windows packages with version pinning. Needs an elevated shell.", cmd: "Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))", provides: "choco" },
          { id: "bun", name: "Bun", kind: "runtime", by: "@oven-sh · demo", desc: "Fast JS runtime and package manager. Installs npm-compatible packages with one binary.", cmd: "powershell -c \"irm bun.sh/install.ps1 | iex\"", provides: "bun" },
          { id: "npm", name: "npm", kind: "bundled", by: "@node-garden · demo", desc: "Ships with Node.js LTS. The default for JavaScript packages in this Hub.", cmd: "npm --version", provides: "npm" }
        ];
        const PM_DEFAULTS = { winget: true, scoop: false, choco: false, bun: true, npm: true };
        const PM_DISPLAY = { winget: "WinGet", scoop: "Scoop", choco: "Chocolatey", bun: "Bun", npm: "npm" };
        const ICONS = {
          winget: '<path d="M2.5 5 6 8l-3.5 3"/><path d="M7 11.5h6.5"/>',
          scoop: '<path d="M3 11a4.5 4.5 0 0 0 9 0Z"/><path d="M11.5 8.5 14.5 3"/><circle cx="6" cy="10" r=".7" fill="currentColor" stroke="none"/>',
          choco: '<path d="M8 2 14 5v6L8 14 2 11V5Z"/><path d="M2 5l6 3 6-3"/><path d="M8 8v6"/>',
          bun: '<path d="M2.5 10.5a5.5 4.6 0 0 1 11 0Z"/><path d="M2.5 10.5h11"/><circle cx="6.2" cy="8.2" r=".7" fill="currentColor" stroke="none"/><circle cx="8.6" cy="7.2" r=".7" fill="currentColor" stroke="none"/><circle cx="10.8" cy="8.2" r=".7" fill="currentColor" stroke="none"/>',
          npm: '<rect x="2" y="3" width="12" height="10" rx="1.5"/><path d="M5.5 6.5v4M5.5 6.5l2.5 2.6 2.5-2.6v4"/>',
          box: '<path d="M8 2 14 5v6L8 14 2 11V5Z"/><path d="M2 5l6 3 6-3"/><path d="M8 8v6"/>'
        };
        function icon(name) { return '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + (ICONS[name] || ICONS.box) + '</svg>'; }
        function pmName(id) { return PM_DISPLAY[id] || id; }
        const PM_IMG = { winget: "icons/powershell.svg", choco: "icons/chocolatey.svg", bun: "icons/bun.svg" };
        function pmIcon(id, px) {
          if (PM_IMG[id]) {
            const s = px || 22;
            return '<img class="' + (s <= 16 ? "pm-img-sm" : "pm-img") + '" src="' + PM_IMG[id] + '" width="' + s + '" height="' + s + '" alt="" />';
          }
          return icon(id);
        }
        const PKG_IMG = { ffmpeg: "icons/pkg-ffmpeg.svg", git: "icons/pkg-git.svg", curl: "icons/pkg-curl.svg" };
        function pkgIcon(id) {
          if (PKG_IMG[id]) return '<img src="' + PKG_IMG[id] + '" width="24" height="24" alt="" />';
          return icon("box");
        }
        function installedCLIs() { try { return JSON.parse(localStorage.getItem("cc-clis") || "{}"); } catch (e) { return {}; } }
        function saveCLIs(o) { try { localStorage.setItem("cc-clis", JSON.stringify(o)); } catch (e) { /* noop */ } }
        function isInstalled(cli) {
          const s = Object.assign({ ffmpeg: false, npm: true, bun: true, git: true, docker: false, curl: true }, installedCLIs());
          return !!s[cli];
        }
        function pmStore() { try { return JSON.parse(localStorage.getItem("cc-pm") || "{}"); } catch (e) { return {}; } }
        function savePM(o) { try { localStorage.setItem("cc-pm", JSON.stringify(o)); } catch (e) { /* noop */ } }
        function pmInstalled(id) { const s = Object.assign({}, PM_DEFAULTS, pmStore()); return !!s[id]; }
        const pmgrid = document.getElementById("pmgrid");
        // All five package managers (the design shows four; npm is included here).
        const PM_CARDS = PMS.map(function (p) { return p.id; });
        function paintManagers() {
          if (!pmgrid) return;
          pmgrid.innerHTML = "";
          PM_CARDS.map(function (id) { return PMS.find(function (p) { return p.id === id; }); }).filter(Boolean).forEach(function (p) {
            const el = document.createElement("article"); el.className = "pm-card";
            el.innerHTML = '<span class="pm-icon" aria-hidden="true"></span><h2></h2><p></p><button type="button" class="btn btn-add">Install</button><div class="status" role="status" aria-live="polite"></div><div class="ilog" hidden></div>';
            el.querySelector(".pm-icon").innerHTML = pmIcon(p.id, 24);
            el.querySelector("h2").textContent = pmName(p.id);
            el.querySelector("p").textContent = p.desc;
            const btn = el.querySelector(".btn-add"), st = el.querySelector(".status"), log = el.querySelector(".ilog");
            function sync() {
              if (pmInstalled(p.id)) { btn.textContent = "Installed ✓"; btn.disabled = true; btn.setAttribute("aria-label", pmName(p.id) + " installed (simulated)"); if (!st.dataset.touched) st.textContent = "Ready to use (simulated)"; st.className = "status ok"; }
              else { btn.textContent = "Install " + pmName(p.id); btn.disabled = false; btn.setAttribute("aria-label", "Install " + pmName(p.id) + " (simulated)"); if (!st.dataset.touched) st.textContent = "Not installed"; st.className = "status"; }
            }
            sync();
            btn.addEventListener("click", function () {
              log.hidden = false; log.innerHTML = "";
              const l1 = document.createElement("div"); l1.innerHTML = '<span class="dim">PS C:\\projects\\app&gt; </span>'; l1.appendChild(document.createTextNode(p.cmd)); log.appendChild(l1);
              const l2 = document.createElement("div"); l2.className = "dim"; l2.textContent = "Fetching demo installer… (simulated)"; log.appendChild(l2);
              const l3 = document.createElement("div"); l3.className = "grn"; l3.textContent = "✓ " + p.name + " installed · exit 0 (simulated)"; log.appendChild(l3);
              const s = Object.assign({}, PM_DEFAULTS, pmStore()); s[p.id] = true; savePM(s);
              const clis = installedCLIs(); if (p.provides) { clis[p.provides] = true; saveCLIs(clis); }
              st.dataset.touched = "1"; st.textContent = "Installed ✓ (simulated)"; st.className = "status ok"; sync(); paintPkgs();
            });
            el.style.animationDelay = Math.min(pmgrid.children.length, 7) * 35 + "ms";
            pmgrid.appendChild(el);
          });
        }

        /* ---- Featured packages (static data from design/hub.html) ---- */
        const PKGS = [
          { id: "ffmpeg", name: "ffmpeg", desc: "Video converter used by the Hub demos. Provides the ffmpeg CLI.", ver: "7.1 · demo", provides: "ffmpeg", tags: "video convert", managers: { winget: "winget install --id Gyan.FFmpeg -e", scoop: "scoop install ffmpeg", choco: "choco install ffmpeg -y" } },
          { id: "libvips", name: "libvips", desc: "Fast image pipeline (resize, thumbnails).", ver: "8.16 · demo", provides: "vips", tags: "imaging resize thumbnails", managers: { winget: "winget install --id libvips.libvips -e", scoop: "scoop install vips", choco: "choco install vips -y" } },
          { id: "git", name: "Git", desc: "Version control behind every command card here.", ver: "2.45 · demo", provides: "git", tags: "vcs", managers: { winget: "winget install --id Git.Git -e", scoop: "scoop install git", choco: "choco install git -y" } },
          { id: "curl", name: "cURL", desc: "HTTP checks for the API demo commands.", ver: "8.9 · demo", provides: "curl", tags: "network http", managers: { winget: "winget install --id cURL.cURL -e", scoop: "scoop install curl", choco: "choco install curl -y" } },
          { id: "imagemagick", name: "ImageMagick", desc: "Convert and identify stills from the media folder.", ver: "7.1 · demo", provides: "magick", tags: "imaging convert", managers: { winget: "winget install --id ImageMagick.ImageMagick -e", scoop: "scoop install imagemagick", choco: "choco install imagemagick -y" } },
          { id: "ytdlp", name: "yt-dlp", desc: "Download test clips before converting with ffmpeg.", ver: "2026.01 · demo", provides: "yt-dlp", tags: "video download", managers: { winget: "winget install --id yt-dlp.yt-dlp -e", scoop: "scoop install yt-dlp", choco: "choco install yt-dlp -y" } },
          { id: "jq", name: "jq", desc: "Slice JSON from the curl demo commands.", ver: "1.7 · demo", provides: "jq", tags: "json cli", managers: { winget: "winget install --id jqlang.jq -e", scoop: "scoop install jq", choco: "choco install jq -y" } }
        ];
        function pkgStore() { try { return JSON.parse(localStorage.getItem("cc-pkgs") || "[]"); } catch (e) { return []; } }
        function savePkgs(a) { try { localStorage.setItem("cc-pkgs", JSON.stringify(a)); } catch (e) { /* noop */ } }
        const pkglist = document.getElementById("pkglist"), pkgq = document.getElementById("pkgq"),
          pkgrail = document.getElementById("pkgrail"), pkgresult = document.getElementById("pkgresult"),
          pkgsuggest = document.getElementById("pkgsuggest");
        let activeMgr = "All";
        function mgrList() { const s = new Set(); PKGS.forEach(function (p) { Object.keys(p.managers).forEach(function (m) { s.add(m); }); }); return Array.from(s).sort(); }
        function paintPkgRail() {
          if (!pkgrail) return;
          pkgrail.innerHTML = "";
          ["All"].concat(mgrList()).forEach(function (m) {
            const b = document.createElement("button"); b.type = "button";
            b.className = m === activeMgr ? "on" : "";
            b.setAttribute("aria-pressed", m === activeMgr ? "true" : "false");
            if (m === "All") { b.textContent = "All package managers"; }
            else {
              b.innerHTML = "";
              const dot = document.createElement("span"); dot.className = "mgr-dot";
              dot.style.background = pmInstalled(m) ? "#1f883d" : "";
              dot.setAttribute("aria-hidden", "true");
              const ic = document.createElement("span"); ic.innerHTML = pmIcon(m, 14);
              ic.style.display = "inline-flex"; ic.setAttribute("aria-hidden", "true");
              const tx = document.createElement("span"); tx.textContent = pmName(m);
              b.appendChild(dot); b.appendChild(ic); b.appendChild(tx);
              b.setAttribute("aria-label", "Filter by " + pmName(m) + (pmInstalled(m) ? " (installed)" : " (not installed)"));
            }
            b.addEventListener("click", function () { activeMgr = m; paintPkgRail(); paintPkgs(); });
            pkgrail.appendChild(b);
          });
        }
        function paintPkgs() {
          if (!pkglist) return;
          const terms = String((pkgq && pkgq.value) || "").toLowerCase().split(/\s+/).map(function (s) { return s.trim(); }).filter(Boolean);
          if (pkgsuggest) pkgsuggest.style.display = (pkgq && pkgq.value.trim() === "") ? "" : "none";
          const rows = PKGS.filter(function (p) {
            if (activeMgr !== "All" && !p.managers[activeMgr]) return false;
            if (!terms.length) return true;
            const hay = (p.name + " " + p.desc + " " + p.tags + " " + Object.keys(p.managers).join(" ")).toLowerCase();
            return terms.every(function (t) { return hay.includes(t); });
          });
          if (pkgresult) pkgresult.textContent = rows.length ? rows.length + " package" + (rows.length === 1 ? "" : "s") + (activeMgr !== "All" ? (" via " + activeMgr) : "") + (terms.length ? (' for “' + terms.join(" ") + '”') : "") + " · demo catalog" : "";
          pkglist.innerHTML = "";
          if (!rows.length) {
            pkglist.innerHTML = '<div class="empty">No demo packages match. Try “ffmpeg”.<br /><button type="button" id="pkgclear">Clear search</button></div>';
            const c = document.getElementById("pkgclear");
            if (c) c.addEventListener("click", function () { pkgq.value = ""; activeMgr = "All"; paintPkgRail(); paintPkgs(); pkgq.focus(); });
            return;
          }
          const installed = pkgStore();
          rows.forEach(function (p) {
            const mgrKeys = Object.keys(p.managers);
            let chosen = mgrKeys.includes(activeMgr) ? activeMgr : mgrKeys[0];
            const el = document.createElement("article"); el.className = "pm-card";
            el.innerHTML = '<span class="pm-icon" aria-hidden="true"></span><h2></h2><p></p>'
              + '<div class="mgr-switch"><button type="button" class="mgr-cycle" aria-label=""></button><span class="mgr-name"></span></div>'
              + '<button type="button" class="cmd-toggle" aria-expanded="false"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 4l4 4-4 4"/></svg><span>Show install command</span></button>'
              + '<div class="cmdline pkg-cmd-wrap" hidden><span class="dim">PS </span><span class="pwd">C:\\projects\\app</span><span class="dim">&gt; </span><span class="c"></span></div>'
              + '<button type="button" class="btn btn-add">Install</button><div class="status" role="status" aria-live="polite"></div><div class="ilog" hidden></div>';
            el.querySelector(".pm-icon").innerHTML = pkgIcon(p.id);
            el.querySelector("h2").textContent = p.name;
            el.querySelector("p").textContent = p.desc + " · " + p.ver;
            const cmdEl = el.querySelector(".c"), cyc = el.querySelector(".mgr-cycle"), mgrName = el.querySelector(".mgr-name");
            function paintMgr() {
              cyc.innerHTML = pmIcon(chosen, 18);
              cyc.setAttribute("aria-label", "Install manager: " + pmName(chosen) + " — activate to change");
              cyc.title = pmName(chosen) + " (click to change)";
              mgrName.textContent = "via " + pmName(chosen);
              cmdEl.textContent = p.managers[chosen];
            }
            paintMgr();
            const tgl = el.querySelector(".cmd-toggle"), wrap = el.querySelector(".pkg-cmd-wrap"), tglLbl = tgl.querySelector("span");
            tgl.addEventListener("click", function () {
              const open = wrap.hidden;
              wrap.hidden = !open;
              tgl.setAttribute("aria-expanded", open ? "true" : "false");
              tglLbl.textContent = open ? "Hide install command" : "Show install command";
            });
            cyc.addEventListener("click", function () {
              chosen = mgrKeys[(mgrKeys.indexOf(chosen) + 1) % mgrKeys.length];
              paintMgr(); sync(false);
              cyc.classList.remove("spin"); void cyc.offsetWidth; cyc.classList.add("spin");
            });
            const btn = el.querySelector(".btn-add"), st = el.querySelector(".status"), log = el.querySelector(".ilog");
            function sync(touch) {
              cmdEl.textContent = p.managers[chosen];
              const done = installed.includes(p.id);
              if (done) {
                btn.textContent = "Installed ✓"; btn.disabled = true;
                btn.setAttribute("aria-label", p.name + " installed (simulated)");
                if (!st.dataset.touched) st.textContent = "Installed · simulated";
                st.className = "status ok"; return;
              }
              btn.textContent = "Install via " + pmName(chosen); btn.disabled = false;
              btn.setAttribute("aria-label", "Install " + p.name + " via " + pmName(chosen) + " (simulated)");
              if (touch) return;
              st.innerHTML = "";
              if (!pmInstalled(chosen)) {
                const s1 = document.createElement("span"); s1.textContent = "Needs " + pmName(chosen) + " — ";
                const a = document.createElement("a"); a.href = "#"; a.className = "gate-link"; a.textContent = "Open Package Managers";
                a.addEventListener("click", function (ev) { ev.preventDefault(); setTab("managers"); document.getElementById("tab-managers").focus(); });
                st.appendChild(s1); st.appendChild(a); st.className = "status";
              } else {
                st.textContent = isInstalled(p.provides) || !p.provides ? "Ready to install via " + pmName(chosen) : "Ready via " + pmName(chosen) + " · provides " + p.provides;
                st.className = "status";
              }
            }
            sync(false);
            btn.addEventListener("click", function () {
              log.hidden = false; log.innerHTML = "";
              const l1 = document.createElement("div"); l1.innerHTML = '<span class="dim">PS C:\\projects\\app&gt; </span>';
              l1.appendChild(document.createTextNode(p.managers[chosen])); log.appendChild(l1);
              if (!pmInstalled(chosen)) {
                const le = document.createElement("div"); le.className = "red";
                le.textContent = "✕ " + pmName(chosen) + " is not installed · exit 1 (simulated)"; log.appendChild(le);
                const lh = document.createElement("div"); lh.className = "blu";
                lh.textContent = "Install " + pmName(chosen) + " in Package Managers, then retry."; log.appendChild(lh);
                st.dataset.touched = "1";
                st.textContent = "Needs " + pmName(chosen) + " — install it first, then retry";
                st.className = "status bad"; return;
              }
              const l2 = document.createElement("div"); l2.className = "dim";
              l2.textContent = "Resolving demo package… (simulated)"; log.appendChild(l2);
              const l3 = document.createElement("div"); l3.className = "grn";
              l3.textContent = "✓ " + p.name + " installed via " + pmName(chosen) + " · exit 0 (simulated)"; log.appendChild(l3);
              const cur = pkgStore();
              if (!cur.includes(p.id)) { cur.push(p.id); savePkgs(cur); installed.push(p.id); }
              if (p.provides) { const clis = installedCLIs(); clis[p.provides] = true; saveCLIs(clis); }
              st.dataset.touched = "1"; st.textContent = "Installed ✓ (simulated)"; st.className = "status ok"; sync(true);
            });
            el.style.animationDelay = Math.min(pkglist.children.length, 7) * 35 + "ms";
            pkglist.appendChild(el);
          });
        }
        if (pkgsuggest) pkgsuggest.addEventListener("click", function (e) {
          const b = e.target.closest("button"); if (!b) return;
          pkgq.value = b.getAttribute("data-s") || ""; paintPkgs(); pkgq.focus();
        });
        let pkgdeb = null;
        if (pkgq) {
          pkgq.addEventListener("input", function () { clearTimeout(pkgdeb); pkgdeb = setTimeout(paintPkgs, 120); });
          pkgq.addEventListener("keydown", function (e) {
            if (e.key === "Escape") { pkgq.value = ""; activeMgr = "All"; paintPkgRail(); paintPkgs(); }
            if (e.key === "Enter") { e.preventDefault(); }
          });
        }
        setTab(activeTab);
        paintManagers(); paintPkgRail(); paintPkgs();

        this.ready = true;
        markMounted("hub");
      },
    };
  }

  function publishStubData() {
    return {
      ready: false,
      async init() {
        this.ready = true;
        markMounted("publish");
        const form = document.getElementById("pubform");
        if (form) {
          form.addEventListener("submit", (e) => {
            e.preventDefault();
            console.info("Publish submit arrives with Phase F (publish.ts + F4 component).");
          });
        }
      },
    };
  }

  // Exposed for tests; registered on alpine:init below.
  window.__ccHubStatic = hubStaticData;
  window.__ccPublishStub = publishStubData;

  document.addEventListener("alpine:init", function () {
    const Alpine = window.Alpine;
    if (!Alpine || typeof Alpine.data !== "function") return;
    try {
      Alpine.data("ccHub", hubStaticData);
    } catch (e) {
      console.error("ccHub registration failed", e);
    }
    try {
      Alpine.data("ccPublish", publishStubData);
    } catch (e) {
      console.error("ccPublish registration failed", e);
    }
  });
})();
