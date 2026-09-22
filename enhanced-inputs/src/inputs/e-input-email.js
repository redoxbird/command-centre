// @deprecated Standalone tag (see src/index.js): unstyled by all themes, undocumented, and emitting a divergent event vocabulary. Use <e-input type=...> instead; this file builds to dist/inputs/* for reference only.
import InputTextBase from "./e-input-text-base";

export default class InputEmail extends InputTextBase {
  constructor() {
    super();
    this.inputType = 'email';
    this.format = 'email';
  }
}

customElements.define('input-email', InputEmail);
