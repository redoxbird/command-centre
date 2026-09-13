import { html } from 'lit';
import Pickr from '@simonwep/pickr';
import InputTextBase from './e-input-text-base.js';

export default class InputColor extends InputTextBase {
  static properties = {
    themeMode: { type: String, attribute: 'theme-mode' },
    _pickr: { type: Object, state: false },
    defaultColor: { type: String, state: false },
  };

  constructor() {
    super();
    this.inputType = 'text';
    this.actionButton = 'color';
    this._pickr = null;
    this.defaultColor = '#023e8a';
    this._isPickrInitialized = false;
  }

  firstUpdated() {
    super.firstUpdated();
    this._initializePickr();
  }

  _initializePickr() {
    if (this._isPickrInitialized || typeof Pickr === 'undefined') {
      return;
    }

    const button = this.renderRoot.querySelector('.i-action-color');
    if (!button) {
      // Try again after a short delay if button not ready
      setTimeout(() => this._initializePickr(), 100);
      return;
    }

    try {
      this._pickr = Pickr.create({
        el: button,
        useAsButton: true,
        theme: 'monolith',
        default: this.value || this.defaultColor,
        swatches: [
          '#0f172a', // slate-900
          '#1e293b', // slate-800
          '#334155', // slate-700
          '#64748b', // slate-500
          '#94a3b8', // slate-400

          '#ef4444', // red-500
          '#f97316', // orange-500
          '#eab308', // yellow-500
          '#22c55e', // green-500
          '#06b6d4', // cyan-500
          '#0891b2', // cyan-600
          '#3b82f6', // blue-500
          '#6366f1', // indigo-500
          '#8b5cf6', // violet-500
          '#ec4899', // pink-500
        ],
        components: {
          preview: true,
          opacity: true,
          hue: true,
          interaction: {
            hex: true,
            rgba: true,
            hsla: true,
            hsva: true,
            input: true,
            save: true
          }
        },
        comparison: false,
        container: this.renderRoot.querySelector('.i-picker'),
        position: 'bottom-start',
        padding: 8,
        autoReposition: true
      });

      // Focus input when picker is clicked
      this._pickr.on('show', () => {
        const input = this.renderRoot.querySelector('input');
        if (input) {
          input.focus();
        }
      });

      // Add click handler to picker button to focus input
      button.addEventListener('click', (e) => {
        const input = this.renderRoot.querySelector('input');
        if (input && !this._pickr.isOpen()) {
          input.focus();
        }
      });

      // Sync picker with input changes
      this._pickr.on('change', (color) => {
        const hexColor = color.toHEXA().toString();
        this.value = hexColor;
        this._updateValue(hexColor);
        // Update the input element's value directly
        const input = this.renderRoot.querySelector('input');
        if (input) {
          input.value = hexColor;
        }
        this.requestUpdate();
      });

      // Sync input with picker changes
      this._pickr.on('save', (color) => {
        if (color) {
          const hexColor = color.toHEXA().toString();
          this.value = hexColor;
          this._updateValue(hexColor);
          const input = this.renderRoot.querySelector('input');
          if (input) {
            input.value = hexColor;
          }
          this.requestUpdate();
        }
      });

      // Update picker when input value changes externally
      this._pickr.on('init', () => {
        if (this.value) {
          this._pickr.setColor(this.value);
        }
      });

      this._isPickrInitialized = true;
    } catch (error) {
      console.error('Failed to initialize color picker:', error);
    }
  }

  // ------------------------------------------------------------------ //
  // Render – simplified for color input
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
          <label class="i-label" for="${this.ids.input}">${this.label || ''}</label>
          <div class="${wrapperClasses}">
              <input
                class="${inputClasses}"
                id="${this.ids.input}"
                name="${this.name || ''}"
                type="text"
                .value="${this.value ?? ''}"
                placeholder="${this.placeholder ?? '#ffffff'}"
                ?disabled="${this.disabled}"
                ?readonly="${this.readonly}"
                aria-required="${this.required ? 'true' : 'false'}"
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
          <div class="i-picker"></div>
          ${this._renderDescription()}
          ${this._renderError()}
        </div>
      `;
  }

  _renderAction() {
    if (!this.actionButton) return '';
    if (this.actionButton === 'color') {
      return html`<button class="i-action i-action-color" type="button" title="Select color">
          <span class="i-color-preview" style="background-color: ${this.value || this.defaultColor}"></span>
      </button>`;
    }
    return '';
  }

  _handleColorPicker(e) {
    e.preventDefault();
    if (this._pickr) {
      this._pickr.show();
    }
  }

  _onInput(e) {
    const inputValue = e.target.value;
    
    // Validate color format
    if (inputValue && !this._isValidColor(inputValue)) {
      // Revert to previous valid value
      e.target.value = this.value || this.defaultColor;
      return;
    }
    
    super._onInput(e);
    
    // Update Pickr preview if available
    if (this._pickr) {
      try {
        this._pickr.setColor(inputValue || this.defaultColor);
      } catch (error) {
        console.warn('Error updating color picker:', error);
      }
    }
  }

  updated(changedProperties) {
    super.updated(changedProperties);
    
    // Re-initialize Pickr if it was destroyed or if button was recreated
    if (changedProperties.has('actionButton') || changedProperties.has('disabled')) {
      if (this._pickr && this.disabled) {
        this._pickr.hide();
      }
      if (!this._isPickrInitialized) {
        this._initializePickr();
      }
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._pickr) {
      try {
        this._pickr.destroyAndRemove();
      } catch (error) {
        console.warn('Error destroying color picker:', error);
      }
      this._pickr = null;
      this._isPickrInitialized = false;
    }
  }

  _isValidColor(color) {
    // Basic hex color validation
    if (!color) return false;
    
    // Remove # if present
    const cleanColor = color.replace('#', '');
    
    // Check if it's a valid hex color (3, 6, or 8 characters)
    const hexPattern = /^[0-9A-Fa-f]{3}$|^[0-9A-Fa-f]{6}$|^[0-9A-Fa-f]{8}$/;
    if (!hexPattern.test(cleanColor)) {
      return false;
    }
    
    // Additional validation for valid color values
    const tempEl = document.createElement('div');
    tempEl.style.color = color;
    return tempEl.style.color !== '';
  }

}

customElements.define('input-color', InputColor);
