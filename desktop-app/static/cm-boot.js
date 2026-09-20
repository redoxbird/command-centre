// CodeMirror 6 boot for the authoring page (task E4).
// ESM module loaded from add.html AFTER the vendor importmap. Mounts the CM6
// editor over #cmd with shell highlighting, {{input.*}} token overlays
// (known vs unknown) and two completion sources (type names, option lists).
// Any failure (missing files, offline) leaves window.__ccCM undefined and
// the author component falls back to the plain textarea — see cmdText().
import { EditorView, keymap, highlightSpecialChars, drawSelection, dropCursor } from "@codemirror/view";
import { EditorState, RangeSetBuilder } from "@codemirror/state";
import { autocompletion, completionKeymap } from "@codemirror/autocomplete";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { StreamLanguage, syntaxHighlighting } from "@codemirror/language";
import { shell } from "@codemirror/legacy-modes/mode/shell";
import { Decoration, ViewPlugin } from "@codemirror/view";

const G = () => window.CCGrammar || null;

// Widgets where the .autogenerate dot-suffix is meaningful (design §8.5).
const AUTO_WIDGETS = new Set(["text", "number", "date", "color", "password"]);

function typeEntries() {
  const g = G();
  if (!g) return [];
  const out = [];
  for (const row of g.CC_INPUT_TYPES) {
    out.push({
      label: row[0],
      type: "type",
      detail: row[1],
      info: row[0] + " (" + row[1] + ") — " + (row[2] || ""),
    });
  }
  for (const row of g.CC_INPUT_TYPES) {
    if (row[0] === "input.uuid" || AUTO_WIDGETS.has(row[1])) {
      out.push({
        label: row[0] + ".autogenerate",
        type: "type",
        detail: row[1] + " · auto",
        info: row[0] + ".autogenerate (" + row[1] + ") — prefilled, still editable",
      });
    }
  }
  return out;
}

// Completion source: type names inside {{…}}, option lists after the colon.
async function ccSource(ctx) {
  const g = G();
  if (!g) return null;
  const line = ctx.state.doc.lineAt(ctx.pos);
  const before = line.text.slice(0, ctx.pos - line.from);
  const open = before.lastIndexOf("{{");
  if (open < 0 || before.slice(open).includes("}}")) return null;
  const inner = before.slice(open + 2);
  const m = inner.match(/^input\.([a-z0-9.]*)$/);
  if (m) {
    return {
      from: ctx.pos - m[1].length,
      options: typeEntries().filter((e) => e.label.startsWith("input." + m[1])),
    };
  }
  // Option list: {{input.select:zip,tar|<cursor> → suggest options.
  const tm = inner.match(/^input\.([a-z0-9]+)(?:\.autogenerate)?\s*:\s*([^=,]*)$/);
  if (tm) {
    const parsed = g.parseToken(inner.trim());
    const opts = (parsed && parsed.optionsArr) || [];
    const frag = (tm[2] || "").trim();
    return {
      from: ctx.pos - frag.length,
      options: opts.filter((o) => o.startsWith(frag)).map((o) => ({ label: o, type: "option" })),
    };
  }
  return null;
}

// Token overlay: known tokens one class, unknown tokens another.
function tokenField() {
  const markKnown = Decoration.mark({ class: "cc-tok-known" });
  const markUnknown = Decoration.mark({ class: "cc-tok-unknown" });
  return ViewPlugin.fromClass(
    class {
      constructor(view) {
        this.decorations = this.build(view);
      }
      update(u) {
        if (u.docChanged || u.viewportChanged) this.decorations = this.build(u.view);
      }
      build(view) {
        const g = G();
        const b = new RangeSetBuilder();
        if (!g) return b.finish();
        const text = view.state.doc.toString();
        const re = /\{\{\s*([^{}]*?)\s*\}\}/g;
        let m;
        while ((m = re.exec(text))) {
          const known = g.parseToken(m[1]) !== null;
          b.add(m.index, m.index + m[0].length, known ? markKnown : markUnknown);
        }
        return b.finish();
      }
    },
    { decorations: (v) => v.decorations }
  );
}

// Token overlay faces come from the EditorView theme below; shell faces
// come from StreamLanguage. Unknown tokens get a wavy red underline.

function mount(textarea, onChange) {
  const wrap = document.getElementById("cmwrap");
  if (!wrap || !textarea) return null;
  const start = textarea.value || "";
  const state = EditorState.create({
    doc: start,
    extensions: [
      highlightSpecialChars(),
      history(),
      drawSelection(),
      dropCursor(),
      EditorState.allowMultipleSelections.of(true),
      StreamLanguage.define(shell),
      tokenField(),
      autocompletion({ activateOnTyping: true, maxRenderedOptions: 200, closeOnBlur: true, override: [ccSource] }),
      keymap.of([...completionKeymap, ...historyKeymap, ...defaultKeymap]),
      EditorView.lineWrapping,
      EditorView.updateListener.of((u) => {
        if (u.docChanged) {
          textarea.value = u.state.doc.toString();
          if (typeof onChange === "function") {
            try { onChange(); } catch (e) { console.error(e); }
          }
        }
      }),
      EditorView.theme({
        "&": { fontFamily: "var(--font-mono)", fontSize: "12px" },
        ".cm-content": { padding: "8px 0" },
        ".cc-tok-known": { color: "#0969da", background: "#ddf4ff", borderRadius: "3px" },
        ".cc-tok-unknown": { color: "#cf222e", textDecoration: "underline wavy #cf222e" },
      }),
    ],
  });
  const view = new EditorView({ state, parent: wrap });
  wrap.hidden = false;
  textarea.hidden = true;
  return view;
}

window.__ccCM = {
  mount,
  read(textarea, view) {
    try {
      if (view && view.state) return view.state.doc.toString();
    } catch (e) { /* fall through */ }
    return textarea ? textarea.value : "";
  },
  focus(view, textarea) {
    try {
      if (view) view.focus();
      else if (textarea) textarea.focus();
    } catch (e) { /* noop */ }
  },
};
document.dispatchEvent(new Event("cc:cm-ready"));
