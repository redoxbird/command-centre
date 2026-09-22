// @deprecated Standalone tag (see src/index.js): unstyled by all themes, undocumented, and emitting a divergent event vocabulary. Use <e-input type=...> instead; this file builds to dist/inputs/* for reference only.
import InputTextBase from "./e-input-text-base";

// Extensions for specific text-based inputs
export default class InputText extends InputTextBase {
  constructor() {
    super();
    this.inputType = 'text';
  }
}

customElements.define('input-text', InputText);
