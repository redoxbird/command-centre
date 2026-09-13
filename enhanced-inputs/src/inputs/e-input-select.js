import { html } from 'lit';
import InputBase from './e-input-base.js';

export default class InputSelect extends InputBase {
  static properties = {
    // Select-specific properties
    multiple: { type: Boolean },
    placeholder: { type: String },

    // Internal state
    isOpen: { type: Boolean, state: true },
    selectedOptions: { type: Array, state: true },
    highlightedIndex: { type: Number, state: true },
  };

  constructor() {
    super();
    this.multiple = false;
    this.isOpen = false;
    this.selectedOptions = [];
    this.highlightedIndex = -1;
    this.options = [];
  }

  connectedCallback() {
    super.connectedCallback();
    this._collectOptions();
    document.addEventListener('click', this._handleOutsideClick.bind(this));
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('click', this._handleOutsideClick.bind(this));
  }

  _handleOutsideClick(e) {
    if (!this.contains(e.target)) {
      this.isOpen = false;
    }
  }

  updated(changed) {
    super.updated(changed);
    if (changed.has('value')) {
      this._updateSelectedOptions();
    }
  }

  _collectOptions() {
    this.options = Array.from(this.querySelectorAll('e-select-option')).map((opt, index) => ({
      value: opt.value || opt.textContent,
      text: opt.textContent,
      index,
    }));
    this._updateSelectedOptions();
    // Hide the option elements since they are data-only
    this.querySelectorAll('e-select-option').forEach(opt => opt.style.display = 'none');
  }

  _updateSelectedOptions() {
    this.options.forEach(opt => {
      if (this.multiple) {
        opt.selected = Array.isArray(this.value) && this.value.includes(opt.value);
      } else {
        opt.selected = this.value === opt.value;
      }
    });
    this.selectedOptions = this.options.filter(opt => opt.selected);
  }

  render() {
    const ariaDescribedby = [
      this.description ? this.ids.desc : null,
      this.error ? this.ids.error : null,
    ].filter(Boolean).join(' ');

    const wrapperClasses = this.error ? 'i-wrapper i-wrapper-error' : 'i-wrapper';

    return html`
      <div class="i-field">
        <label class="i-label" for="${this.ids.input}">${this.label || ''}</label>
        <div class="${wrapperClasses}" @click="${this._toggleDropdown}">
          <input
            class="i-input"
            id="${this.ids.input}"
            .value="${this._getDisplayValue()}"
            placeholder="${this.placeholder ?? ''}"
            ?disabled="${this.disabled}"
            @keydown="${this._onKeydown}"
            @focus="${this._onFocus}"
            @click="${(e) => e.stopPropagation()}"
            aria-expanded="${this.isOpen}"
            aria-haspopup="listbox"
            aria-describedby="${ariaDescribedby}"
            readonly
          />
          <button class="i-action i-action-dropdown" type="button" @click="${this._toggleDropdown}">
            <span class="i-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </span>
          </button>
        </div>
        ${this.isOpen ? this._renderDropdown() : ''}
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

  _renderDropdown() {
    return html`
      <div class="i-dropdown" role="listbox">
        <div
          class="i-options"
          style="max-height: 200px; overflow-y: auto;"
        >
          ${this.options.map((opt, index) => {
            const isHighlighted = index === this.highlightedIndex;
            return html`
              <div
                class="i-option ${opt.selected ? 'i-option-selected' : ''} ${isHighlighted ? 'i-option-highlighted' : ''}"
                @click="${() => this._selectOption(opt)}"
                role="option"
                aria-selected="${opt.selected}"
              >
                ${opt.text}
              </div>
            `;
          })}
        </div>
      </div>
    `;
  }

  _toggleDropdown(e) {
    e?.stopPropagation();
    if (!this.disabled) {
      this.isOpen = !this.isOpen;
      if (this.isOpen) {
        // Find the first selected option and highlight it, or highlight the first option
        const firstSelectedIndex = this.options.findIndex(opt => opt.selected);
        this.highlightedIndex = firstSelectedIndex >= 0 ? firstSelectedIndex : (this.options.length > 0 ? 0 : -1);
        this.requestUpdate();
        setTimeout(() => this._scrollToHighlighted(), 0);
      } else {
        this.highlightedIndex = -1;
      }
    }
  }


  _onKeydown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!this.isOpen) {
        this._toggleDropdown();
      } else {
        this.highlightedIndex = Math.min(this.highlightedIndex + 1, this.options.length - 1);
        this.requestUpdate();
        setTimeout(() => this._scrollToHighlighted(), 0);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.highlightedIndex = Math.max(this.highlightedIndex - 1, 0);
      this.requestUpdate();
      setTimeout(() => this._scrollToHighlighted(), 0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (this.highlightedIndex >= 0 && this.highlightedIndex < this.options.length) {
        this._selectOption(this.options[this.highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      this.isOpen = false;
      this.highlightedIndex = -1;
    }
  }

  _onFocus() {
    if (!this.isOpen && !this.disabled) {
      this._toggleDropdown();
    }
  }

  _scrollToHighlighted() {
    const optionsEl = this.renderRoot?.querySelector('.i-options');
    const highlightedEl = optionsEl?.querySelector('.i-option-highlighted');
    if (highlightedEl) {
      highlightedEl.scrollIntoView({ block: 'nearest' });
    }
  }

  _selectOption(opt) {
    if (this.multiple) {
      // Handle multiple selection
      const currentValue = Array.isArray(this.value) ? [...this.value] : [];
      const index = currentValue.indexOf(opt.value);
      if (index > -1) {
        currentValue.splice(index, 1);
      } else {
        currentValue.push(opt.value);
      }
      this.value = currentValue;
    } else {
      this.value = opt.value;
      this.isOpen = false;
    }
    this._updateValue(this.value);
    this._updateSelectedOptions();
  }

  _getDisplayValue() {
    if (this.multiple) {
      return this.selectedOptions.map(opt => opt.text).join(', ');
    } else {
      return this.selectedOptions.length > 0 ? this.selectedOptions[0].text : '';
    }
  }

  // Override validation if needed
  async validate() {
    // Basic validation, can be extended
    if (this.required && (!this.value || (Array.isArray(this.value) && this.value.length === 0))) {
      this.setValidState({ valid: false, error: `${this.label || 'Selection'} is required` });
      return { valid: false, error: `${this.label || 'Selection'} is required` };
    }
    this.setValidState({ valid: true });
    return { valid: true };
  }

  reset() {
    super.reset();
    this.selectedOptions = [];
    this.isOpen = false;
    this.highlightedIndex = -1;
    this._updateSelectedOptions();
  }

  focus() {
    const input = this.renderRoot?.querySelector('.i-input');
    input?.focus();
  }
}

class InputSelectOption extends HTMLElement {
  constructor() {
    super();
  }

  get value() {
    return this.getAttribute('value') || this.textContent;
  }

  set value(val) {
    this.setAttribute('value', val);
  }
}

customElements.define('input-select', InputSelect);