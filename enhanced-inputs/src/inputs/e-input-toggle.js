import { html } from 'lit';
import InputCheckboxBase from './e-input-checkbox-base.js';

/**
 * <input-toggle>
 * Toggle switch input component with label and description
 */
export default class InputToggle extends InputCheckboxBase {
  // ------------------------------------------------------------------ //
  // Render – label and description on the left, toggle on the right
  // ------------------------------------------------------------------ //
  render() {
    const ariaDescribedby = [
      this.description ? this.ids.desc : null,
      this.error ? this.ids.error : null
    ].filter(Boolean).join(' ');

    const toggleClasses = `i-toggle i-toggle-${this.size} ${this.checked ? 'i-toggle-checked' : ''}`;

    return html`
      <div class="i-field i-toggle-field">
        <div class="i-field-left">
          <label class="i-label" for="${this.ids.input}">
            ${this.label || ''}
          </label>
          ${this._renderDescription()}
        </div>
        <div class="i-field-right">
          <label class="${toggleClasses}" for="${this.ids.input}">
            <input
              id="${this.ids.input}"
              class="i-toggle-input"
              type="checkbox"
              .checked="${this.checked}"
              ?disabled="${this.disabled}"
              ?readonly="${this.readonly}"
              aria-required="${this.required ? 'true' : 'false'}"
              aria-invalid="${this.valid ? undefined : 'true'}"
              aria-describedby="${ariaDescribedby}"
              @change="${this._onToggleChange}"
              ${this.autofocus ? 'autofocus' : ''}
            />
            <div class="i-toggle-track">
              <div class="i-toggle-thumb"></div>
            </div>
          </label>
        </div>
        ${this._renderError()}
      </div>
    `;
  }

  _renderDescription() {
    if (!this.description) return '';
    return html`<p class="i-description" id="${this.ids.desc}">${this.description}</p>`;
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
}

customElements.define('input-toggle', InputToggle);