import { html } from 'lit';
import InputTextBase from './e-input-text-base.js';

export default class InputTextarea extends InputTextBase {
  static properties = {
    ...super.properties,
    rows: { type: Number },
    cols: { type: Number },
  };

  constructor() {
    super();
    this.rows = 4;
    this.cols = 50;
  }

  render() {
    const ariaDescribedby = [
      this.description ? this.ids.desc : null,
      this.error ? this.ids.error : null
    ].filter(Boolean).join(' ');

    const textareaClasses = this.error ? 'i-textarea i-textarea-error' : 'i-textarea';
    const wrapperClasses = this.error ? 'i-wrapper i-wrapper-error' : 'i-wrapper';

    return html`
        <div class="i-field">
          <label class="i-label" for="${this.ids.input}">${this.label || ''}</label>
          <div class="${wrapperClasses}">
              ${this._renderPrefix()}
              <textarea
                class="${textareaClasses}"
                id="${this.ids.input}"
                name="${this.name || ''}"
                .value="${this.value ?? ''}"
                placeholder="${this.placeholder ?? ''}"
                ?disabled="${this.disabled}"
                ?readonly="${this.readonly}"
                rows="${this.rows}"
                cols="${this.cols}"
                maxlength="${this.max || ''}"
                aria-required="${this.required ? 'true' : 'false'}"
                aria-invalid="${this.valid ? undefined : 'true'}"
                aria-describedby="${ariaDescribedby}"
                @input="${this._onInput}"
                @change="${this._onChange}"
                @blur="${this._onBlur}"
                autocomplete="${this.autocomplete ?? 'off'}"
                ${this.autofocus ? 'autofocus' : ''}
              ></textarea>
              ${this._renderAction()}
          </div>
          ${this.max ? html`<div class="i-char-count">${this.value?.length || 0}/${this.max} characters</div>` : ''}
          ${this._renderDescription()}
          ${this._renderError()}
        </div>
      `;
  }
}

customElements.define('input-textarea', InputTextarea);