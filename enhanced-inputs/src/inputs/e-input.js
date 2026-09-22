import { html } from 'lit';
import * as z from 'zod';
import { MaskInput } from "maska";
import uFuzzy from '@leeoniya/ufuzzy';
import Pickr from '@simonwep/pickr';
import EInputBase from './e-input-base.js';
import './e-input-options.js';
import COUNTRIES from './countries.js';

export default class EInput extends EInputBase {
  static properties = {
    ...EInputBase.properties,
    type: { type: String, reflect: true },
    actionButton: { type: String, attribute: 'action-button' },
    prefix: { type: String, attribute: 'prefix' },
    prefixValue: { type: String, attribute: 'prefix-value' },
    unstyled: { type: Boolean, attribute: 'unstyled' },
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
    mask: { type: String },
    gt: { type: Number, reflect: true },
    gte: { type: Number, reflect: true },
    lt: { type: Number, reflect: true },
    lte: { type: Number, reflect: true },
    int: { type: Boolean, reflect: true },
    positive: { type: Boolean, reflect: true },
    nonnegative: { type: Boolean, reflect: true },
    negative: { type: Boolean, reflect: true },
    nonpositive: { type: Boolean, reflect: true },
    multipleOf: { type: Number, attribute: 'multiple-of', reflect: true },
    step: { type: Number, reflect: true },
    finite: { type: Boolean, reflect: true },
    safe: { type: Boolean, reflect: true },
    gtMessage: { type: String, attribute: 'gt-message' },
    gteMessage: { type: String, attribute: 'gte-message' },
    ltMessage: { type: String, attribute: 'lt-message' },
    lteMessage: { type: String, attribute: 'lte-message' },
    multipleOfMessage: { type: String, attribute: 'multiple-of-message' },
    stepMessage: { type: String, attribute: 'step-message' },
    finiteMessage: { type: String, attribute: 'finite-message' },
    safeMessage: { type: String, attribute: 'safe-message' },
    checked: { type: Boolean, reflect: true },
    onLabel: { type: String, attribute: 'on-label' },
    offLabel: { type: String, attribute: 'off-label' },
    size: { type: String, reflect: true },
    multiple: { type: Boolean },
    rows: { type: Number },
    cols: { type: Number },
    range: { type: Boolean },
    startValue: { type: String },
    endValue: { type: String },
    rangeStartLabel: { type: String, attribute: 'range-start-label' },
    rangeEndLabel: { type: String, attribute: 'range-end-label' },
    isDatePickerVisible: { type: Boolean, state: true },
    themeMode: { type: String, attribute: 'theme-mode' },
    swatches: { type: String },
    valueMin: { type: Number },
    valueMax: { type: Number },
    valueType: { type: String, attribute: 'value-type' },
    currencySymbol: { type: String },
    locale: { type: String },
    currencyCode: { type: String, attribute: 'currency-code' },
    currencyDisplay: { type: String, attribute: 'currency-display' },
    currencyStyle: { type: String, attribute: 'currency-style' },
    numberFormatOptions: { type: String, attribute: 'number-format-options' },
    relativeTimeFormatOptions: { type: String, attribute: 'relative-time-format-options' },
    listFormatOptions: { type: String, attribute: 'list-format-options' },
    country: { type: String },
    dialCode: { type: String },
    localDigits: { type: String },
    minDigits: { type: Number, attribute: 'min-digits' },
    isOpen: { type: Boolean, state: true },
    filteredOptions: { type: Array, state: true },
    searchQuery: { type: String, state: true },
    selectedOptions: { type: Array, state: true },
    virtualStart: { type: Number, state: true },
    virtualEnd: { type: Number, state: true },
    highlightedIndex: { type: Number, state: true },
    strength: { type: String, state: true },
    strengthMeter: { type: Boolean, attribute: 'strength-meter', reflect: true },
    isPasswordVisible: { type: Boolean, state: true },
  };

  constructor() {
    super();
    this.type = 'text';
    this.actionButton = '';
    this.prefix = '';
    this.prefixValue = '';
    this.unstyled = false;
    this.mask = '';
    this._maskInstance = null;
    this.isPasswordVisible = false;
    this.strength = 'weak';
    this.strengthMeter = true;
    this.checked = false;
    this.size = 'md';
    this.onLabel = 'On';
    this.offLabel = 'Off';
    this.multiple = false;
    this.rows = 4;
    this.cols = 50;
    this.range = false;
    this.startValue = '';
    this.endValue = '';
    this.isDatePickerVisible = false;
    this._datePickerInitialized = false;
    this._pickr = null;
    this._isPickrInitialized = false;
    this.defaultColor = '#023e8a';
    this.valueMin = 25;
    this.valueMax = 75;
    this.valueType = 'number';
    this.currencySymbol = '$';
    this.locale = navigator.language || 'en-US';
    this.currencyCode = 'USD';
    this.currencyDisplay = 'symbol';
    this.currencyStyle = 'currency';
    this.numberFormatOptions = '{}';
    this.relativeTimeFormatOptions = '{}';
    this.listFormatOptions = '{}';
    this.countries = COUNTRIES;
    this.country = 'US';
    this.dialCode = '+1';
    this.localDigits = '';
    this.isOpen = false;
    this.filteredOptions = [];
    this.searchQuery = '';
    this.selectedOptions = [];
    this.virtualStart = 0;
    this.virtualEnd = 50;
    this.highlightedIndex = -1;
    this.uf = new uFuzzy();
    this.options = [];
    this.ids.country = `e-country-${Math.random().toString(36).substr(2, 9)}`;
  }

  connectedCallback() {
    super.connectedCallback();
    if (this.type === 'date' && !this.actionButton) {
      this.actionButton = 'date-picker';
    }
    if (this._isSelectLike()) {
      this._collectOptions();
      this._boundOutsideClick = (e) => { if (!this.contains(e.target)) this.isOpen = false; };
      document.addEventListener('click', this._boundOutsideClick);
    }
    if (this._isCheckboxLike()) {
      this.value = this.checked ? 'on' : 'off';
    }
    if (this._isRadioLike()) {
      this._collectOptions();
    }
    if (this._isCheckboxGroupLike()) {
      this._collectOptions();
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._isSelectLike()) {
      document.removeEventListener('click', this._boundOutsideClick);
    }
    if (this._maskInstance) {
      this._maskInstance.destroy();
      this._maskInstance = null;
    }
    if (this._pickr) {
      try { this._pickr.destroyAndRemove(); } catch {}
      this._pickr = null;
      this._isPickrInitialized = false;
    }
  }

  _isSelectLike() {
    return this.type === 'select' || this.type === 'combobox';
  }

  _isCheckboxLike() {
    return this.type === 'checkbox' || this.type === 'toggle';
  }

  _isRadioLike() {
    return this.type === 'radio';
  }

  _isCheckboxGroupLike() {
    return this.type === 'checkbox-group';
  }

  _handleOutsideClick(e) {
    if (!this.contains(e.target)) {
      this.isOpen = false;
    }
  }

  _collectOptions() {
    const selector = this.type === 'select' ? 'e-select-option' :
      this.type === 'combobox' ? 'e-combobox-option' :
      this.type === 'radio' ? 'e-radio-option' :
      this.type === 'checkbox-group' ? 'e-checkbox-option' : null;
    if (!selector) return;
    const root = this.shadow ? (this.renderRoot || this) : this;
    this.options = Array.from(root.querySelectorAll(selector)).map((opt, index) => ({
      value: opt.value !== undefined && opt.value !== null ? opt.value : (opt.label || opt.textContent),
      text: opt.label || opt.textContent,
      label: opt.label || opt.textContent,
      description: opt.description || '',
      badge: opt.badge,
      disabled: opt.disabled,
      selected: opt.selected,
      index,
    }));
    if (this.type === 'combobox') {
      this.filteredOptions = [...this.options];
    }
    this._updateSelectedOptions();
    root.querySelectorAll(selector).forEach(opt => opt.style.display = 'none');
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

  firstUpdated() {
    super.firstUpdated();
    if (this.mask && this.type !== 'phone') {
      const input = this.renderRoot.querySelector('input');
      if (input) {
        this._maskInstance = new MaskInput(input, this._getMaskOptions());
      }
    }
    if (this.type === 'phone') {
      const phoneInput = this.renderRoot?.querySelector('.i-input');
      if (phoneInput) {
        this._maskInstance = new MaskInput(phoneInput, { mask: this.mask || '(###) ###-####' });
      }
    }
    if (this.type === 'color') {
      this._initializePickr();
    }
  }

  updated(changed) {
    super.updated(changed);
    if (changed.has('value') && this._isSelectLike()) {
      this._updateSelectedOptions();
    }
    if (changed.has('value') && this._isRadioLike()) {
      this._updateChecked();
    }
    if (changed.has('value') && this._isCheckboxGroupLike()) {
      this._updateChecked();
    }
    if (changed.has('actionButton') || changed.has('disabled')) {
      if (this._pickr && this.disabled) this._pickr.hide();
      if (!this._isPickrInitialized && this.type === 'color') this._initializePickr();
    }
  }

  _getMaskOptions() {
    const baseOptions = {};
    switch (this.mask) {
      case 'ip': return { ...baseOptions, mask: "###.###.###.###" };
      case 'phone': return { ...baseOptions, mask: "(###) ###-####" };
      case 'phone-international': return { ...baseOptions, mask: "+# (###) ###-####" };
      case 'credit-card': return { ...baseOptions, mask: "#### #### #### ####" };
      case 'ssn': return { ...baseOptions, mask: "###-##-####" };
      case 'zip': return { ...baseOptions, mask: "#####" };
      case 'zip-extended': return { ...baseOptions, mask: "#####-####" };
      case 'date': return { ...baseOptions, mask: "##/##/####" };
      case 'time': return { ...baseOptions, mask: "##:##" };
      case 'time-full': return { ...baseOptions, mask: "##:##:##" };
      case 'money': return { ...baseOptions, preProcess: (val) => val.replace(/[$,]/g, ""), postProcess: (val) => { if (!val) return ""; const sub = 3 - (val.includes(".") ? val.length - val.indexOf(".") : 0); return Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val).slice(0, sub ? -sub : undefined); } };
      case 'money-number': return { ...baseOptions, number: { locale: 'uk', fraction: 2, unsigned: true }, postProcess: (val) => val ? `£${val}` : '' };
      case 'uppercase': return { ...baseOptions, preProcess: (val) => val.toUpperCase() };
      case 'lowercase': return { ...baseOptions, preProcess: (val) => val.toLowerCase() };
      default: return { ...baseOptions, mask: this.mask };
    }
  }

  _getInputType() {
    const typeMap = {
      'text': 'text', 'email': 'email', 'password': 'password', 'url': 'url',
      'search': 'search', 'number': 'number', 'phone': 'tel', 'date': 'date',
      'color': 'text', 'range': 'text', 'select': 'text', 'combobox': 'text',
      'textarea': 'text', 'radio': 'text', 'checkbox': 'checkbox', 'toggle': 'checkbox',
    };
    let t = typeMap[this.type] || 'text';
    if (t === 'password' && this.actionButton === 'show' && this.isPasswordVisible) {
      t = 'text';
    }
    return t;
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

  _initializePickr() {
    if (this._isPickrInitialized || typeof Pickr === 'undefined' || this.type !== 'color') return;
    const button = this.renderRoot.querySelector('.i-action-color');
    if (!button) {
      this._pickrRetries = (this._pickrRetries || 0) + 1;
      if (this._pickrRetries < 20) setTimeout(() => this._initializePickr(), 100);
      return;
    }
    try {
      const swatches = this.swatches
        ? this.swatches.split(',').map(s => s.trim())
        : ['#0f172a','#1e293b','#334155','#64748b','#94a3b8','#ef4444','#f97316','#eab308','#22c55e','#06b6d4','#0891b2','#3b82f6','#6366f1','#8b5cf6','#ec4899'];
      this._pickr = Pickr.create({
        el: button, useAsButton: true, theme: 'monolith',
        default: this.value || this.defaultColor,
        swatches,
        components: { preview: true, opacity: true, hue: true, interaction: { hex: true, rgba: true, hsla: true, hsva: true, input: true, save: true } },
        comparison: false, container: this.renderRoot.querySelector('.i-picker'), position: 'bottom-start', padding: 8, autoReposition: true
      });
      this._pickr.on('show', () => { const input = this.renderRoot.querySelector('input'); if (input) input.focus(); });
      button.addEventListener('click', () => { const input = this.renderRoot.querySelector('input'); if (input && !this._pickr.isOpen()) input.focus(); });
      this._pickr.on('change', (color) => { const hex = color.toHEXA().toString(); this.value = hex; this._updateValue(hex); const input = this.renderRoot.querySelector('input'); if (input) input.value = hex; this.requestUpdate(); });
      this._pickr.on('save', (color) => { if (color) { const hex = color.toHEXA().toString(); this.value = hex; this._updateValue(hex); const input = this.renderRoot.querySelector('input'); if (input) input.value = hex; this.requestUpdate(); } });
      this._pickr.on('init', () => { if (this.value) this._pickr.setColor(this.value); });
      this._isPickrInitialized = true;
    } catch (error) { console.error('Failed to initialize color picker:', error); }
  }

  _isValidColor(color) {
    if (!color) return false;
    const clean = color.replace('#', '');
    return /^[0-9A-Fa-f]{3}$|^[0-9A-Fa-f]{6}$|^[0-9A-Fa-f]{8}$/.test(clean);
  }

  _getNumberFormatOptions() { try { return JSON.parse(this.numberFormatOptions || '{}'); } catch { return {}; } }
  _getRelativeTimeFormatOptions() { try { return JSON.parse(this.relativeTimeFormatOptions || '{}'); } catch { return {}; } }
  _getListFormatOptions() { try { return JSON.parse(this.listFormatOptions || '{}'); } catch { return {}; } }

  _formatNumber(value) { return new Intl.NumberFormat(this.locale, this._getNumberFormatOptions()).format(value); }
  _formatCurrency(value) { return new Intl.NumberFormat(this.locale, { style: this.currencyStyle, currency: this.currencyCode, currencyDisplay: this.currencyDisplay, ...this._getNumberFormatOptions() }).format(value); }
  _formatRelativeTime(value) { return new Intl.RelativeTimeFormat(this.locale, this._getRelativeTimeFormatOptions()).format(value, 'day'); }
  _formatList(items) { return new Intl.ListFormat(this.locale, this._getListFormatOptions()).format(items); }

  _formatValue(val) {
    if (this.valueType === 'percentage') return `${this._formatNumber(val)}%`;
    if (this.valueType === 'currency') return this._formatCurrency(val);
    if (this.valueType === 'relativetime') return this._formatRelativeTime(val);
    if (this.valueType === 'list') return this._formatList(val);
    return this._formatNumber(val);
  }

  _getDisplayValue() {
    if (this.type === 'range') {
      if (this.range) return `${this._formatValue(this.valueMin)} - ${this._formatValue(this.valueMax)}`;
      return this._formatValue(Number(this.value));
    }
    if (this._isSelectLike()) {
      if (this.multiple) return this.selectedOptions.map(opt => opt.text).join(', ');
      return this.selectedOptions.length > 0 ? this.selectedOptions[0].text : '';
    }
    return this.value;
  }

  _getDisplayValueForSelect() {
    if (this.multiple) return this.selectedOptions.map(opt => opt.text).join(', ');
    return this.selectedOptions.length > 0 ? this.selectedOptions[0].text : '';
  }

  render() {
    switch (this.type) {
      case 'textarea': return this._renderTextarea();
      case 'number': return this._renderNumber();
      case 'phone': return this._renderPhone();
      case 'date': return this.range ? this._renderDateRange() : this._renderSingle();
      case 'color': return this._renderColor();
      case 'range': return this._renderRange();
      case 'select': return this._renderSelect();
      case 'combobox': return this._renderCombobox();
      case 'radio': return this._renderRadio();
      case 'checkbox-group': return this._renderCheckboxGroup();
      case 'toggle': return this._renderToggle();
      case 'checkbox': return this._renderCheckbox();
      case 'password': return this._renderPassword();
      default: return this._renderText();
    }
  }

  _renderLabel() {
    if (!this.label) return '';
    return html`<label class="i-label" for="${this.ids.input}">${this.label || ''}${this.required ? html`<span class="i-required">Required</span>` : ''}</label>`;
  }

  _renderPrefix() {
    if (!this.prefix) return '';
    return html`<span class="i-prefix">${this.prefix}</span>`;
  }

  _renderDescription() {
    if (!this.description) return '';
    return html`<p class="i-description" id="${this.ids.desc}">${this.description || ''}</p>`;
  }

  _renderError() {
    if (!this.error) return '';
    let errors;
    try {
      errors = JSON.parse(this.error);
      if (!Array.isArray(errors)) errors = [{ message: this.error }];
    } catch {
      errors = [{ message: this.error }];
    }
    if (errors.length === 0) return '';
    if (errors.length < 2) {
      return html`<p class="i-error ${errors[0].message ? 'i-error-visible' : ''}" id="${this.ids.error}" role="alert">${errors[0].message || ''}</p>`;
    } else {
      return html`<div class="i-error i-error-visible" id="${this.ids.error}" role="alert"><ul>${errors.map(err => html`<li>${err.message || ''}</li>`)}</ul></div>`;
    }
  }

  _renderAction() {
    if (!this.actionButton) return '';
    if (this.actionButton === 'copy') {
      return html`<button class="i-action i-action-copy" type="button" @click="${this._onActionCopy}" title="Copy to clipboard" aria-label="Copy to clipboard"><span class="i-icon i-action-icon-copy"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-copy"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M7 7m0 2.667a2.667 2.667 0 0 1 2.667 -2.667h8.666a2.667 2.667 0 0 1 2.667 2.667v8.666a2.667 2.667 0 0 1 -2.667 2.667h-8.666a2.667 2.667 0 0 1 -2.667 -2.667z"/><path d="M4.012 16.737a2.005 2.005 0 0 1 -1.012 -1.737v-10c0 -1.1 .9 -2 2 -2h10c.75 0 1.158 .385 1.5 1"/></svg></span><span class="i-icon i-action-icon-check"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-check"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l5 5l10 -10"/></svg></span></button>`;
    }
    if (this.actionButton === 'show') {
      const icon = this._getInputType() === 'password' ? html`<span class="i-icon i-action-icon-eye"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-eye"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0"/><path d="M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6"/></svg></span>` : html`<span class="i-icon i-action-icon-eye-closed"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-eye-closed"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M21 9c-2.4 2.667 -5.4 4 -9 4c-3.6 0 -6.6 -1.333 -9 -4"/><path d="M3 15l2.5 -3.8"/><path d="M21 14.976l-2.492 -3.776"/><path d="M9 17l.5 -4"/><path d="M15 17l-.5 -4"/></svg></span>`;
      return html`<button class="i-action i-action-hide" type="button" @click="${this._onActionShow}" title="Toggle password visibility" aria-label="Toggle password visibility">${icon}</button>`;
    }
    if (this.actionButton === 'clear') {
      if (this.value === '') return '';
      return html`<button class="i-action i-action-clear" type="button" @click="${this._onActionClear}" title="Clear input" aria-label="Clear input"><span class="i-icon i-action-icon-clear"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-x"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M18 6l-12 12"/><path d="M6 6l12 12"/></svg></span></button>`;
    }
    if (this.actionButton === 'color') {
      return html`<button class="i-action i-action-color" type="button" title="Select color" aria-label="Select color"><span class="i-color-preview" style="background-color: ${this.value || this.defaultColor}"></span></button>`;
    }
    if (this.actionButton === 'date-picker') {
      return html`<button class="i-action i-action-date-picker" type="button" @click="${this._onActionToggleDatePicker}" title="Toggle date picker" aria-label="Toggle date picker">${this.isDatePickerVisible ? html`<span class="i-icon i-action-icon-calendar-x"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-calendar-x"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M13 21h-7a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v6.5"/><path d="M16 3v4"/><path d="M8 3v4"/><path d="M4 11h16"/><path d="M22 22l-5 -5"/><path d="M17 22l5 -5"/></svg></span>` : html`<span class="i-icon i-action-icon-calendar"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-calendar"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12z"/><path d="M16 3v4"/><path d="M8 3v4"/><path d="M4 11h16"/><path d="M11 15h1"/><path d="M12 15v3"/></svg></span>`}</button>`;
    }
    return '';
  }

  _renderText() {
    const ariaDescribedby = [this.description ? this.ids.desc : null, this.error ? this.ids.error : null].filter(Boolean).join(' ');
    const inputClasses = this.error ? 'i-input i-input-error' : 'i-input';
    const wrapperClasses = this.error ? 'i-wrapper i-wrapper-error' : 'i-wrapper';
    return html`
      <div class="i-field">
        ${this._renderLabel()}
        <div class="${wrapperClasses}">
          ${this._renderPrefix()}
          <input class="${inputClasses}" id="${this.ids.input}" name="${this.name || ''}" type="${this._getInputType()}" .value="${this.value ?? ''}" placeholder="${this.placeholder ?? ''}" aria-required="${this.required ? 'true' : 'false'}" ?disabled="${this.disabled}" ?readonly="${this.readonly}" aria-invalid="${this.valid ? undefined : 'true'}" aria-describedby="${ariaDescribedby}" @input="${this._onInput}" @change="${this._onChange}" @blur="${this._onBlur}" autocomplete="${this.autocomplete ?? 'off'}" ${this.autofocus ? 'autofocus' : ''} />
          ${this._renderAction()}
        </div>
        ${this._renderDescription()}
        ${this._renderError()}
      </div>`;
  }

  _renderPassword() {
    const ariaDescribedby = [this.description ? this.ids.desc : null, this.error ? this.ids.error : null].filter(Boolean).join(' ');
    const inputClasses = this.error ? 'i-input i-input-error' : 'i-input';
    const wrapperClasses = this.error ? 'i-wrapper i-wrapper-error' : 'i-wrapper';
    return html`
      <div class="i-field">
        ${this._renderLabel()}
        <div class="${wrapperClasses}">
          ${this._renderPrefix()}
          <input class="${inputClasses}" id="${this.ids.input}" name="${this.name || ''}" type="${this._getInputType()}" .value="${this.value ?? ''}" placeholder="${this.placeholder ?? ''}" aria-required="${this.required ? 'true' : 'false'}" ?disabled="${this.disabled}" ?readonly="${this.readonly}" aria-invalid="${this.valid ? undefined : 'true'}" aria-describedby="${ariaDescribedby}" @input="${this._onInputPassword}" @change="${this._onChange}" @blur="${this._onBlur}" autocomplete="${this.autocomplete ?? 'off'}" ${this.autofocus ? 'autofocus' : ''} />
          ${this._renderAction()}
        </div>
        ${this._renderStrengthMeter()}
        ${this._renderDescription()}
        ${this._renderError()}
      </div>`;
  }

  _renderStrengthMeter() {
    if (this.type !== 'password') return '';
    if (this.strengthMeter === false) return '';
    const levels = ['weak', 'medium', 'strong'];
    const currentIndex = levels.indexOf(this.strength);
    return html`
      <div class="i-strength-meter ${this.strength}">
        <div class="i-strength-bar">
          ${levels.map((level, index) => html`<div class="i-strength-level ${index <= currentIndex ? 'active' : ''}"></div>`)}
        </div>
        <span class="i-strength-label">${this.strength}</span>
      </div>`;
  }

  _renderTextarea() {
    const ariaDescribedby = [this.description ? this.ids.desc : null, this.error ? this.ids.error : null].filter(Boolean).join(' ');
    const textareaClasses = this.error ? 'i-textarea i-textarea-error' : 'i-textarea';
    const wrapperClasses = this.error ? 'i-wrapper i-wrapper-error' : 'i-wrapper';
    return html`
      <div class="i-field">
        ${this._renderLabel()}
        <div class="${wrapperClasses}">
          ${this._renderPrefix()}
          <textarea class="${textareaClasses}" id="${this.ids.input}" name="${this.name || ''}" .value="${this.value ?? ''}" placeholder="${this.placeholder ?? ''}" ?disabled="${this.disabled}" ?readonly="${this.readonly}" rows="${this.rows}" cols="${this.cols}" maxlength="${this.max || ''}" aria-required="${this.required ? 'true' : 'false'}" aria-invalid="${this.valid ? undefined : 'true'}" aria-describedby="${ariaDescribedby}" @input="${this._onInput}" @change="${this._onChange}" @blur="${this._onBlur}" autocomplete="${this.autocomplete ?? 'off'}" ${this.autofocus ? 'autofocus' : ''}></textarea>
          ${this._renderAction()}
        </div>
        ${this.max ? html`<div class="i-char-count">${this.value?.length || 0}/${this.max} characters</div>` : ''}
        ${this._renderDescription()}
        ${this._renderError()}
      </div>`;
  }

  _renderNumber() {
    const ariaDescribedby = [this.description ? this.ids.desc : null, this.error ? this.ids.error : null].filter(Boolean).join(' ');
    const inputClasses = this.error ? 'i-input i-input-error' : 'i-input';
    return html`
      <div class="i-field">
        ${this._renderLabel()}
        <div class="i-wrapper">
          ${this._renderPrefix()}
          <input class="${inputClasses}" id="${this.ids.input}" name="${this.name || ''}" type="${this._getInputType()}" .value="${this.value ?? ''}" placeholder="${this.placeholder ?? ''}" ?disabled="${this.disabled}" ?readonly="${this.readonly}" aria-required="${this.required ? 'true' : 'false'}" aria-invalid="${this.valid ? undefined : 'true'}" aria-describedby="${ariaDescribedby}" @input="${this._onInput}" @change="${this._onChange}" @blur="${this._onBlur}" ${this.autocomplete ? `autocomplete="${this.autocomplete}"` : ''} ${this.autofocus ? 'autofocus' : ''} />
          <div class="i-number-actions">
            <button class="i-action i-action-decrease" type="button" @click="${this._onDecrease}" title="Decrease" aria-label="Decrease value" ?disabled="${this.disabled}"><svg xmlns="http://www.w3.org/2000/svg" width="1rem" height="1rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-minus"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l14 0"/></svg></button>
            <button class="i-action i-action-increase" type="button" @click="${this._onIncrease}" title="Increase" aria-label="Increase value" ?disabled="${this.disabled}"><svg xmlns="http://www.w3.org/2000/svg" width="1rem" height="1rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-plus"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5l0 14"/><path d="M5 12l14 0"/></svg></button>
          </div>
        </div>
        ${this._renderDescription()}
        ${this._renderError()}
      </div>`;
  }

  _renderPhone() {
    const describedBy = [this.description ? this.ids.desc : null, this.error ? this.ids.error : null].filter(Boolean).join(' ') || null;
    const inputCls = ['i-input'];
    if (!this.valid) inputCls.push('i-input-error');
    return html`
      <div class="i-field ${this.inline ? 'i-inline' : ''}">
        ${this._renderLabel()}
        <div class="i-wrapper i-phone-wrapper">
          <select name="${this.name}-code" id="${this.ids.country}" class="i-select i-select-country" @change="${this._onCountryChange}" aria-label="Select country and calling code" ?disabled="${this.disabled}" ?readonly="${this.readonly}">
            ${this.countries.map(c => html`<option value="${c.code}" title="${c.name}" ?selected="${c.code === this.country}">${c.name.length > 10 ? c.name.substring(0, 10) + '...' : c.name} (${c.dial})</option>`)}
          </select>
          <input id="${this.ids.input}" class="${inputCls.join(' ')}" type="tel" placeholder="${this.placeholder ?? ''}" ?disabled="${this.disabled}" ?readonly="${this.readonly}" aria-required="${this.required ? 'true' : 'false'}" aria-invalid="${this.valid ? undefined : 'true'}" aria-describedby="${describedBy}" data-maska="${this.mask}" @input="${this._onPhoneInput}" @change="${this._onPhoneChange}" @blur="${this._onBlur}" />
        </div>
        ${this._renderDescription()}
        ${this._renderError()}
      </div>`;
  }

  _renderSingle() {
    const ariaDescribedby = [this.description ? this.ids.desc : null, this.error ? this.ids.error : null].filter(Boolean).join(' ');
    const inputClasses = this.error ? 'i-input i-input-error' : 'i-input';
    const wrapperClasses = this.error ? 'i-wrapper i-wrapper-error' : 'i-wrapper';
    return html`
      <div class="i-field">
        ${this._renderLabel()}
        <div class="${wrapperClasses}">
          ${this._renderPrefix()}
          <input class="${inputClasses}" id="${this.ids.input}" name="${this.name || ''}" type="${this._getInputType()}" .value="${this.value ?? ''}" placeholder="${this.placeholder ?? ''}" ?disabled="${this.disabled}" ?readonly="${this.readonly}" aria-required="${this.required ? 'true' : 'false'}" aria-invalid="${this.valid ? undefined : 'true'}" aria-describedby="${ariaDescribedby}" @input="${this._onInput}" @change="${this._onChange}" @blur="${this._onBlur}" autocomplete="${this.autocomplete ?? 'off'}" ${this.autofocus ? 'autofocus' : ''} />
          ${this._renderAction()}
        </div>
        ${this.isDatePickerVisible ? html`<wc-datepicker show-clear-button value="${this.value}" @selectDate="${this._onDateChange}"></wc-datepicker>` : ''}
        ${this._renderDescription()}
        ${this._renderError()}
      </div>`;
  }

  _renderDateRange() {
    const startAriaDescribedby = [this.description ? this.ids.desc : null, this.error ? this.ids.error : null].filter(Boolean).join(' ');
    const endAriaDescribedby = startAriaDescribedby;
    const startInputClasses = this.error ? 'i-input i-input-error' : 'i-input';
    const endInputClasses = this.error ? 'i-input i-input-error' : 'i-input';
    const wrapperClasses = this.error ? 'i-wrapper i-wrapper-error' : 'i-wrapper';
    return html`
      <div class="i-field">
        <div class="i-label-group">
          ${this._renderLabel()}
          <div class="i-label-secondary">
            (<label for="${this.ids.input}-start">${this.rangeStartLabel || 'Start Date'}</label>
            <span class="i-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-arrow-right"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l14 0"/><path d="M13 18l6 -6"/><path d="M13 6l6 6"/></svg></span>
            <label for="${this.ids.input}-end">${this.rangeEndLabel || 'End Date'}</label>)
          </div>
        </div>
        <div class="${wrapperClasses}">
          <input class="${startInputClasses}" id="${this.ids.input}-start" name="start_date" type="date" .value="${this.startValue ?? ''}" ?disabled="${this.disabled}" ?readonly="${this.readonly}" aria-required="${this.required ? 'true' : 'false'}" aria-invalid="${this.valid ? undefined : 'true'}" aria-describedby="${startAriaDescribedby}" @input="${this._onStartInput}" @change="${this._onStartChange}" @blur="${this._onStartBlur}" autocomplete="${this.autocomplete ?? 'off'}" />
          <span class="i-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-arrow-right"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l14 0"/><path d="M13 18l6 -6"/><path d="M13 6l6 6"/></svg></span>
          <input class="${endInputClasses}" id="${this.ids.input}-end" name="end_date" type="date" .value="${this.endValue ?? ''}" ?disabled="${this.disabled}" ?readonly="${this.readonly}" aria-required="${this.required ? 'true' : 'false'}" aria-invalid="${this.valid ? undefined : 'true'}" aria-describedby="${endAriaDescribedby}" @input="${this._onEndInput}" @change="${this._onEndChange}" @blur="${this._onEndBlur}" autocomplete="${this.autocomplete ?? 'off'}" />
          ${this._renderAction()}
        </div>
        ${this.isDatePickerVisible ? html`<wc-datepicker range show-clear-button start-date="${this.startValue}" end-date="${this.endValue}" @selectDate="${this._onDateRangeChange}"></wc-datepicker>` : ''}
        ${this._renderDescription()}
        ${this._renderError()}
      </div>`;
  }

  _renderColor() {
    const ariaDescribedby = [this.description ? this.ids.desc : null, this.error ? this.ids.error : null].filter(Boolean).join(' ');
    const inputClasses = this.error ? 'i-input i-input-error' : 'i-input';
    const wrapperClasses = this.error ? 'i-wrapper i-wrapper-error' : 'i-wrapper';
    return html`
      <div class="i-field">
        ${this._renderLabel()}
        <div class="${wrapperClasses}">
          <input class="${inputClasses}" id="${this.ids.input}" name="${this.name || ''}" type="text" .value="${this.value ?? ''}" placeholder="${this.placeholder ?? '#ffffff'}" ?disabled="${this.disabled}" ?readonly="${this.readonly}" aria-required="${this.required ? 'true' : 'false'}" aria-invalid="${this.valid ? undefined : 'true'}" aria-describedby="${ariaDescribedby}" @input="${this._onColorInput}" @change="${this._onChange}" @blur="${this._onBlur}" autocomplete="${this.autocomplete ?? 'off'}" ${this.autofocus ? 'autofocus' : ''} />
          ${this._renderAction()}
        </div>
        <div class="i-picker"></div>
        ${this._renderDescription()}
        ${this._renderError()}
      </div>`;
  }

  _renderRange() {
    return html`
      <div class="i-field">
        <label class="i-label" for="${this.ids.input}">${this.label || ''} <span class="i-value-display">${this._getDisplayValue()}</span></label>
        <div class="i-wrapper-range">${this._renderSlider()}</div>
        <div class="i-range-limits"><span>${this._formatValue(this.min)}</span><span>${this._formatValue(this.max)}</span></div>
        ${this._renderDescription()}
        ${this._renderError()}
      </div>`;
  }

  _renderSlider() {
    return html`
      <range-slider value="${this.range ? `${this.valueMin},${this.valueMax}` : this.value}" min="${this.min}" max="${this.max}" step="${this.step}" name="${this.name}" aria-label="${this.label || 'Choose a value'}" ?disabled="${this.disabled}" @input="${this._onRangeInput}" @change="${this._onRangeChange}">
        <div data-track></div>
        <div data-track-fill></div>
        <div data-runnable-track>
          <div data-thumb aria-label="${this.range ? `Minimum ${this.label || 'value'}` : this.label || 'Choose a value'}"></div>
          ${this.range ? html`<div data-thumb aria-label="Maximum ${this.label || 'value'}"></div>` : ''}
        </div>
      </range-slider>`;
  }

  _renderSelect() {
    const ariaDescribedby = [this.description ? this.ids.desc : null, this.error ? this.ids.error : null].filter(Boolean).join(' ');
    const wrapperClasses = this.error ? 'i-wrapper i-wrapper-error' : 'i-wrapper';
    const activeId = this.isOpen && this.highlightedIndex >= 0 ? `${this.ids.listbox}-opt-${this.highlightedIndex}` : '';
    return html`
      <div class="i-field">
        ${this._renderLabel()}
        <div class="${wrapperClasses}" @click="${this._toggleDropdown}">
          <input class="i-input" id="${this.ids.input}" .value="${this._getDisplayValueForSelect()}" placeholder="${this.placeholder ?? ''}" ?disabled="${this.disabled}" @keydown="${this._onSelectKeydown}" @focus="${this._onFocus}" @click="${(e) => e.stopPropagation()}" aria-expanded="${this.isOpen}" aria-haspopup="listbox" aria-controls="${this.ids.listbox}" aria-activedescendant="${activeId}" aria-describedby="${ariaDescribedby}" readonly />
          <button class="i-action i-action-dropdown" type="button" @click="${this._toggleDropdown}" aria-label="Toggle dropdown"><span class="i-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></span></button>
        </div>
        ${this.isOpen ? this._renderDropdown() : ''}
        ${this._renderDescription()}
        ${this._renderError()}
      </div>`;
  }

  _renderCombobox() {
    const ariaDescribedby = [this.description ? this.ids.desc : null, this.error ? this.ids.error : null].filter(Boolean).join(' ');
    const wrapperClasses = this.error ? 'i-wrapper i-wrapper-error' : 'i-wrapper';
    const activeId = this.isOpen && this.highlightedIndex >= 0 ? `${this.ids.listbox}-opt-${this.highlightedIndex}` : '';
    return html`
      <div class="i-field">
        ${this._renderLabel()}
        ${this._renderChips()}
        <div class="${wrapperClasses}" @click="${this._toggleDropdown}">
          <input class="i-input" id="${this.ids.input}" .value="${this.isOpen ? this.searchQuery : this._getDisplayValueForSelect()}" placeholder="${this.isOpen ? 'Search...' : (this.placeholder ?? '')}" ?disabled="${this.disabled}" @input="${this._onComboboxInput}" @keydown="${this._onComboboxKeydown}" @focus="${this._onFocus}" @click="${(e) => e.stopPropagation()}" aria-expanded="${this.isOpen}" aria-haspopup="listbox" aria-controls="${this.ids.listbox}" aria-activedescendant="${activeId}" aria-describedby="${ariaDescribedby}" />
          <button class="i-action i-action-dropdown" type="button" @click="${this._toggleDropdown}" aria-label="Toggle dropdown"><span class="i-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></span></button>
        </div>
        ${this.isOpen ? this._renderComboboxDropdown() : ''}
        ${this._renderDescription()}
        ${this._renderError()}
      </div>`;
  }

  _renderChips() {
    if (!this.multiple || this.selectedOptions.length === 0) return '';
    return html`<div class="i-chips">${this.selectedOptions.map(opt => html`<div class="i-chip"><span class="i-chip-text">${opt.text}</span><button class="i-chip-remove" type="button" @click="${(e) => this._removeChip(opt, e)}" aria-label="Remove ${opt.text}"><span class="i-chip-remove-icon">×</span></button></div>`)}</div>`;
  }

  _removeChip(opt, e) {
    e.stopPropagation();
    if (this.multiple && Array.isArray(this.value)) {
      const currentValue = [...this.value];
      const index = currentValue.indexOf(opt.value);
      if (index > -1) { currentValue.splice(index, 1); this.value = currentValue; this._updateValue(this.value); this._updateSelectedOptions(); }
    }
  }

  _renderDropdown() {
    return html`
      <div class="i-dropdown" role="listbox" id="${this.ids.listbox}" aria-multiselectable="${this.multiple ? 'true' : 'false'}">
        <div class="i-options" style="max-height: 200px; overflow-y: auto;">
          ${this.options.map((opt, index) => html`
            <div class="i-option ${opt.selected ? 'i-option-selected' : ''} ${index === this.highlightedIndex ? 'i-option-highlighted' : ''}" id="${this.ids.listbox}-opt-${index}" @click="${() => this._selectOption(opt)}" role="option" aria-selected="${opt.selected}">${opt.text}</div>
          `)}
        </div>
      </div>`;
  }

  _renderComboboxDropdown() {
    const visibleOptions = this.filteredOptions.slice(this.virtualStart, this.virtualEnd);
    return html`
      <div class="i-dropdown" role="listbox" id="${this.ids.listbox}" aria-multiselectable="${this.multiple ? 'true' : 'false'}">
        <div class="i-options" @scroll="${this._onScroll}" style="max-height: 200px; overflow-y: auto;">
          ${visibleOptions.map((opt, index) => {
            const globalIndex = this.virtualStart + index;
            return html`
              <div class="i-option ${opt.selected ? 'i-option-selected' : ''} ${globalIndex === this.highlightedIndex ? 'i-option-highlighted' : ''}" id="${this.ids.listbox}-opt-${globalIndex}" @click="${() => this._selectOption(opt)}" role="option" aria-selected="${opt.selected}">
                <div class="i-option-label">${opt.text}</div>
                ${opt.description ? html`<div class="i-option-description">${opt.description}</div>` : ''}
              </div>`;
          })}
        </div>
      </div>`;
  }

  _renderRadio() {
    const ariaDescribedby = [this.description ? this.ids.desc : null, this.error ? this.ids.error : null].filter(Boolean).join(' ');
    return html`
      <div class="i-field">
        <fieldset class="i-radio-group" role="radiogroup" aria-labelledby="${this.ids.label}" aria-describedby="${ariaDescribedby}">
          <legend class="i-label" id="${this.ids.label}">${this.label || ''}</legend>
          <div class="i-radio-options">${this.options.map(option => this._renderRadioOption(option))}</div>
        </fieldset>
        ${this._renderDescription()}
        ${this._renderError()}
      </div>`;
  }

  _renderRadioOption(option) {
    const isChecked = this.value === option.value;
    const describedBy = [this.description ? this.ids.desc : null, this.error ? this.ids.error : null].filter(Boolean).join(' ') || null;
    return html`
      <label class="i-radio-option ${option.disabled ? 'i-radio-option-disabled' : ''}">
        <input type="radio" name="${this.name || this.ids.input}" .value="${option.value}" ?checked="${isChecked}" ?disabled="${option.disabled || this.disabled}" ?readonly="${this.readonly}" aria-required="${this.required ? 'true' : 'false'}" aria-describedby="${describedBy}" @change="${(e) => this._onRadioChange(e, option)}" />
        <div>
          <span class="i-radio-label">${option.label} ${option.badge ? html`<span class="i-radio-badge">${option.badge}</span>` : ''}</span>
          ${option.description ? html`<span class="i-radio-description">${option.description}</span>` : ''}
        </div>
      </label>`;
  }

  _renderCheckboxGroup() {
    const ariaDescribedby = [this.description ? this.ids.desc : null, this.error ? this.ids.error : null].filter(Boolean).join(' ');
    return html`
      <div class="i-field">
        <fieldset class="i-checkbox-group" role="group" aria-labelledby="${this.ids.label}" aria-describedby="${ariaDescribedby}">
          <legend class="i-label" id="${this.ids.label}">${this.label || ''}</legend>
          <div class="i-checkbox-options">${this.options.map(option => this._renderCheckboxGroupOption(option))}</div>
        </fieldset>
        ${this._renderDescription()}
        ${this._renderError()}
      </div>`;
  }

  _renderCheckboxGroupOption(option) {
    const isChecked = Array.isArray(this.value) && this.value.includes(option.value);
    const describedBy = [this.description ? this.ids.desc : null, this.error ? this.ids.error : null].filter(Boolean).join(' ') || null;
    return html`
      <label class="i-checkbox-option ${option.disabled ? 'i-checkbox-option-disabled' : ''}">
        <input type="checkbox" name="${this.name || this.ids.input}" .value="${option.value}" ?checked="${isChecked}" ?disabled="${option.disabled || this.disabled}" ?readonly="${this.readonly}" aria-required="${this.required ? 'true' : 'false'}" aria-describedby="${describedBy}" @change="${(e) => this._onCheckboxGroupChange(e, option)}" />
        <div>
          <span class="i-checkbox-label">${option.label} ${option.badge ? html`<span class="i-checkbox-badge">${option.badge}</span>` : ''}</span>
          ${option.description ? html`<span class="i-checkbox-description">${option.description}</span>` : ''}
        </div>
      </label>`;
  }

  _renderToggle() {
    const ariaDescribedby = [this.description ? this.ids.desc : null, this.error ? this.ids.error : null].filter(Boolean).join(' ');
    const toggleClasses = `i-toggle i-toggle-${this.size} ${this.checked ? 'i-toggle-checked' : ''}`;
    return html`
      <div class="i-field i-toggle-field">
        <div class="i-field-left">
          ${this._renderLabel()}
          ${this._renderDescription()}
        </div>
        <div class="i-field-right">
          <label class="${toggleClasses}" for="${this.ids.input}">
            <input id="${this.ids.input}" class="i-toggle-input" type="checkbox" .checked="${this.checked}" ?disabled="${this.disabled}" ?readonly="${this.readonly}" aria-required="${this.required ? 'true' : 'false'}" aria-invalid="${this.valid ? undefined : 'true'}" aria-describedby="${ariaDescribedby}" @change="${this._onToggleChange}" ${this.autofocus ? 'autofocus' : ''} />
            <div class="i-toggle-track"><div class="i-toggle-thumb"></div></div>
          </label>
        </div>
        ${this._renderError()}
      </div>`;
  }

  _renderCheckbox() {
    const ariaDescribedby = [this.description ? this.ids.desc : null, this.error ? this.ids.error : null].filter(Boolean).join(' ');
    return html`
      <div class="i-field">
        <label class="i-label" for="${this.ids.input}">${this.label || ''}</label>
        <div class="i-wrapper">
          <input id="${this.ids.input}" class="i-input" type="checkbox" .checked="${this.checked}" ?disabled="${this.disabled}" ?readonly="${this.readonly}" aria-required="${this.required ? 'true' : 'false'}" aria-invalid="${this.valid ? undefined : 'true'}" aria-describedby="${ariaDescribedby}" @change="${this._onToggleChange}" ${this.autofocus ? 'autofocus' : ''} />
        </div>
        ${this._renderDescription()}
        ${this._renderError()}
      </div>`;
  }

  _onInput(e) { this._updateValue(e.target.value); this._callHook('onInput', e); }
  _onChange(e) { this._handleChange(); this._callHook('onChange', e); }
  _onBlur(e) { this._handleBlur(); this._callHook('onBlur', e); }

  _onInputPassword(e) {
    this._onInput(e);
    this.strength = this._calculateStrength(this.value);
  }

  _onActionCopy(e) {
    e.stopPropagation();
    navigator.clipboard.writeText(this.value).catch(() => { this._dispatch('e:error', { error: 'Copy failed' }); });
    e.target.classList.add('i-action-copied');
    setTimeout(() => e.target.classList.remove('i-action-copied'), 1000);
  }

  _onActionShow(e) {
    e.stopPropagation();
    this.isPasswordVisible = !this.isPasswordVisible;
    this.requestUpdate();
  }

  _onActionClear(e) {
    e.stopPropagation();
    this.value = '';
    this.focus();
    this._dispatch('e:input', { value: this.value });
    this._dispatch('e:change', { value: this.value });
  }

  _onDecrease(e) {
    e.stopPropagation();
    const currentValue = parseFloat(this.value) || 0;
    const step = this.step || 1;
    this.value = (currentValue - step).toString();
    this._updateValue(this.value);
  }

  _onIncrease(e) {
    e.stopPropagation();
    const currentValue = parseFloat(this.value) || 0;
    const step = this.step || 1;
    this.value = (currentValue + step).toString();
    this._updateValue(this.value);
  }

  _onCountryChange(e) {
    this.country = e.target.value;
    const c = this.countries.find(cc => cc.code === this.country);
    if (!c) return;
    this.dialCode = c.dial;
    this.mask = c.mask;
    const phoneInput = this.renderRoot?.querySelector('.i-input');
    if (!phoneInput) return;
    const unmaskedValue = this._maskInstance?.unmaskedValue || '';
    if (this._maskInstance) this._maskInstance.destroy();
    this._maskInstance = new MaskInput(phoneInput, { mask: this.mask });
    phoneInput.value = unmaskedValue;
    this.localDigits = unmaskedValue;
    this._updatePhoneFormattedValue();
    this._updateValue();
  }

  _onPhoneInput(e) {
    this.localDigits = this._maskInstance?.unmaskedValue || e.target.value;
    this._updatePhoneFormattedValue();
    this._updateValue(this.formattedValue);
    this._callHook('onInput', e);
  }

  _onPhoneChange(e) {
    this.localDigits = this._maskInstance?.unmaskedValue || e.target.value;
    this._updatePhoneFormattedValue();
    this._handleChange();
    this._callHook('onChange', e);
  }

  _updatePhoneFormattedValue() {
    this.formattedValue = this._maskInstance?.maskedValue ?? this._applyMask(this.localDigits, this.mask);
  }

  _updateValue(newValue) {
    if (this.type === 'phone') {
      if (newValue !== undefined) this.formattedValue = newValue;
      this.value = this.dialCode + (this.formattedValue || '');
      this.internals.setFormValue(this.value);
      this.dispatchInput();
      if (this.shouldValidate('input')) this.debounceValidate();
    } else {
      super._updateValue(newValue);
    }
  }

  _applyMask(digits, mask) {
    let out = '', i = 0;
    for (const ch of mask) {
      if ((ch === '#' || ch === '0') && i < digits.length) out += digits[i++];
      else out += ch;
    }
    return out;
  }

  _onActionToggleDatePicker(e) { e.stopPropagation(); this.isDatePickerVisible = !this.isDatePickerVisible; this.requestUpdate(); }
  _onDateChange(e) { this._updateValue(e.detail); }
  _onDateRangeChange(e) { this.startValue = e.detail[0]; this.endValue = e.detail[1]; this._updateValue(JSON.stringify({ start: this.startValue, end: this.endValue })); this.validate(); }
  _onStartInput(e) { this.startValue = e.target.value; this._updateValue(JSON.stringify({ start: this.startValue, end: this.endValue })); this._callHook('onInput', e); }
  _onStartChange(e) { this._handleChange(); this._callHook('onChange', e); }
  _onStartBlur(e) { this._handleBlur(); this._callHook('onBlur', e); }
  _onEndInput(e) { this.endValue = e.target.value; this._updateValue(JSON.stringify({ start: this.startValue, end: this.endValue })); this._callHook('onInput', e); }
  _onEndChange(e) { this._handleChange(); this._callHook('onChange', e); }
  _onEndBlur(e) { this._handleBlur(); this._callHook('onBlur', e); }

  _onColorInput(e) {
    const inputValue = e.target.value;
    if (inputValue && !this._isValidColor(inputValue)) { e.target.value = this.value || this.defaultColor; return; }
    this._onInput(e);
    if (this._pickr) { try { this._pickr.setColor(inputValue || this.defaultColor); } catch {} }
  }

  _onRangeInput(e) {
    if (this.range) { const values = e.target.value.split(',').map(Number); this.valueMin = values[0]; this.valueMax = values[1]; this.value = JSON.stringify({ min: this.valueMin, max: this.valueMax }); }
    else { this.value = e.target.value; }
    this.internals.setFormValue(this.value);
    this.dispatchInput();
    this._callHook('onInput', e);
    if (this.shouldValidate('input')) this.debounceValidate();
  }

  _onRangeChange(e) { this._handleChange(); this._callHook('onChange', e); }

  _toggleDropdown(e) {
    e?.stopPropagation();
    if (!this.disabled) {
      this.isOpen = !this.isOpen;
      if (this.isOpen) {
        if (this.type === 'combobox') { this.searchQuery = ''; this.filteredOptions = [...this.options]; this.virtualStart = 0; this.virtualEnd = 50; }
        const firstSelectedIndex = this.options.findIndex(opt => opt.selected);
        this.highlightedIndex = firstSelectedIndex >= 0 ? firstSelectedIndex : (this.options.length > 0 ? 0 : -1);
        this.requestUpdate();
        setTimeout(() => this._scrollToHighlighted(), 0);
      } else { this.highlightedIndex = -1; }
    }
  }

  _onFocus() {
    if (!this.isOpen && !this.disabled && this._isSelectLike()) this._toggleDropdown();
  }

  _onSelectKeydown(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); if (!this.isOpen) this._toggleDropdown(); else { this.highlightedIndex = Math.min(this.highlightedIndex + 1, this.options.length - 1); this.requestUpdate(); setTimeout(() => this._scrollToHighlighted(), 0); } }
    else if (e.key === 'ArrowUp') { e.preventDefault(); this.highlightedIndex = Math.max(this.highlightedIndex - 1, 0); this.requestUpdate(); setTimeout(() => this._scrollToHighlighted(), 0); }
    else if (e.key === 'Enter') { e.preventDefault(); if (this.highlightedIndex >= 0 && this.highlightedIndex < this.options.length) this._selectOption(this.options[this.highlightedIndex]); }
    else if (e.key === 'Escape') { this.isOpen = false; this.highlightedIndex = -1; }
  }

  _onComboboxInput(e) {
    this.searchQuery = e.target.value;
    if (this._comboboxInputTimer) cancelAnimationFrame(this._comboboxInputTimer);
    this._comboboxInputTimer = requestAnimationFrame(() => {
      if (this.searchQuery.trim()) {
        let haystack = this.options.map(o => o.text);
        let [idxs] = this.uf.search(haystack, this.searchQuery);
        this.filteredOptions = idxs ? idxs.map(i => this.options[i]) : [];
      } else { this.filteredOptions = [...this.options]; }
      this.virtualStart = 0;
      this.virtualEnd = Math.min(60, this.filteredOptions.length);
      this.highlightedIndex = this.filteredOptions.length > 0 ? 0 : -1;
      if (!this.isOpen) this.isOpen = true;
      this.requestUpdate();
      setTimeout(() => this._scrollToHighlighted(), 0);
    });
  }

  _onComboboxKeydown(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); if (!this.isOpen) this._toggleDropdown(); else { this.highlightedIndex = Math.min(this.highlightedIndex + 1, this.filteredOptions.length - 1); this.requestUpdate(); setTimeout(() => this._scrollToHighlighted(), 0); } }
    else if (e.key === 'ArrowUp') { e.preventDefault(); this.highlightedIndex = Math.max(this.highlightedIndex - 1, 0); this.requestUpdate(); setTimeout(() => this._scrollToHighlighted(), 0); }
    else if (e.key === 'Enter') { e.preventDefault(); if (this.highlightedIndex >= 0 && this.highlightedIndex < this.filteredOptions.length) this._selectOption(this.filteredOptions[this.highlightedIndex]); }
    else if (e.key === 'Escape') { this.isOpen = false; this.searchQuery = ''; this.filteredOptions = [...this.options]; this.highlightedIndex = -1; }
  }

  _onScroll(e) {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const totalItems = this.filteredOptions.length;
    const itemHeight = scrollHeight / totalItems;
    const newStart = Math.max(0, Math.floor(scrollTop / itemHeight) - 10);
    const newEnd = Math.min(totalItems, newStart + 60);
    if (newStart !== this.virtualStart || newEnd !== this.virtualEnd) {
      this.virtualStart = newStart;
      this.virtualEnd = newEnd;
      this.requestUpdate();
    }
  }

  _scrollToHighlighted() {
    const optionsEl = this.renderRoot?.querySelector('.i-options');
    const highlightedEl = optionsEl?.querySelector('.i-option-highlighted');
    if (highlightedEl) highlightedEl.scrollIntoView({ block: 'nearest' });
  }

  _selectOption(opt) {
    if (this.multiple) {
      const currentValue = Array.isArray(this.value) ? [...this.value] : [];
      const index = currentValue.indexOf(opt.value);
      if (index > -1) currentValue.splice(index, 1);
      else currentValue.push(opt.value);
      this.value = currentValue;
    } else {
      this.value = opt.value;
      this.isOpen = false;
    }
    this._updateValue(this.value);
    this._updateSelectedOptions();
  }

  _onRadioChange(e, option) {
    this.value = option.value;
    this._updateValue(this.value);
    this._handleChange();
  }

  _onCheckboxGroupChange(e, option) {
    const currentValue = Array.isArray(this.value) ? [...this.value] : [];
    const index = currentValue.indexOf(option.value);
    if (e.target.checked) { if (index === -1) currentValue.push(option.value); }
    else { if (index > -1) currentValue.splice(index, 1); }
    this.value = currentValue;
    this._updateValue(this.value);
    this._handleChange();
  }

  _onToggleChange(e) {
    this.checked = e.target.checked;
    this.value = this.checked ? 'on' : 'off';
    this._updateValue(this.value);
    this._handleChange();
    this._callHook('onChange', e);
    this.requestUpdate('checked');
  }

  _updateChecked() {
    const inputs = this.renderRoot?.querySelectorAll('input[type="radio"], input[type="checkbox"]');
    if (inputs) {
      inputs.forEach((input, index) => {
        const option = this.options[index];
        if (option) {
          if (this.type === 'radio') input.checked = this.value === option.value;
          else input.checked = Array.isArray(this.value) && this.value.includes(option.value);
        }
      });
    }
  }

  _buildTextSchema() {
    let schema = z.string();
    if (this.required) schema = schema.min(1, this.requiredMessage || (this.label ? `${this.label} is required` : 'This field is required'));
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
      }
    }
    if (this.regex) { try { const re = new RegExp(this.regex, 'u'); schema = schema.regex(re, this.regexMessage || `Enter ${this.label || 'value'} in a valid format`); } catch {} }
    return schema;
  }

  _buildNumberSchema() {
    let schema = z.coerce.number();
    if (this.required) schema = schema.refine(n => !Number.isNaN(n) && this.value !== '', this.requiredMessage || 'This field is required');
    const minVal = this.min ?? this.gte;
    const maxVal = this.max ?? this.lte;
    if (minVal !== undefined) schema = schema.gte(minVal, this.minMessage || this.gteMessage || `Minimum value is ${minVal}`);
    if (maxVal !== undefined) schema = schema.lte(maxVal, this.maxMessage || this.lteMessage || `Maximum value is ${maxVal}`);
    if (this.gt !== undefined) schema = schema.gt(this.gt, this.gtMessage || `Must be > ${this.gt}`);
    if (this.gte !== undefined) schema = schema.gte(this.gte, this.gteMessage || `Must be ≥ ${this.gte}`);
    if (this.lt !== undefined) schema = schema.lt(this.lt, this.ltMessage || `Must be < ${this.lt}`);
    if (this.lte !== undefined) schema = schema.lte(this.lte, this.lteMessage || `Must be ≤ ${this.lte}`);
    if (this.int) schema = schema.int(this.intMessage || 'Must be an integer');
    if (this.positive) schema = schema.positive(this.positiveMessage || 'Must be positive');
    if (this.nonnegative) schema = schema.nonnegative(this.nonnegativeMessage || 'Must be non-negative');
    if (this.negative) schema = schema.negative(this.negativeMessage || 'Must be negative');
    if (this.nonpositive) schema = schema.nonpositive(this.nonpositiveMessage || 'Must be non-positive');
    if (this.multipleOf !== undefined) schema = schema.multipleOf(this.multipleOf, this.multipleOfMessage || `Must be a multiple of ${this.multipleOf}`);
    if (this.step !== undefined) schema = schema.multipleOf(this.step, this.stepMessage || `Must be a multiple of ${this.step}`);
    if (this.finite) schema = schema.finite(this.finiteMessage || 'Must be finite');
    if (this.safe) schema = schema.safe(this.safeMessage || 'Must be a safe integer');
    return schema;
  }

  _buildDateSchema() {
    let schema = z.string();
    if (this.required) schema = schema.min(1, this.requiredMessage || (this.label ? `${this.label} is required` : 'This field is required'));
    if (this.range) {
      schema = schema.refine((val) => { try { const parsed = JSON.parse(val); return parsed.start && parsed.end && parsed.start <= parsed.end; } catch { return false; } }, "Select a valid date range");
    } else if (this.format === 'iso-date') {
      schema = z.iso.date(this.formatMessage || 'Invalid date');
    }
    return schema;
  }

  _buildRangeSchema() {
    let schema = z.string();
    if (this.required) schema = schema.min(1, this.requiredMessage || (this.label ? `${this.label} is required` : 'This field is required'));
    if (this.range) {
      schema = schema.refine((val) => { try { const parsed = JSON.parse(val); return parsed.min !== undefined && parsed.max !== undefined && parsed.min <= parsed.max; } catch { return false; } }, 'Select a valid range');
    } else {
      schema = z.coerce.number();
      if (this.min !== undefined) schema = schema.min(this.min, `Minimum value is ${this.min}`);
      if (this.max !== undefined) schema = schema.max(this.max, `Maximum value is ${this.max}`);
      if (this.step !== undefined) schema = schema.multipleOf(this.step, `Must be a multiple of ${this.step}`);
    }
    return schema;
  }

  async validate() {
    this._callHook('onValidate');
    this._dispatch('e:validate');
    try {
      let schema;
      const isNumberType = this.type === 'number';
      const isDateType = this.type === 'date';
      const isRangeType = this.type === 'range';
      const isPhoneType = this.type === 'phone';
      const isSelectLike = this._isSelectLike();
      const isRadioLike = this._isRadioLike();
      const isCheckboxGroupLike = this._isCheckboxGroupLike();
      const isCheckboxLike = this._isCheckboxLike();

      if (isNumberType) {
        schema = this._buildNumberSchema();
      } else if (isDateType) {
        schema = this._buildDateSchema();
      } else if (isRangeType) {
        schema = this._buildRangeSchema();
      } else if (isPhoneType) {
        schema = this._buildPhoneSchema();
      } else if (isSelectLike || isRadioLike || isCheckboxGroupLike) {
        if (this.required && (!this.value || (Array.isArray(this.value) && this.value.length === 0))) {
          const errorMsg = this.requiredMessage || `${this.label || 'Selection'} is required`;
          this.setValidState({ valid: false, error: errorMsg });
          this._callHook('onError', { error: errorMsg });
          return { valid: false, error: errorMsg };
        }
        this.setValidState({ valid: true });
        this._callHook('onSuccess', { value: this.value });
        return { valid: true, error: null };
      } else if (isCheckboxLike) {
        if (this.required && !this.checked) {
          const errorMsg = this.requiredMessage || 'This field is required';
          this.setValidState({ valid: false, error: errorMsg });
          this._callHook('onError', { error: errorMsg });
          return { valid: false, error: errorMsg };
        }
        this.setValidState({ valid: true });
        this._callHook('onSuccess', { value: this.value });
        return { valid: true, error: null };
      } else {
        schema = this._buildTextSchema();
      }

      const parseValue = this.prefixValue && !isNumberType
        ? ((this.value || '').startsWith(this.prefixValue) ? this.value : this.prefixValue + this.value)
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

  _buildPhoneSchema() {
    let schema = z.string();
    if (this.required) schema = schema.min(1, this.requiredMessage || (this.label ? `${this.label} is required` : 'This field is required'));
    if (this.minDigits) schema = schema.min(this.minDigits, 'Phone number is too short');
    return schema;
  }

  reset() {
    if (this.type === 'phone') {
      this.country = 'US';
      this.dialCode = '+1';
      this.mask = '(###) ###-####';
      this.localDigits = '';
      this.formattedValue = '';
      super.reset();
      this.updateComplete.then(() => {
        const phoneInput = this.renderRoot?.querySelector('.i-input');
        if (phoneInput) { if (this._maskInstance) this._maskInstance.destroy(); this._maskInstance = new MaskInput(phoneInput, { mask: this.mask }); }
      });
    } else if (this.type === 'date') {
      super.reset();
      this.startValue = '';
      this.endValue = '';
      this.isDatePickerVisible = false;
    } else if (this.type === 'range') {
      super.reset();
      this.valueMin = this.min;
      this.valueMax = this.max;
      this.value = this.range ? JSON.stringify({ min: this.valueMin, max: this.valueMax }) : this.valueMin.toString();
    } else if (this._isSelectLike()) {
      super.reset();
      this.selectedOptions = [];
      this.isOpen = false;
      this.highlightedIndex = -1;
      this._updateSelectedOptions();
    } else if (this._isRadioLike()) {
      super.reset();
      this.value = this.multiple ? [] : '';
    } else if (this._isCheckboxGroupLike()) {
      super.reset();
      this.value = [];
    } else if (this._isCheckboxLike()) {
      super.reset();
      this.checked = false;
      this.value = 'off';
    } else {
      super.reset();
      this.isPasswordVisible = false;
      if (this._maskInstance) {
        this._maskInstance.destroy();
        this._maskInstance = null;
        this.updateComplete.then(() => {
          if (this.mask) { const input = this.renderRoot.querySelector('input'); if (input) this._maskInstance = new MaskInput(input, this._getMaskOptions()); }
        });
      }
    }
  }

  focus() {
    if (this.type === 'date' && this.range) {
      const input = this.renderRoot?.querySelector('#' + this.ids.input + '-start');
      input?.focus();
    } else if (this.type === 'range') {
      if (this.range) this.renderRoot?.querySelector('range-slider')?.focus();
      else super.focus();
    } else if (this.type === 'phone') {
      this.renderRoot?.querySelector('.i-input')?.focus();
    } else if (this._isCheckboxLike()) {
      const input = this.renderRoot?.querySelector('.i-toggle-input');
      input?.focus();
    } else if (this._isRadioLike()) {
      const firstRadio = this.renderRoot?.querySelector('input[type="radio"]:not([disabled])');
      firstRadio?.focus();
    } else if (this._isCheckboxGroupLike()) {
      const firstCheckbox = this.renderRoot?.querySelector('input[type="checkbox"]:not([disabled])');
      firstCheckbox?.focus();
    } else if (this._isSelectLike()) {
      const input = this.renderRoot?.querySelector('.i-input');
      input?.focus();
    } else {
      super.focus();
    }
  }
}

customElements.define('e-input', EInput);
