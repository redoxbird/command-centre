import InputRadioBase from './e-input-radio-base.js';

/**
 * <input-radio>
 * Standard radio button group input.
 * Extends <input-radio-base> to provide basic radio button functionality.
 */
export default class InputRadio extends InputRadioBase {
  constructor() {
    super();
  }
}

customElements.define('input-radio', InputRadio);