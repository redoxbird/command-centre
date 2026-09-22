import { LitElement } from 'lit';

export default class EInputBase extends LitElement {
  static formAssociated = true;

  static properties = {
    name: { type: String },
    value: { type: String, reflect: true },
    label: { type: String },
    placeholder: { type: String },
    description: { type: String },
    required: { type: Boolean },
    disabled: { type: Boolean, reflect: true },
    readonly: { type: Boolean, reflect: true },
    shadow: { type: Boolean },
    inline: { type: Boolean },
    autofocus: { type: Boolean },
    autocomplete: { type: String },
    validateOn: { type: String, attribute: 'validate-on' },
    valid: { type: Boolean, reflect: true },
    error: { type: String, reflect: true },
  };

  constructor() {
    super();
    this.internals = this.attachInternals();
    this.value = '';
    this.valid = true;
    this.error = null;
    this.validateOn = 'blur';
    this.autocomplete = 'off';
    this._initDispatched = false;
    this._debounceTimer = null;
    this._abortController = null;
    this.ids = this._generateIds();
  }

  createRenderRoot() {
    return this.shadow ? this.attachShadow({ mode: 'open' }) : this;
  }

  connectedCallback() {
    super.connectedCallback();
    this._callHook('onInit');
    this._dispatch('e:init');
    this._initDispatched = true;
  }

  willUpdate(changed) {
    this._callHook('onBeforeRender', changed);
  }

  updated(changed) {
    super.updated(changed);
    this._callHook('onAfterRender', changed);
    this.internals.setFormValue(this.value ?? '');
  }

  _callHook(name, payload) {
    if (typeof this[name] === 'function') this[name](payload);
    this.dispatchEvent(new CustomEvent(`hook:${name}`, { detail: payload }));
  }

  _generateIds() {
    const uid = Math.random().toString(36).substr(2, 9);
    return {
      wrapper: `e-wrapper-${uid}`,
      label: `e-label-${uid}`,
      input: `e-input-${uid}`,
      desc: `e-desc-${uid}`,
      error: `e-error-${uid}`,
      listbox: `e-listbox-${uid}`,
    };
  }

  _dispatch(name, extra = {}) {
    const detail = { value: this.value, valid: this.valid, error: this.error, ...extra };
    this.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true, detail }));
  }

  dispatchInput(detail = {}) { this._dispatch('e:input', detail); }
  dispatchChange(detail = {}) { this._dispatch('e:change', detail); }

  shouldValidate(type) {
    if (!this.validateOn) return false;
    return this.validateOn.split(/[\s,|]+/).includes(type);
  }

  debounceValidate(delay = 300) {
    if (this._debounceTimer) clearTimeout(this._debounceTimer);
    this._debounceTimer = setTimeout(() => this.validate(), delay);
  }

  async validate(options = {}) {
    throw new Error('<e-input-base>: validate() must be implemented in subclass');
  }

  setValidState({ valid, error = null }) {
    this.valid = valid;
    this.error = error;
    const errorEl = this.renderRoot?.querySelector(`#${this.ids.error}`) || null;
    if (valid) {
      this.internals.setValidity({});
      this._dispatch('e:success');
      this._callHook('onSuccess', { value: this.value });
    } else {
      const message = typeof error === 'string' && error.trim() !== ''
        ? error.trim()
        : 'Invalid value';
      this.internals.setValidity({ customError: true }, message, errorEl);
      this._dispatch('e:error', { error: message });
      this._callHook('onError', { error: message });
    }
    this._dispatch('e:validate', { valid, error: this.error });
    this._callHook('onValidate', { valid: this.valid, error: this.error });
    this.requestUpdate();
  }

  clearErrors() {
    this.valid = true;
    this.error = null;
    this.internals.setValidity({});
    this.internals.setValidationMessage('');
    this.requestUpdate();
  }

  _updateValue(newValue) {
    this.value = newValue ?? '';
    this.internals.setFormValue(this.value);
    this.dispatchInput();
    if (this.shouldValidate('input')) {
      this.debounceValidate();
    }
  }

  _handleChange() {
    this.dispatchChange();
    if (this.shouldValidate('change')) this.validate();
  }

  _handleBlur() {
    if (this.shouldValidate('blur')) this.validate();
  }

  reset() {
    this.value = '';
    this.clearErrors();
    if (this._debounceTimer) clearTimeout(this._debounceTimer);
    this.internals.setFormValue('');
    this.requestUpdate();
    this._dispatch('e:change');
  }

  focus() {
    const input = this.renderRoot?.querySelector('input, textarea, select');
    input?.focus();
  }

  formResetCallback() { this.reset(); }
  formStateRestoreCallback(state) {
    this.value = state ?? '';
    this.requestUpdate();
  }
}
