// Webview grammar bundle entry — re-exported by scripts/build-grammar.ts
// into static/grammar.js (window.CCGrammar). Single source of truth: the
// browser parses, maps widgets and builds input descriptors from the exact
// same modules Deno tests (no hand-maintained mirror).
export * from "./grammar.ts";
export { CC_INPUT_ALIASES, CC_INPUT_TYPES, CC_RETIRED_TYPES, lookupType, widgetToEInput } from "./registry.ts";
export { renderToken } from "./render.ts";
export type { EInputMapping } from "./registry.ts";
export type { AuthorMeta, RenderedInput, RenderedOption } from "./render.ts";
