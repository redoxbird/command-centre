// @deprecated Standalone tag (see src/index.js): unstyled by all themes, undocumented, and emitting a divergent event vocabulary. Use <e-input type=...> instead; this file builds to dist/inputs/* for reference only.
import { html } from 'lit';
import * as z from 'zod';
import InputTextBase from './e-input-text-base.js';

/**
 * <input-date>
 * Date input with optional date picker and range support
 */
export default class InputDate extends InputTextBase {
  static properties = {
    // Date-specific
    range: { type: Boolean },
    startValue: { type: String },
    endValue: { type: String },
    rangeStartLabel: { type: String, attribute: 'range-start-label' },
    rangeEndLabel: { type: String, attribute: 'range-end-label' },
    isDatePickerVisible: { type: Boolean, state: true },
  };

  constructor() {
    super();
    this.inputType = 'date';
    this.actionButton = 'date-picker';
    this.startValue = '';
    this.endValue = '';
  }

  _parseDate(dateStr) {
    return dateStr ? new Date(dateStr) : null;
  }

  // ------------------------------------------------------------------ //
  // Render – handles single date or range
  // ------------------------------------------------------------------ //
  render() {
    if (this.range) {
      return this._renderRange();
    } else {
      return this._renderSingle();
    }
  }

  _renderSingle() {
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
                autocomplete="${this.autocomplete ?? 'off'}"
                ${this.autofocus ? 'autofocus' : ''}
              />
              ${this._renderAction()}
          </div>
          ${this.isDatePickerVisible ? html`<wc-datepicker show-clear-button value="${this.value}" @selectDate="${this._onDateChange}"></wc-datepicker>` : ''}
          ${this._renderDescription()}
          ${this._renderError()}
        </div>
      `;
  }

  _renderRange() {
    const startAriaDescribedby = [
      this.description ? this.ids.desc : null,
      this.error ? this.ids.error : null
    ].filter(Boolean).join(' ');

    const endAriaDescribedby = startAriaDescribedby;

    const startInputClasses = this.error ? 'i-input i-input-error' : 'i-input';
    const endInputClasses = this.error ? 'i-input i-input-error' : 'i-input';
    const wrapperClasses = this.error ? 'i-wrapper i-wrapper-error' : 'i-wrapper';

    return html`
        <div class="i-field">
            <div class="i-label-group">
                <label class="i-label">${this.label || ''}</label>

                <div class="i-label-secondary">
                    (<label for="${this.ids.input}-start">${this.rangeStartLabel || 'Start Date'}</label>
                    <span class="i-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-arrow-right"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l14 0" /><path d="M13 18l6 -6" /><path d="M13 6l6 6" /></svg></span>
                    <label for="${this.ids.input}-end">${this.rangeEndLabel || 'End Date'}</label>)
                </div>
            </div>

          <div class="${wrapperClasses}">
            <input
            class="${startInputClasses}"
            id="${this.ids.input}-start"
            name="start_date"
            type="date"
            .value="${this.startValue ?? ''}"
            ?disabled="${this.disabled}"
            ?readonly="${this.readonly}"
            aria-required="${this.required ? 'true' : 'false'}"
            aria-invalid="${this.valid ? undefined : 'true'}"
            aria-describedby="${startAriaDescribedby}"
            @input="${this._onStartInput}"
            @change="${this._onStartChange}"
            @blur="${this._onStartBlur}"
            autocomplete="${this.autocomplete ?? 'off'}"
            />
            <span class="i-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-arrow-right"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l14 0" /><path d="M13 18l6 -6" /><path d="M13 6l6 6" /></svg></span>
            <input
            class="${endInputClasses}"
            id="${this.ids.input}-end"
            name="end_date"
            type="date"
            .value="${this.endValue ?? ''}"
            ?disabled="${this.disabled}"
            ?readonly="${this.readonly}"
            aria-required="${this.required ? 'true' : 'false'}"
            aria-invalid="${this.valid ? undefined : 'true'}"
            aria-describedby="${endAriaDescribedby}"
            @input="${this._onEndInput}"
            @change="${this._onEndChange}"
            @blur="${this._onEndBlur}"
            autocomplete="${this.autocomplete ?? 'off'}"
            />
            ${this._renderAction()}
          </div>



          ${this.isDatePickerVisible ? html`<wc-datepicker range show-clear-button start-date="${this.startValue}" end-date="${this.endValue}" @selectDate="${this._onRangeChange}"></wc-datepicker>` : ''}
          ${this._renderDescription()}
          ${this._renderError()}
        </div>
      `;
  }

  _renderAction() {
    if (!this.actionButton) return '';

    if (this.actionButton === 'date-picker') {
      return html`
        <button class="i-action i-action-date-picker" type="button" @click="${this._onActionToggleDatePicker}" title="Toggle date picker">
        ${this.isDatePickerVisible ? html`<span class="i-icon i-action-icon-calendar-x"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-calendar-x"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M13 21h-7a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v6.5" /><path d="M16 3v4" /><path d="M8 3v4" /><path d="M4 11h16" /><path d="M22 22l-5 -5" /><path d="M17 22l5 -5" /></svg></span>` : html`<span class="i-icon i-action-icon-calendar"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-calendar"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12z" /><path d="M16 3v4" /><path d="M8 3v4" /><path d="M4 11h16" /><path d="M11 15h1" /><path d="M12 15v3" /></svg></span>`}
        </button>
      `;
    }

    return '';
  }

  _onActionToggleDatePicker(e) {
    e.stopPropagation();
    this.isDatePickerVisible = !this.isDatePickerVisible;
    this.requestUpdate();
  }

  _onDateChange(e) {
    this._updateValue(e.detail);
  }

  _onRangeChange(e) {
    this.startValue = e.detail[0];
    this.endValue = e.detail[1];
    this._updateValue(JSON.stringify({ start: this.startValue, end: this.endValue }));
    this.validate();
  }

  _onStartInput(e) {
    this.startValue = e.target.value;
    this._updateValue(JSON.stringify({ start: this.startValue, end: this.endValue }));
    this._callHook('onInput', e);
  }

  _onStartChange(e) {
    this._handleChange();
    this._callHook('onChange', e);
  }

  _onStartBlur(e) {
    this._handleBlur();
    this._callHook('onBlur', e);
  }

  _onEndInput(e) {
    this.endValue = e.target.value;
    this._updateValue(JSON.stringify({ start: this.startValue, end: this.endValue }));
    this._callHook('onInput', e);
  }

  _onEndChange(e) {
    this._handleChange();
    this._callHook('onChange', e);
  }

  _onEndBlur(e) {
    this._handleBlur();
    this._callHook('onBlur', e);
  }

  // ------------------------------------------------------------------ //
  // Override _buildSchema for date validation
  // ------------------------------------------------------------------ //
  _buildSchema() {
    let schema = z.string();

    if (this.required) {
      schema = schema.min(1, this.requiredMessage || (this.label ? `${this.label} is required` : 'This field is required'));
    }

    if (this.range) {
      // For range, expect JSON string with start and end
      schema = schema.refine((val) => {
        try {
          const parsed = JSON.parse(val);
          return parsed.start && parsed.end && parsed.start <= parsed.end;
        } catch {
          return false;
        }
      }, "Select a valid date range");
    } else {
      // For single date, use iso-date if format is set
      if (this.format === 'iso-date') {
        schema = z.iso.date(this.formatMessage || 'Invalid date');
      }
    }

    return schema;
  }

  // ------------------------------------------------------------------ //
  // Override focus for range
  // ------------------------------------------------------------------ //
  focus() {
    if (this.range) {
      const input = this.renderRoot?.querySelector('#' + this.ids.input + '-start');
      input?.focus();
    } else {
      super.focus();
    }
  }

  // ------------------------------------------------------------------ //
  // Override reset to clear date picker visibility
  // ------------------------------------------------------------------ //
  reset() {
    super.reset();
    this.startValue = '';
    this.endValue = '';
    this.isDatePickerVisible = false;
  }
}

customElements.define('input-date', InputDate);
