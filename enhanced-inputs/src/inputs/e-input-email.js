import InputTextBase from "./e-input-text-base";

export default class InputEmail extends InputTextBase {
  constructor() {
    super();
    this.inputType = 'email';
    this.format = 'email';
  }
}

customElements.define('input-email', InputEmail);
