import { html } from 'lit';
import InputTextBase from "./e-input-text-base";

class InputPassword extends InputTextBase {
  static properties = {
    ...super.properties,
    strength: { type: String, state: true },
    strengthMeter: {
      type: Boolean,
      attribute: 'strength-meter',
      reflect: true,
      converter: {
        fromAttribute: (value) => {
          if (value === null) return true;
          return value === 'true' || value === '';
        },
        toAttribute: (value) => (value ? '' : 'false'),
      },
    }
  };

  constructor() {
    super();
    this.inputType = 'password';
    this.actionButton = 'show';
    this.strength = 'weak';
    this.strengthMeter = true;
  }

  _calculateStrength(value) {
    if (!value) return 'weak';
    let score = 0;
    if (value.length >= 8) score++;
    if (/[a-z]/.test(value)) score++;
    if (/[A-Z]/.test(value)) score++;
    if (/[0-9]/.test(value)) score++;
    if (/[^A-Za-z0-9]/.test(value)) score++;
    if (score <= 2) return 'weak';
    if (score <= 4) return 'medium';
    return 'strong';
  }

  _onInput(e) {
    super._onInput(e);
    this.strength = this._calculateStrength(this.value);
  }

  _renderStrengthMeter() {
    if (this.inputType !== 'password') return '';
    if (this.strengthMeter === false) return '';
    const levels = ['weak', 'medium', 'strong'];
    const currentIndex = levels.indexOf(this.strength);
    return html`
      <div class="i-strength-meter ${this.strength}">
        <div class="i-strength-bar">
          ${levels.map((level, index) => html`<div class="i-strength-level ${index <= currentIndex ? 'active' : ''}"></div>`)}
        </div>
        <span class="i-strength-label">${this.strength}</span>
      </div>
    `;
  }

  render() {
    const ariaDescribedby = [
      this.description ? this.ids.desc : null,
      this.error ? this.ids.error : null
    ].filter(Boolean).join(' ');

    const inputClasses = this.error ? 'i-input i-input-error' : 'i-input';
    const wrapperClasses = this.error ? 'i-wrapper i-wrapper-error' : 'i-wrapper';

    return html`
        <div class="i-field">
          <label class="i-label" for="${this.ids.input}">
            ${this.label || ''}
            ${this.required ? html`<span class="i-required">Required</span>` : ''}
          </label>
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
          ${this._renderStrengthMeter()}
        </div>
      `;
  }
}

customElements.define('input-password', InputPassword);
