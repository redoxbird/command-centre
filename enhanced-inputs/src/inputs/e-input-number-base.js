// input-number-base.js
import InputBase from './e-input-base.js';
import { html } from 'lit';
import * as z from 'zod';
/**
 * <input-number-base>
 * Pure number input foundation
 * Inherits everything from <input-base>:
 *   • Form association
 *   • Hooks + events
 *   • Validation triggers
 *   • Accessibility IDs
 *   • reset(), focus(), validate()
 *
 * Only adds number-specific validators
 */
export default class InputNumberBase extends InputBase {
  static properties = {
    // ──────── Zod number validators (all reflected) ──────────────────────
    gt: { type: Number, reflect: true },
    gte: { type: Number, reflect: true },
    lt: { type: Number, reflect: true },
    lte: { type: Number, reflect: true },
    min: { type: Number, reflect: true },       // alias for gte
    max: { type: Number, reflect: true },       // alias for lte
    int: { type: Boolean, reflect: true },
    positive: { type: Boolean, reflect: true },
    nonnegative: { type: Boolean, reflect: true },
    negative: { type: Boolean, reflect: true },
    nonpositive: { type: Boolean, reflect: true },
    multipleOf: { type: Number, attribute: 'multiple-of', reflect: true },
    step: { type: Number, reflect: true },       // same as multipleOf
    finite: { type: Boolean, reflect: true },
    safe: { type: Boolean, reflect: true },

    // ──────── Custom messages ───────────────────────────────────────────
    gtMessage: { type: String, attribute: 'gt-message' },
    gteMessage: { type: String, attribute: 'gte-message' },
    ltMessage: { type: String, attribute: 'lt-message' },
    lteMessage: { type: String, attribute: 'lte-message' },
    minMessage: { type: String, attribute: 'min-message' },
    maxMessage: { type: String, attribute: 'max-message' },
    intMessage: { type: String, attribute: 'int-message' },
    positiveMessage: { type: String, attribute: 'positive-message' },
    nonnegativeMessage: { type: String, attribute: 'nonnegative-message' },
    negativeMessage: { type: String, attribute: 'negative-message' },
    nonpositiveMessage: { type: String, attribute: 'nonpositive-message' },
    multipleOfMessage: { type: String, attribute: 'multiple-of-message' },
    stepMessage: { type: String, attribute: 'step-message' },
    finiteMessage: { type: String, attribute: 'finite-message' },
    safeMessage: { type: String, attribute: 'safe-message' },
  };

  constructor() {
    super();
    // No need to override _buildSchema here — we override validate() instead
  }

  render() {
    const ariaDescribedby = [
      this.description ? this.ids.desc : null,
      this.error ? this.ids.error : null
    ].filter(Boolean).join(' ');

    const inputClasses = this.error ? 'i-input i-input-error' : 'i-input';

    return html`
        <div class="i-field">
          <label class="i-label" for="${this.ids.input}">${this.label || ''}</label>
          <div class="i-wrapper">
              ${this._renderPrefix()}
              <input
                class="${inputClasses}"
                id="${this.ids.input}"
                name="${this.name || ''}"
                type="${this._getInputType()}"
                .value="${this.value ?? ''}"
                placeholder="${this.placeholder ?? ''}"
                ?disabled="${this.disabled}"
                ?readonly="${this.readonly}"
                aria-required="${this.required ? 'true' : 'false'}"
                aria-invalid="${this.valid ? undefined : 'true'}"
                aria-describedby="${ariaDescribedby}"
                @input="${this._onInput}"
                @change="${this._onChange}"
                @blur="${this._onBlur}"
                ${this.autocomplete ? `autocomplete="${this.autocomplete}"` : ''}
                ${this.autofocus ? 'autofocus' : ''}
              />
              ${this._renderAction()}
          </div>
          ${this._renderDescription()}
          ${this._renderError()}
        </div>
      `;
  }

  // ------------------------------------------------------------------ //
  // EXACT SAME RENDER HELPERS – unchanged
  // ------------------------------------------------------------------ //
  _renderPrefix() {
    if (!this.prefix) return '';
    return html`<span class="i-prefix">${this.prefix}</span>`;
  }

  _renderAction() {
    if (!this.actionButton) return '';
    if (this.actionButton === 'copy') {
      return html`<button class="i-action i-action-copy" type="button" @click="${this._onActionCopy}" title="Copy to clipboard"></button>`;
    }
    if (this.actionButton === 'hide' && this.inputType === 'password') {
      const icon = this.isPasswordVisible ? 'Hide' : 'Show';
      return html`<button class="i-action i-action-hide" type="button" @click="${this._onActionHide}" title="Toggle password visibility">${icon}</button>`;
    }
    return '';
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

  _getInputType() {
    let type = this.inputType || 'text';
    if (type === 'password' && this.actionButton === 'hide' && this.isPasswordVisible) {
      type = 'text';
    }
    return type;
  }

  _onActionCopy(e) {
    e.stopPropagation();
    navigator.clipboard.writeText(this.value).catch(() => {
      this._dispatch('e:error', { error: 'Copy failed' });
    });
    e.target.classList.add('i-action-copied');
    setTimeout(() => e.target.classList.remove('i-action-copied'), 1000);
  }

  _onActionHide(e) {
    e.stopPropagation();
    this.isPasswordVisible = !this.isPasswordVisible;
  }

  // ------------------------------------------------------------------ //
  // Input handlers – delegate to input-base core
  // ------------------------------------------------------------------ //
  _onInput(e) {
    this._updateValue(e.target.value);     // → dispatches e:input + optional debounce
    this._callHook('onInput', e);
  }

  _onChange(e) {
    this._handleChange();                  // → dispatches e:change + optional validate
    this._callHook('onChange', e);
  }

  _onBlur(e) {
    this._handleBlur();                    // → optional validate on blur
    this._callHook('onBlur', e);
  }

  // ------------------------------------------------------------------ //
  // Validation – number-specific schema + uses input-base setValidState()
  // ------------------------------------------------------------------ //
  async validate() {
    this._callHook('onValidate');
    this._dispatch('e:validate');

    try {
      const schema = this._buildSchema();
      const parseValue = this.prefixValue
        ? (this.value.startsWith(this.prefixValue) ? this.value : this.prefixValue + this.value)
        : this.value;

      await schema.parseAsync(parseValue ?? '');

      this.setValidState({ valid: true });
      this._callHook('onSuccess', { value: this.value });
      return { valid: true, error: null };
    } catch (err) {
      const errorMsg = err.errors?.[0]?.message || err.message || 'Invalid value';
      this.setValidState({ valid: false, error: errorMsg });
      this._callHook('onError', { error: errorMsg });
      return { valid: false, error: errorMsg };
    }
  }

  // ──────── Full Zod number schema builder[](https://zod.dev/api#numbers) ───
  _buildSchema() {
    let schema = z.coerce.number();   // string → number, empty → NaN

    // Required → reject empty / NaN
    if (this.required) {
      schema = schema.refine(
        n => !Number.isNaN(n),
        this.requiredMessage || 'This field is required'
      );
    }

    // min / max are aliases for gte / lte (HTML attributes)
    const minVal = this.min ?? this.gte;
    const maxVal = this.max ?? this.lte;

    if (minVal !== undefined) {
      schema = schema.gte(minVal, this.minMessage || this.gteMessage || `Minimum value is ${minVal}`);
    }
    if (maxVal !== undefined) {
      schema = schema.lte(maxVal, this.maxMessage || this.lteMessage || `Maximum value is ${maxVal}`);
    }
    if (this.gt !== undefined) schema = schema.gt(this.gt, this.gtMessage || `Must be > ${this.gt}`);
    if ((this.gte !== undefined) && (schema = schema.gte(this.gte, this.gteMessage || `Must be ≥ ${this.gte}`)));
    if (this.lt !== undefined) schema = schema.lt(this.lt, this.ltMessage || `Must be < ${this.lt}`);
    if (this.lte !== undefined) schema = schema.lte(this.lte, this.lteMessage || `Must be ≤ ${this.lte}`);

    if (this.int) schema = schema.int(this.intMessage || 'Must be an integer');
    if (this.positive) schema = schema.positive(this.positiveMessage || 'Must be positive');
    if (this.nonnegative) schema = schema.nonnegative(this.nonnegativeMessage || 'Must be non-negative');
    if (this.negative) schema = schema.negative(this.negativeMessage || 'Must be negative');
    if (this.nonpositive) schema = schema.nonpositive(this.nonpositiveMessage || 'Must be non-positive');

    if (this.multipleOf !== undefined) {
      schema = schema.multipleOf(this.multipleOf,
        this.multipleOfMessage || `Must be a multiple of ${this.multipleOf}`);
    }
    if (this.step !== undefined) {
      schema = schema.multipleOf(this.step,
        this.stepMessage || `Must be a multiple of ${this.step}`);
    }

    if (this.finite) schema = schema.finite(this.finiteMessage || 'Must be finite');
    if (this.safe) schema = schema.safe(this.safeMessage || 'Must be a safe integer');

    return schema;
  }

  // ------------------------------------------------------------------ //
  // Override reset to clear password visibility
  // ------------------------------------------------------------------ //
  reset() {
    super.reset();
    this.isPasswordVisible = false;
  }
}
