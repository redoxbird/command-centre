// Primary (and only supported) surface: the unified <e-input> element plus
// its slotted option elements (<e-select-option>, <e-combobox-option>,
// <e-radio-option>, <e-checkbox-option>).
//
// The per-type <input-*> tags (input-text, input-number, …) are DEPRECATED:
// they are styled by none of the six themes, referenced by none of the docs
// or demos, and emit a divergent input:* event vocabulary. They are no longer
// re-exported here, so the main bundle does not register them. Their source
// files still build to dist/inputs/* for reference only.
export * from "./inputs/e-input";
export * from "./inputs/e-input-options";
export { default } from "./inputs/e-input.js";
export { default as EInput } from "./inputs/e-input.js";
