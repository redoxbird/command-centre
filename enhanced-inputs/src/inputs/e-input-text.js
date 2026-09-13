import InputTextBase from "./e-input-text-base";

// Extensions for specific text-based inputs
export default class InputText extends InputTextBase {
  constructor() {
    super();
    this.inputType = 'text';
  }
}

customElements.define('input-text', InputText);
