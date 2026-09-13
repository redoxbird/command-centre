import { html } from 'lit';
import * as z from 'zod';
import { MaskInput } from "maska";
import InputBase from './e-input-base.js';

/**
 * <input-text-base>
 * Reusable text input foundation (email, password, url, etc.)
 * Inherits ALL core logic from <input-base>:
 *   • Form association
 *   • Hooks + events
 *   • Debounced validation
 *   • Accessibility IDs
 *   • reset(), focus(), validate()
 */
export default class InputTextBase extends InputBase {
  static properties = {
    // Text-specific UI
    actionButton: { type: String, attribute: 'action-button' },
    prefix: { type: String, attribute: 'prefix' },
    prefixValue: { type: String, attribute: 'prefix-value' },
    inputType: { type: String },
    unstyled: { type: Boolean, attribute: 'unstyled' },

    // Text validators (attributes)
    min: { type: String },
    max: { type: String },
    email: { type: Boolean },
    url: { type: Boolean },
    startsWith: { type: String, attribute: 'starts-with' },
    endsWith: { type: String, attribute: 'ends-with' },
    includes: { type: String },
    lowercase: { type: Boolean },
    uppercase: { type: Boolean },
    regex: { type: String },
    format: { type: String },

    // Custom messages
    requiredMessage: { type: String, attribute: 'required-message' },
    minMessage: { type: String, attribute: 'min-message' },
    maxMessage: { type: String, attribute: 'max-message' },
    emailMessage: { type: String, attribute: 'email-message' },
    urlMessage: { type: String, attribute: 'url-message' },
    startsWithMessage: { type: String, attribute: 'starts-with-message' },
    endsWithMessage: { type: String, attribute: 'ends-with-message' },
    includesMessage: { type: String, attribute: 'includes-message' },
    lowercaseMessage: { type: String, attribute: 'lowercase-message' },
    uppercaseMessage: { type: String, attribute: 'uppercase-message' },
    regexMessage: { type: String, attribute: 'regex-message' },
    formatMessage: { type: String, attribute: 'format-message' },

    // Internal state
    isPasswordVisible: { type: Boolean, state: true },

    // Masking
    mask: { type: String },
  };

  constructor() {
    super();
    this.isPasswordVisible = false;
    this.mask = '';
    this._maskInstance = null;
  }

  firstUpdated() {
    super.firstUpdated();
    if (this.mask) {
      const input = this.renderRoot.querySelector('input');
      if (input) {
        this._maskInstance = new MaskInput(input, this._getMaskOptions());
      }
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._maskInstance) {
      this._maskInstance.destroy();
      this._maskInstance = null;
    }
  }

  _getMaskOptions() {
    const baseOptions = {};

    switch (this.mask) {
      case 'ip':
        return { ...baseOptions, mask: "###.###.###.###" };
      case 'phone':
        return { ...baseOptions, mask: "(###) ###-####" };
      case 'phone-international':
        return { ...baseOptions, mask: "+# (###) ###-####" };
      case 'credit-card':
        return { ...baseOptions, mask: "#### #### #### ####" };
      case 'ssn':
        return { ...baseOptions, mask: "###-##-####" };
      case 'zip':
        return { ...baseOptions, mask: "#####" };
      case 'zip-extended':
        return { ...baseOptions, mask: "#####-####" };
      case 'date':
        return { ...baseOptions, mask: "##/##/####" };
      case 'time':
        return { ...baseOptions, mask: "##:##" };
      case 'time-full':
        return { ...baseOptions, mask: "##:##:##" };
      case 'money':
        return {
          ...baseOptions,
          preProcess: (val) => val.replace(/[$,]/g, ""),
          postProcess: (val) => {
            if (!val) return "";

            const sub = 3 - (val.includes(".") ? val.length - val.indexOf(".") : 0);

            return Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD"
            })
              .format(val)
              .slice(0, sub ? -sub : undefined);
          }
        };
      case 'money-number':
        return {
          ...baseOptions,
          number: {
            locale: 'uk',
            fraction: 2,
            unsigned: true
          },
          postProcess: (val) => val ? `£${val}` : ''
        };
      case 'uppercase':
        return { ...baseOptions, preProcess: (val) => val.toUpperCase() };
      case 'lowercase':
        return { ...baseOptions, preProcess: (val) => val.toLowerCase() };
      default:
        // If mask is a custom pattern, use it directly
        return { ...baseOptions, mask: this.mask };
    }
  }

  // ------------------------------------------------------------------ //
  // Render – uses input-base generated IDs
  // ------------------------------------------------------------------ //
  render() {
    const ariaDescribedby = [
      this.description ? this.ids.desc : null,
      this.error ? this.ids.error : null
    ].filter(Boolean).join(' ');

    const inputClasses = this.error ? 'i-input i-input-error' : 'i-input';
    const wrapperClasses = this.error ? 'i-wrapper i-wrapper-error' : 'i-wrapper';

    return html`
        <div class="i-field">
            ${this._renderLabel()}
          <div class="${wrapperClasses}">
              ${this._renderPrefix()}
              <input
                class="${inputClasses}"
                id="${this.ids.input}"
                name="${this.name || ''}"
                type="${this._getInputType()}"
                .value="${this.value ?? ''}"
                placeholder="${this.placeholder ?? ''}"
                aria-required="${this.required ? 'true' : 'false'}"
                ?disabled="${this.disabled}"
                ?readonly="${this.readonly}"
                aria-invalid="${this.valid ? undefined : 'true'}"
                aria-describedby="${ariaDescribedby}"
                @input="${this._onInput}"
                @change="${this._onChange}"
                @blur="${this._onBlur}"
                autocomplete="${this.autocomplete ?? 'off'}"
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
  //
  _renderLabel() {
    if (!this.label) return '';
    return html`<label class="i-label" for="${this.ids.input}">
      ${this.label || ''}
      ${this.required ? html`<span class="i-required">Required</span>` : ''}
    </label>`
  }

  _renderPrefix() {
    if (!this.prefix) return '';
    return html`<span class="i-prefix">${this.prefix}</span>`;
  }

  _renderAction() {
    if (!this.actionButton) return '';
    if (this.actionButton === 'copy') {
      return html`<button class="i-action i-action-copy" type="button" @click="${this._onActionCopy}" title="Copy to clipboard">
          <span class="i-icon i-action-icon-copy"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-copy"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M7 7m0 2.667a2.667 2.667 0 0 1 2.667 -2.667h8.666a2.667 2.667 0 0 1 2.667 2.667v8.666a2.667 2.667 0 0 1 -2.667 2.667h-8.666a2.667 2.667 0 0 1 -2.667 -2.667z" /><path d="M4.012 16.737a2.005 2.005 0 0 1 -1.012 -1.737v-10c0 -1.1 .9 -2 2 -2h10c.75 0 1.158 .385 1.5 1" /></svg></span>
          <span class="i-icon i-action-icon-check"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-check"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l5 5l10 -10" /></svg></span>
      </button>`;
    }
    if (this.actionButton === 'show') {
      const icon = this.inputType === 'password' ? html`<span class="i-icon i-action-icon-eye"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-eye"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" /><path d="M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6" /></svg></span>` : html`<span class="i-icon i-action-icon-eye-closed"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-eye-closed"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M21 9c-2.4 2.667 -5.4 4 -9 4c-3.6 0 -6.6 -1.333 -9 -4" /><path d="M3 15l2.5 -3.8" /><path d="M21 14.976l-2.492 -3.776" /><path d="M9 17l.5 -4" /><path d="M15 17l-.5 -4" /></svg></span>`;
      return html`<button class="i-action i-action-hide" type="button" @click="${this._onActionShow}" title="Toggle password visibility">
          ${icon}
      </button>`;
    }

    if (this.actionButton === 'clear') {
      if (this.value === '') return '';
      return html`<button class="i-action i-action-clear" type="button" @click="${this._onActionClear}" title="Clear input">
          <span class="i-icon i-action-icon-clear"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-x"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M18 6l-12 12" /><path d="M6 6l12 12" /></svg></span>
      </button>`;
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
      this._dispatch('input:error', { error: 'Copy failed' });
    });
    e.target.classList.add('i-action-copied');
    setTimeout(() => e.target.classList.remove('i-action-copied'), 1000);
  }

  _onActionShow(e) {
    e.stopPropagation();
    this.inputType = this.inputType === 'password' ? 'text' : 'password';
  }

  _onActionClear(e) {
    e.stopPropagation();
    this.value = '';
    this.focus();
    this._dispatch('input:input', { value: this.value });
    this._dispatch('input:change', { value: this.value });
  }

  // ------------------------------------------------------------------ //
  // Input handlers – delegate to input-base core
  // ------------------------------------------------------------------ //
  _onInput(e) {
    this._updateValue(e.target.value);     // → dispatches input:input + optional debounce
    this._callHook('onInput', e);
  }

  _onChange(e) {
    this._handleChange();                  // → dispatches input:change + optional validate
    this._callHook('onChange', e);
  }

  _onBlur(e) {
    this._handleBlur();                    // → optional validate on blur
    this._callHook('onBlur', e);
  }

  // ------------------------------------------------------------------ //
  // Zod schema – text-specific validators only
  // ------------------------------------------------------------------ //
  _buildSchema() {
    let schema = z.string();

    if (this.required) {
      schema = schema.min(1, this.requiredMessage || (this.label ? `${this.label} is required` : 'This field is required'));
    }

    if (this.min) schema = schema.min(Number(this.min), this.minMessage || `Minimum length is ${this.min}`);
    if (this.max) schema = schema.max(Number(this.max), this.maxMessage || `Maximum length is ${this.max}`);

    if (this.email) schema = schema.email(this.emailMessage || 'Please enter a valid email address');
    if (this.url) schema = schema.url(this.urlMessage || 'Please enter a valid URL');

    if (this.startsWith) schema = schema.startsWith(this.startsWith, this.startsWithMessage || `Must start with "${this.startsWith}"`);
    if (this.endsWith) schema = schema.endsWith(this.endsWith, this.endsWithMessage || `Must end with "${this.endsWith}"`);
    if (this.includes) schema = schema.includes(this.includes, this.includesMessage || `Must include "${this.includes}"`);

    if (this.lowercase) schema = schema.lowercase(this.lowercaseMessage || 'Must be lowercase');
    if (this.uppercase) schema = schema.uppercase(this.uppercaseMessage || 'Must be uppercase');

    if (this.format) {
      const msg = this.formatMessage || `Must be a valid ${this.label || this.format}`;
      switch (this.format) {
        case 'email': schema = schema.email(msg); break;
        case 'url': schema = schema.url(msg); break;
        case 'uuid': schema = schema.uuid(msg); break;
        case 'cuid': schema = schema.cuid(msg); break;
        case 'cuid2': schema = schema.cuid2(msg); break;
        case 'ulid': schema = schema.ulid(msg); break;
        case 'iso-datetime': schema = z.iso.datetime(msg); break;
        case 'iso-date': schema = z.iso.date(msg); break;
        case 'emoji': schema = schema.emoji(msg); break;
        case 'base64': schema = schema.base64(msg); break;
        case 'hex': schema = schema.hex(msg); break;
        case 'jwt': schema = schema.jwt(msg); break;
        case 'nanoid': schema = schema.nanoid(msg); break;
        case 'ipv4': schema = schema.ipv4(msg); break;
        case 'ipv6': schema = schema.ipv6(msg); break;
        // Add more as needed
      }
    }

    if (this.regex) {
      try {
        schema = schema.regex(new RegExp(this.regex, 'u'), this.regexMessage || `Enter ${this.label || 'value'} in a valid format`);
      } catch { }
    }

    return schema;
  }

  // ------------------------------------------------------------------ //
  // Validation – uses input-base setValidState()
  // ------------------------------------------------------------------ //
  async validate() {
    this._callHook('onValidate');
    this._dispatch('input:validate');

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

  // ------------------------------------------------------------------ //
  // Override reset to clear password visibility and mask instance
  // ------------------------------------------------------------------ //
  reset() {
    super.reset();
    this.isPasswordVisible = false;
    if (this._maskInstance) {
      this._maskInstance.destroy();
      this._maskInstance = null;
      // Re-apply mask after reset
      this.updateComplete.then(() => {
        if (this.mask) {
          const input = this.renderRoot.querySelector('input');
          if (input) {
            this._maskInstance = new MaskInput(input, this._getMaskOptions());
          }
        }
      });
    }
  }
}
