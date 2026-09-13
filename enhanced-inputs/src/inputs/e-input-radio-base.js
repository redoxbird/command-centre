import { html } from 'lit';
import InputBase from './e-input-base.js';

/**
 * <input-radio-base>
 * Base class for radio input groups.
 * Provides common functionality for radio-based inputs like <input-radio>, <input-radio-card>, etc.
 * Handles option collection, value management, validation, and rendering structure.
 */
export default class InputRadioBase extends InputBase {
  static properties = {
    // Radio-specific properties
    multiple: { type: Boolean }, // For future extensions, though radios are typically single-select
    options: { type: Array, state: true }, // Collected from child elements
  };

  constructor() {
    super();
    this.multiple = false; // Radios are single-select by default
    this.options = [];
  }

  connectedCallback() {
    super.connectedCallback();
    this._collectOptions();
  }

  _collectOptions() {
    this.options = Array.from(this.querySelectorAll('input-radio-option')).map((opt, index) => ({
      value: opt.value || opt.label,
      label: opt.label,
      description: opt.description,
      badge: opt.badge,
      disabled: opt.disabled,
      selected: opt.selected,
      index,
    }));

    // If no value is set but an option is marked as selected, use that option's value
    if (!this.value) {
      const selectedOption = this.options.find(opt => opt.selected);
      if (selectedOption) {
        this.value = selectedOption.value;
      }
    }

    // Hide the option elements since they are data-only
    this.querySelectorAll('input-radio-option').forEach(opt => opt.style.display = 'none');
  }

  // ------------------------------------------------------------------ //
  // Render structure – subclasses override _renderOptions for specific styles
  // ------------------------------------------------------------------ //
  render() {
    const ariaDescribedby = [
      this.description ? this.ids.desc : null,
      this.error ? this.ids.error : null
    ].filter(Boolean).join(' ');

    return html`
      <div class="i-field">
        <fieldset class="i-radio-group" role="radiogroup" aria-labelledby="${this.ids.label}" aria-describedby="${ariaDescribedby}">
          <legend class="i-label" id="${this.ids.label}">${this.label || ''}</legend>
          <div class="i-radio-options">
            ${this._renderOptions()}
          </div>
        </fieldset>
        ${this._renderDescription()}
        ${this._renderError()}
      </div>
    `;
  }

  _renderOptions() {
    // Subclasses implement this to render options in different styles (standard, cards, etc.)
    return this.options.map(option => this._renderOption(option));
  }

  _renderOption(option) {
    const isChecked = this.multiple
      ? (Array.isArray(this.value) && this.value.includes(option.value))
      : (this.value === option.value);

    return html`
      <label class="i-radio-option ${option.disabled ? 'i-radio-option-disabled' : ''}">
        <input
          type="radio"
          name="${this.name || this.ids.input}"
          .value="${option.value}"
          ?checked="${isChecked}"
          ?disabled="${option.disabled || this.disabled}"
          ?readonly="${this.readonly}"
          @change="${(e) => this._onOptionChange(e, option)}"
          aria-describedby="${this.description ? this.ids.desc : ''}"
        />
        <div>
          <span class="i-radio-label">
            ${option.label} 
            ${option.badge ? html`<span class="i-radio-badge">${option.badge}</span>` : ''}
          </span>
          ${option.description ? html`<span class="i-radio-description">${option.description}</span>` : ''}
        </div>
      </label>
    `;
  }

  _renderDescription() {
    if (!this.description) return '';
    return html`<p class="i-description" id="${this.ids.desc}">${this.description}</p>`;
  }

  _renderError() {
    if (!this.error) return '';
    return html`<p class="i-error i-error-visible" id="${this.ids.error}">${this.error}</p>`;
  }

  updated(changed) {
    super.updated(changed);
    if (changed.has('value')) {
      this._updateChecked();
    }
  }

  _updateChecked() {
    const inputs = this.renderRoot?.querySelectorAll('input[type="radio"]');
    if (inputs) {
      inputs.forEach((input, index) => {
        const option = this.options[index];
        if (option) {
          input.checked = this.value === option.value;
        }
      });
    }
  }

  _onOptionChange(e, option) {
    if (this.multiple) {
      // For future multiple select radios (though not standard)
      const currentValue = Array.isArray(this.value) ? [...this.value] : [];
      if (e.target.checked) {
        currentValue.push(option.value);
      } else {
        const index = currentValue.indexOf(option.value);
        if (index > -1) currentValue.splice(index, 1);
      }
      this.value = currentValue;
    } else {
      this.value = option.value;
    }
    this._updateValue(this.value);
    this._handleChange();
  }

  // ------------------------------------------------------------------ //
  // Validation
  // ------------------------------------------------------------------ //
  async validate() {
    this._callHook('onValidate');
    this._dispatch('input:validate');

    if (this.required && (!this.value || (Array.isArray(this.value) && this.value.length === 0))) {
      const errorMsg = this.requiredMessage || `${this.label || 'Selection'} is required`;
      this.setValidState({ valid: false, error: errorMsg });
      this._callHook('onError', { error: errorMsg });
      return { valid: false, error: errorMsg };
    }

    this.setValidState({ valid: true });
    this._callHook('onSuccess', { value: this.value });
    return { valid: true, error: null };
  }

  // ------------------------------------------------------------------ //
  // Public API
  // ------------------------------------------------------------------ //
  reset() {
    super.reset();
    this.value = this.multiple ? [] : '';
  }

  focus() {
    const firstRadio = this.renderRoot?.querySelector('input[type="radio"]:not([disabled])');
    firstRadio?.focus();
  }
}

/**
 * <input-radio-option>
 * Defines an option for radio inputs.
 */
export class InputRadioOption extends HTMLElement {
  constructor() {
    super();
  }

  get value() {
    return this.getAttribute('value') || this.label;
  }

  set value(val) {
    this.setAttribute('value', val);
  }

  get label() {
    return this.getAttribute('label') || this.textContent.trim();
  }

  set label(val) {
    this.setAttribute('label', val);
  }

  get description() {
    return this.getAttribute('description');
  }

  set description(val) {
    this.setAttribute('description', val);
  }

  get badge() {
    return this.getAttribute('badge');
  }

  set badge(val) {
    if (val) {
      this.setAttribute('badge', val);
    } else {
      this.removeAttribute('badge');
    }
  }

  get disabled() {
    return this.hasAttribute('disabled');
  }

  set disabled(val) {
    if (val) {
      this.setAttribute('disabled', '');
    } else {
      this.removeAttribute('disabled');
    }
  }

  get selected() {
    return this.hasAttribute('selected');
  }

  set selected(val) {
    if (val) {
      this.setAttribute('selected', '');
    } else {
      this.removeAttribute('selected');
    }
  }
}

customElements.define('input-radio-option', InputRadioOption);