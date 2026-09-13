import { html } from 'lit';
import InputBase from './e-input-base.js';

/**
 * <input-checkbox>
 * Checkbox group input component
 * Extends InputBase to provide checkbox group functionality
 */
export default class InputCheckbox extends InputBase {
  static properties = {
    multiple: { type: Boolean },
    options: { type: Array, state: true },
  };

  constructor() {
    super();
    this.multiple = true;
    this.options = [];
  }

  connectedCallback() {
    super.connectedCallback();
    this._collectOptions();
  }

  _collectOptions() {
    this.options = Array.from(this.querySelectorAll('e-checkbox-option')).map((opt, index) => ({
      value: opt.value || opt.label,
      label: opt.label,
      description: opt.description,
      badge: opt.badge,
      disabled: opt.disabled,
      selected: opt.selected,
      index,
    }));

    if (!this.value || this.value === '') {
      const selectedOptions = this.options.filter(opt => opt.selected);
      if (selectedOptions.length > 0) {
        this.value = selectedOptions.map(opt => opt.value);
      }
    }

    this.querySelectorAll('e-checkbox-option').forEach(opt => opt.style.display = 'none');
  }

  set value(val) {
    if (Array.isArray(val)) {
      super.value = val;
    } else if (val) {
      super.value = [val];
    } else {
      super.value = [];
    }
  }

  get value() {
    const val = super.value;
    return Array.isArray(val) ? val : (val ? [val] : []);
  }

  render() {
    const ariaDescribedby = [
      this.description ? this.ids.desc : null,
      this.error ? this.ids.error : null
    ].filter(Boolean).join(' ');

    return html`
      <div class="i-field">
        <fieldset class="i-checkbox-group" role="group" aria-labelledby="${this.ids.label}" aria-describedby="${ariaDescribedby}">
          <legend class="i-label" id="${this.ids.label}">${this.label || ''}</legend>
          <div class="i-checkbox-options">
            ${this._renderOptions()}
          </div>
        </fieldset>
        ${this._renderDescription()}
        ${this._renderError()}
      </div>
    `;
  }

  _renderOptions() {
    return this.options.map(option => this._renderOption(option));
  }

  _renderOption(option) {
    const isChecked = Array.isArray(this.value) && this.value.includes(option.value);

    return html`
      <label class="i-checkbox-option ${option.disabled ? 'i-checkbox-option-disabled' : ''}">
        <input
          type="checkbox"
          name="${this.name || this.ids.input}"
          .value="${option.value}"
          ?checked="${isChecked}"
          ?disabled="${option.disabled || this.disabled}"
          ?readonly="${this.readonly}"
          @change="${(e) => this._onOptionChange(e, option)}"
          aria-describedby="${this.description ? this.ids.desc : ''}"
        />
        <div>
          <span class="i-checkbox-label">
            ${option.label} 
            ${option.badge ? html`<span class="i-checkbox-badge">${option.badge}</span>` : ''}
          </span>
          ${option.description ? html`<span class="i-checkbox-description">${option.description}</span>` : ''}
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
    const inputs = this.renderRoot?.querySelectorAll('input[type="checkbox"]');
    if (inputs) {
      inputs.forEach((input, index) => {
        const option = this.options[index];
        if (option) {
          input.checked = Array.isArray(this.value) && this.value.includes(option.value);
        }
      });
    }
  }

  _onOptionChange(e, option) {
    const currentValue = Array.isArray(this.value) ? [...this.value] : [];
    const index = currentValue.indexOf(option.value);

    if (e.target.checked) {
      if (index === -1) {
        currentValue.push(option.value);
      }
    } else {
      if (index > -1) {
        currentValue.splice(index, 1);
      }
    }

    this.value = currentValue;
    this._updateValue(this.value);
    this._handleChange();
  }

  async validate() {
    this._callHook('onValidate');
    this._dispatch('e:validate');

    if (this.required && (!this.value || this.value.length === 0)) {
      const errorMsg = this.requiredMessage || `${this.label || 'Selection'} is required`;
      this.setValidState({ valid: false, error: errorMsg });
      this._callHook('onError', { error: errorMsg });
      return { valid: false, error: errorMsg };
    }

    this.setValidState({ valid: true });
    this._callHook('onSuccess', { value: this.value });
    return { valid: true, error: null };
  }

  reset() {
    super.reset();
    this.value = [];
  }

  focus() {
    const firstCheckbox = this.renderRoot?.querySelector('input[type="checkbox"]:not([disabled])');
    firstCheckbox?.focus();
  }
}

/**
 * <input-checkbox-option>
 * Defines an option for checkbox inputs.
 */
export class InputCheckboxOption extends HTMLElement {
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

customElements.define('input-checkbox', InputCheckbox);