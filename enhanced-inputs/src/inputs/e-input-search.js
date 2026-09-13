import InputTextBase from "./e-input-text-base";

class InputSearch extends InputTextBase {
  constructor() {
    super();
    this.inputType = 'search';
  }
}

customElements.define('input-search', InputSearch);
