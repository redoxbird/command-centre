// @deprecated Standalone tag (see src/index.js): unstyled by all themes, undocumented, and emitting a divergent event vocabulary. Use <e-input type=...> instead; this file builds to dist/inputs/* for reference only.
import { html } from 'lit';
import * as z from 'zod';
import InputBase from './e-input-base.js';

export default class InputRange extends InputBase {
  static properties = {
    min: { type: Number },
    max: { type: Number },
    step: { type: Number },
    valueMin: { type: Number },
    valueMax: { type: Number },
    range: { type: Boolean },
    valueType: { type: String, attribute: 'value-type' },
    currencySymbol: { type: String },
    locale: { type: String },
    currencyCode: { type: String, attribute: 'currency-code' },
    currencyDisplay: { type: String, attribute: 'currency-display' },
    currencyStyle: { type: String, attribute: 'currency-style' },
    numberFormatOptions: { type: String, attribute: 'number-format-options' },
    relativeTimeFormatOptions: { type: String, attribute: 'relative-time-format-options' },
    listFormatOptions: { type: String, attribute: 'list-format-options' },
  };

  constructor() {
    super();
    this.min = 0;
    this.max = 100;
    this.step = 1;
    this.valueMin = 25;
    this.valueMax = 75;
    this.range = false;
    this.valueType = 'number';
    this.currencySymbol = '$';
    this.locale = navigator.language || 'en-US';
    this.currencyCode = 'USD';
    this.currencyDisplay = 'symbol';
    this.currencyStyle = 'currency';
    this.numberFormatOptions = '{}';
    this.relativeTimeFormatOptions = '{}';
    this.listFormatOptions = '{}';
    this.value = this.range ? JSON.stringify({ min: this.valueMin, max: this.valueMax }) : this.valueMin.toString();
  }


  _getNumberFormatOptions() {
    try {
      const options = JSON.parse(this.numberFormatOptions || '{}');
      return options;
    } catch {
      return {};
    }
  }

  _getRelativeTimeFormatOptions() {
    try {
      const options = JSON.parse(this.relativeTimeFormatOptions || '{}');
      return options;
    } catch {
      return {};
    }
  }

  _getListFormatOptions() {
    try {
      const options = JSON.parse(this.listFormatOptions || '{}');
      return options;
    } catch {
      return {};
    }
  }

  _formatNumber(value) {
    const options = this._getNumberFormatOptions();
    const formatter = new Intl.NumberFormat(this.locale, options);
    return formatter.format(value);
  }

  _formatCurrency(value) {
    const options = this._getNumberFormatOptions();
    const formatter = new Intl.NumberFormat(this.locale, {
      style: this.currencyStyle,
      currency: this.currencyCode,
      currencyDisplay: this.currencyDisplay,
      ...options
    });
    return formatter.format(value);
  }

  _formatRelativeTime(value) {
    const options = this._getRelativeTimeFormatOptions();
    const formatter = new Intl.RelativeTimeFormat(this.locale, options);
    return formatter.format(value, 'day'); // Default to days, can be customized
  }

  _formatList(items) {
    const options = this._getListFormatOptions();
    const formatter = new Intl.ListFormat(this.locale, options);
    return formatter.format(items);
  }

  _getDisplayValue() {
    if (this.range) {
      return `${this._formatValue(this.valueMin)} - ${this._formatValue(this.valueMax)}`;
    } else {
      return this._formatValue(Number(this.value));
    }
  }

  _formatValue(val) {
    if (this.valueType === 'percentage') {
      return `${this._formatNumber(val)}%`;
    } else if (this.valueType === 'currency') {
      return this._formatCurrency(val);
    } else if (this.valueType === 'relativetime') {
      return this._formatRelativeTime(val);
    } else if (this.valueType === 'list') {
      return this._formatList(val);
    } else {
      return this._formatNumber(val);
    }
  }

  render() {
    return html`
      <div class="i-field">
        <label class="i-label" for="${this.ids.input}">
          ${this.label || ''} <span class="i-value-display">${this._getDisplayValue()}</span>
        </label>
        <div class="i-wrapper-range">
          ${this._renderSlider()}
        </div>
        <div class="i-range-limits">
          <span>${this._formatValue(this.min)}</span>
          <span>${this._formatValue(this.max)}</span>
        </div>
        ${this._renderDescription()}
        ${this._renderError()}
      </div>
    `;
  }

  _renderDescription() {
    if (!this.description) return '';
    return html`<p class="i-description" id="${this.ids.desc}">${this.description || ''}</p>`;
  }

  _renderError() {
    if (!this.error) return '';
    const error = JSON.parse(this.error);
    if (error.length < 2) {
      return html`<p class="i-error ${error ? 'i-error-visible' : ''}" id="${this.ids.error}">${error[0].message || ''}</p>`;
    } else {
      const errorList = html`<ul>${error.map(err => html`<li>${err.message}</li>`)}</ul>`;
      return html`<div class="i-error ${error ? 'i-error-visible' : ''}" id="${this.ids.error}">${errorList}</div>`;
    }
  }

  _renderSlider() {
    return html`
      <range-slider
        value="${this.range ? `${this.valueMin},${this.valueMax}` : this.value}"
        min="${this.min}"
        max="${this.max}"
        step="${this.step}"
        name="${this.name}"
        aria-label="${this.label || 'Choose a value'}"
        ?disabled="${this.disabled}"
        @input="${this._onRangeInput}"
        @change="${this._onRangeChange}"
      >
        <div data-track></div>
        <div data-track-fill></div>
        <div data-runnable-track>
          <div data-thumb aria-label="${this.range ? `Minimum ${this.label || 'value'}` : this.label || 'Choose a value'}"></div>
          ${this.range ? html`<div data-thumb aria-label="Maximum ${this.label || 'value'}"></div>` : ''}
        </div>
      </range-slider>
    `;
  }

  _onRangeInput(e) {
    if (this.range) {
      const values = e.target.value.split(',').map(Number);
      this.valueMin = values[0];
      this.valueMax = values[1];
      this.value = JSON.stringify({ min: this.valueMin, max: this.valueMax });
    } else {
      this.value = e.target.value;
    }
    this.internals.setFormValue(this.value);
    this.dispatchInput();
    this._callHook('onInput', e);
    if (this.shouldValidate('input')) {
      this.debounceValidate();
    }
  }

  _onRangeChange(e) {
    this._handleChange();
    this._callHook('onChange', e);
  }

  async validate() {
    this._callHook('onValidate');
    this._dispatch('e:validate');

    try {
      const schema = this._buildSchema();
      const parseValue = this.value ?? '';

      await schema.parseAsync(parseValue);

      this.setValidState({ valid: true });
      this._callHook('onSuccess', { value: this.value });
      return { valid: true, error: null };
    } catch (err) {
      const errorMsg = err.errors?.[0]?.message || err.message || 'Invalid value';
      this.setValidState({ valid: false, error: JSON.stringify([{ message: errorMsg }]) });
      this._callHook('onError', { error: errorMsg });
      return { valid: false, error: errorMsg };
    }
  }

  _buildSchema() {
    let schema = z.string();
    if (this.required) {
      schema = schema.min(1, this.requiredMessage || (this.label ? `${this.label} is required` : 'This field is required'));
    }
    if (this.range) {
      schema = schema.refine((val) => {
        try {
          const parsed = JSON.parse(val);
          return parsed.min !== undefined && parsed.max !== undefined && parsed.min <= parsed.max;
        } catch {
          return false;
        }
      }, 'Select a valid range');
    } else {
      schema = z.coerce.number();
      if (this.min !== undefined) schema = schema.min(this.min, `Minimum value is ${this.min}`);
      if (this.max !== undefined) schema = schema.max(this.max, `Maximum value is ${this.max}`);
      if (this.step !== undefined) schema = schema.multipleOf(this.step, `Must be a multiple of ${this.step}`);
    }
    return schema;
  }

  reset() {
    super.reset();
    this.valueMin = this.min;
    this.valueMax = this.max;
    this.value = this.range ? JSON.stringify({ min: this.valueMin, max: this.valueMax }) : this.valueMin.toString();
  }

  focus() {
    if (this.range) {
      this.renderRoot?.querySelector('range-slider')?.focus();
    } else {
      super.focus();
    }
  }
}

customElements.define('input-range', InputRange);