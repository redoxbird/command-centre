// @deprecated Standalone tag (see src/index.js): unstyled by all themes, undocumented, and emitting a divergent event vocabulary. Use <e-input type=...> instead; this file builds to dist/inputs/* for reference only.
import InputNumberBase from "./e-input-number-base";
import { html } from 'lit';

class InputNumber extends InputNumberBase {
  constructor() {
    super();
    this.inputType = 'number';
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
              <div class="i-number-actions">
                <button class="i-action i-action-decrease" type="button" @click="${this._onDecrease}" title="Decrease" ?disabled="${this.disabled}">
                  <svg xmlns="http://www.w3.org/2000/svg" width="1rem" height="1rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-minus"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l14 0" /></svg>
                </button>
                <button class="i-action i-action-increase" type="button" @click="${this._onIncrease}" title="Increase" ?disabled="${this.disabled}">
                  <svg xmlns="http://www.w3.org/2000/svg" width="1rem" height="1rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-plus"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5l0 14" /><path d="M5 12l14 0" /></svg>
                </button>
              </div>
          </div>
          ${this._renderDescription()}
          ${this._renderError()}
        </div>
      `;
  }

  _onIncrease(e) {
    e.stopPropagation();
    const currentValue = parseFloat(this.value) || 0;
    const step = this.step || 1;
    this.value = (currentValue + step).toString();
    this._updateValue(this.value);
  }

  _onDecrease(e) {
    e.stopPropagation();
    const currentValue = parseFloat(this.value) || 0;
    const step = this.step || 1;
    this.value = (currentValue - step).toString();
    this._updateValue(this.value);
  }
}

customElements.define('input-number', InputNumber);
