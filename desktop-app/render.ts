// Grammar-aware input descriptor — task C5.
// Deno has no DOM, so renderToken() returns a framework-agnostic descriptor
// that static/app.js (Phase E) materializes into real <e-input> elements.
// Option data is a real list (never a JSON attribute) mirroring the
// _collectOptions() slotted-children contract; author labels/descriptions
// ride along per option.
import { rangeSpec } from "./grammar.ts";
import { widgetToEInput } from "./registry.ts";
import type { Token } from "./grammar.ts";

export interface RenderedOption {
  /** e-select-option | e-radio-option | e-checkbox-option */
  tag: string;
  value: string;
  label: string;
  description?: string;
}

export interface AuthorMeta {
  label?: string;
  description?: string;
  options?: Array<{ value: string; label?: string; description?: string }>;
  example?: string;
}

export interface RenderedInput {
  tag: "e-input";
  /** <e-input> type (never empty — null is returned instead). */
  type: string;
  /** Occurrence-keyed identity (token.iid: "input.dir" / "input.dir#2"). */
  name: string;
  value: string;
  label?: string;
  placeholder?: string;
  description?: string;
  format?: string;
  actionButton?: string;
  /** range/number bounds. */
  min?: number;
  max?: number;
  step?: number;
  /** checkbox/switch initial state. */
  checked?: boolean;
  /** keyvalue renders as two text inputs joined with "=". */
  paired?: boolean;
  options: RenderedOption[];
}

const OPTION_TAG: Record<string, string> = {
  select: "e-select-option",
  radio: "e-radio-option",
  multiselect: "e-checkbox-option",
};

function optionTag(widget: string): string {
  if (widget === "radio" || widget === "buttongroup") return "e-radio-option";
  if (widget === "multiselect") return "e-checkbox-option";
  return OPTION_TAG["select"];
}

function metaForOption(
  meta: AuthorMeta | undefined,
  value: string,
): { label: string; description?: string } {
  const found = meta?.options?.find((o) => o.value === value);
  const label = found?.label?.trim() || value;
  const description = found?.description?.trim() || undefined;
  return description ? { label, description } : { label };
}

/**
 * Build the input descriptor for a Token.
 * @param token parsed token (iid is the element identity)
 * @param value current field value ("" when unset)
 * @param meta author metadata (label/description/per-option labels)
 * @returns null when the widget has no element mapping (never untyped).
 */
export function renderToken(
  token: Pick<
    Token,
    "iid" | "name" | "type" | "params" | "optionsArr" | "checkedDef"
  >,
  value = "",
  meta?: AuthorMeta,
): RenderedInput | null {
  const mapping = widgetToEInput({ name: token.name, type: token.type });
  if (!mapping) return null;
  const out: RenderedInput = {
    tag: "e-input",
    type: mapping.type,
    name: token.iid,
    value: value ?? "",
    options: [],
  };
  if (mapping.format) out.format = mapping.format;
  if (mapping.actionButton) out.actionButton = mapping.actionButton;
  if (mapping.paired) out.paired = true;
  if (meta?.label) out.label = meta.label;
  else out.label = token.name;
  if (meta?.description) out.description = meta.description;
  if (meta?.example !== undefined && meta.example !== "") {
    out.placeholder = meta.example;
  }

  if (token.type === "range") {
    const rs = rangeSpec(token.params || "");
    out.min = rs.min;
    out.max = rs.max;
    out.step = rs.step;
  }

  if (token.type === "checkbox" || token.type === "switch") {
    out.checked = token.checkedDef !== false;
    if (!out.value) out.value = token.checkedDef === false ? "" : (token.params || "--flag");
    return out;
  }

  const widget = token.type;
  if (
    widget === "select" || widget === "radio" || widget === "buttongroup" ||
    widget === "multiselect" || widget === "license"
  ) {
    const opts = token.optionsArr ?? [];
    const tag = optionTag(widget);
    out.options = opts.map((v) => {
      const m = metaForOption(meta, v);
      return m.description
        ? { tag, value: v, label: m.label, description: m.description }
        : { tag, value: v, label: m.label };
    });
  }
  return out;
}
