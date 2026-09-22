// @deprecated Standalone tag (see src/index.js): unstyled by all themes, undocumented, and emitting a divergent event vocabulary. Use <e-input type=...> instead; this file builds to dist/inputs/* for reference only.
import InputTextBase from "./e-input-text-base";

class InputSearch extends InputTextBase {
  constructor() {
    super();
    this.inputType = 'search';
  }
}

customElements.define('input-search', InputSearch);
