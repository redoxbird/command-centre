import { html } from 'lit';
import InputBase from './e-input-base.js';

/**
 * <input-checkbox-base>
 * Base class for checkbox-based input components
 */
export default class InputCheckboxBase extends InputBase {
  static properties = {
    // Checkbox-specific properties
    checked: { type: Boolean, reflect: true },
    onLabel: { type: String, attribute: 'on-label' },
    offLabel: { type: String, attribute: 'off-label' },
    size: { type: String, reflect: true }, // 'sm', 'md', 'lg'
  };

  constructor() {
    super();
    this.inputType = 'checkbox';
    this.checked = false;
    this.size = 'md';
    this.onLabel = 'On';
    this.offLabel = 'Off';
  }

  connectedCallback() {
    super.connectedCallback();
    // Initialize value from checked attribute
    this.value = this.checked ? 'on' : 'off';
    this._validate();
  }

  // ------------------------------------------------------------------ //
  // Validation
  // ------------------------------------------------------------------ //
  _validate() {
    if (this.required && !this.checked) {
      this.error = JSON.stringify([{ message: 'This field is required.' }]);
    } else {
      this.error = '';
    }
  }

  // ------------------------------------------------------------------ //
  // Input handlers
  // ------------------------------------------------------------------ //
  _onToggleChange(e) {
    this.checked = e.target.checked;
    this.value = this.checked ? 'on' : 'off';
    this._validate();
    this._updateValue(this.value);
    this._handleChange();
    this._callHook('onChange', e);
    this.requestUpdate('checked');
  }

  // ------------------------------------------------------------------ //
  // Public API
  // ------------------------------------------------------------------ //
  reset() {
    super.reset();
    this.checked = false;
    this.value = 'off';
  }

  focus() {
    const input = this.renderRoot?.querySelector('.i-toggle-input');
    input?.focus();
  }

  // Override value setter to sync checked state
  set value(val) {
    super.value = val;
    this.checked = val === 'on' || val === true || val === 'true';
  }
}