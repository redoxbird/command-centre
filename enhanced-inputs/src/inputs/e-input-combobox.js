// @deprecated Standalone tag (see src/index.js): unstyled by all themes, undocumented, and emitting a divergent event vocabulary. Use <e-input type=...> instead; this file builds to dist/inputs/* for reference only.
import { html } from 'lit';
import uFuzzy from '@leeoniya/ufuzzy';
import InputBase from './e-input-base.js';

export default class InputCombobox extends InputBase {
  static properties = {
    // Combobox-specific properties
    multiple: { type: Boolean },
    placeholder: { type: String },

    // Internal state
    isOpen: { type: Boolean, state: true },
    filteredOptions: { type: Array, state: true },
    searchQuery: { type: String, state: true },
    selectedOptions: { type: Array, state: true },
    virtualStart: { type: Number, state: true },
    virtualEnd: { type: Number, state: true },
    highlightedIndex: { type: Number, state: true },
  };

  constructor() {
    super();
    this.multiple = false;
    this.isOpen = false;
    this.filteredOptions = [];
    this.searchQuery = '';
    this.selectedOptions = [];
    this.virtualStart = 0;
    this.virtualEnd = 50; // Render 50 items at a time for lazy rendering
    this.highlightedIndex = -1;
    this.uf = new uFuzzy();
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
    this.options = Array.from(this.querySelectorAll('e-combobox-option')).map((opt, index) => ({
      value: opt.value || opt.label || opt.textContent,
      text: opt.label || opt.textContent,
      description: opt.description || '',
      index,
    }));
    this.filteredOptions = [...this.options];
    this._updateSelectedOptions();
    // Hide the option elements since they are data-only
    this.querySelectorAll('e-combobox-option').forEach(opt => opt.style.display = 'none');
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

  _renderChips() {
    if (!this.multiple || this.selectedOptions.length === 0) return '';

    return html`
      <div class="i-chips">
        ${this.selectedOptions.map(opt => html`
          <div class="i-chip">
            <span class="i-chip-text">${opt.text}</span>
            <button
              class="i-chip-remove"
              type="button"
              @click="${(e) => this._removeChip(opt, e)}"
              aria-label="Remove ${opt.text}">
              <span class="i-chip-remove-icon">×</span>
            </button>
          </div>
        `)}
      </div>
    `;
  }

  _removeChip(opt, e) {
    e.stopPropagation();
    if (this.multiple && Array.isArray(this.value)) {
      const currentValue = [...this.value];
      const index = currentValue.indexOf(opt.value);
      if (index > -1) {
        currentValue.splice(index, 1);
        this.value = currentValue;
        this._updateValue(this.value);
        this._updateSelectedOptions();
      }
    }
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
        ${this._renderChips()}
        <div class="${wrapperClasses}" @click="${this._toggleDropdown}">
          <input
            class="i-input"
            id="${this.ids.input}"
            .value="${this.isOpen ? this.searchQuery : this._getDisplayValue()}"
            placeholder="${this.isOpen ? 'Search...' : (this.placeholder ?? '')}"
            ?disabled="${this.disabled}"
            @input="${this._onInput}"
            @keydown="${this._onKeydown}"
            @focus="${this._onFocus}"
            @click="${(e) => e.stopPropagation()}"
            aria-expanded="${this.isOpen}"
            aria-haspopup="listbox"
            aria-describedby="${ariaDescribedby}"
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
    const visibleOptions = this.filteredOptions.slice(this.virtualStart, this.virtualEnd);
    return html`
      <div class="i-dropdown" role="listbox">
        <div
          class="i-options"
          @scroll="${this._onScroll}"
          style="max-height: 200px; overflow-y: auto;"
        >
          ${visibleOptions.map((opt, index) => {
            const globalIndex = this.virtualStart + index;
            const isHighlighted = globalIndex === this.highlightedIndex;
            return html`
              <div
                class="i-option ${opt.selected ? 'i-option-selected' : ''} ${isHighlighted ? 'i-option-highlighted' : ''}"
                @click="${() => this._selectOption(opt)}"
                role="option"
                aria-selected="${opt.selected}"
              >
                <div class="i-option-label">${opt.text}</div>
                ${opt.description ? html`<div class="i-option-description">${opt.description}</div>` : ''}
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
        this.searchQuery = '';
        this.filteredOptions = [...this.options];
        this.virtualStart = 0;
        this.virtualEnd = 50;
        // Find the first selected option and highlight it, or highlight the first option
        const firstSelectedIndex = this.filteredOptions.findIndex(opt => opt.selected);
        this.highlightedIndex = firstSelectedIndex >= 0 ? firstSelectedIndex : (this.filteredOptions.length > 0 ? 0 : -1);
        this.requestUpdate();
        setTimeout(() => this._scrollToHighlighted(), 0);
      } else {
        this.highlightedIndex = -1;
      }
    }
  }

  _onInput(e) {
    this.searchQuery = e.target.value;
    if (this.searchQuery.trim()) {
      let haystack = this.options.map(o => o.text);
      let [idxs] = this.uf.search(haystack, this.searchQuery);
      this.filteredOptions = idxs ? idxs.map(i => this.options[i]) : [];
    } else {
      this.filteredOptions = [...this.options];
    }
    this.virtualStart = 0;
    this.virtualEnd = Math.min(50, this.filteredOptions.length);
    this.highlightedIndex = this.filteredOptions.length > 0 ? 0 : -1;
    if (!this.isOpen) {
      this.isOpen = true;
    }
    this.requestUpdate();
    setTimeout(() => this._scrollToHighlighted(), 0);
  }

  _onScroll(e) {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const atBottom = scrollTop + clientHeight >= scrollHeight - 10;
    if (atBottom && this.virtualEnd < this.filteredOptions.length) {
      this.virtualEnd = Math.min(this.virtualEnd + 50, this.filteredOptions.length);
    }
  }

  _onKeydown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!this.isOpen) {
        this._toggleDropdown();
      } else {
        this.highlightedIndex = Math.min(this.highlightedIndex + 1, this.filteredOptions.length - 1);
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
      if (this.highlightedIndex >= 0 && this.highlightedIndex < this.filteredOptions.length) {
        this._selectOption(this.filteredOptions[this.highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      this.isOpen = false;
      this.searchQuery = '';
      this.filteredOptions = [...this.options];
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
    this.searchQuery = '';
    this.filteredOptions = [...this.options];
    this.highlightedIndex = -1;
    this._updateSelectedOptions();
  }

  focus() {
    const input = this.renderRoot?.querySelector('.i-input');
    input?.focus();
  }
}

class InputComboboxOption extends HTMLElement {
  constructor() {
    super();
  }

  get value() {
    return this.getAttribute('value') || this.textContent;
  }

  set value(val) {
    this.setAttribute('value', val);
  }

  get label() {
    return this.getAttribute('label') || this.textContent;
  }

  get description() {
    return this.getAttribute('description') || '';
  }
}

customElements.define('input-combobox', InputCombobox);