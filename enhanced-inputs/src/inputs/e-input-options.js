export class ESelectOption extends HTMLElement {
  get value() { return this.getAttribute('value') || this.textContent; }
  set value(val) { this.setAttribute('value', val); }
}
customElements.define('e-select-option', ESelectOption);

export class EComboboxOption extends HTMLElement {
  get value() { return this.getAttribute('value') || this.textContent; }
  set value(val) { this.setAttribute('value', val); }
  get label() { return this.getAttribute('label') || this.textContent; }
  get description() { return this.getAttribute('description') || ''; }
}
customElements.define('e-combobox-option', EComboboxOption);

export class ERadioOption extends HTMLElement {
  get value() { return this.getAttribute('value') || this.label; }
  set value(val) { this.setAttribute('value', val); }
  get label() { return this.getAttribute('label') || this.textContent.trim(); }
  set label(val) { this.setAttribute('label', val); }
  get description() { return this.getAttribute('description'); }
  set description(val) { this.setAttribute('description', val); }
  get badge() { return this.getAttribute('badge'); }
  set badge(val) { if (val) this.setAttribute('badge', val); else this.removeAttribute('badge'); }
  get disabled() { return this.hasAttribute('disabled'); }
  set disabled(val) { if (val) this.setAttribute('disabled', ''); else this.removeAttribute('disabled'); }
  get selected() { return this.hasAttribute('selected'); }
  set selected(val) { if (val) this.setAttribute('selected', ''); else this.removeAttribute('selected'); }
}
customElements.define('e-radio-option', ERadioOption);

export class ECheckboxOption extends HTMLElement {
  get value() { return this.getAttribute('value') || this.label; }
  set value(val) { this.setAttribute('value', val); }
  get label() { return this.getAttribute('label') || this.textContent.trim(); }
  set label(val) { this.setAttribute('label', val); }
  get description() { return this.getAttribute('description'); }
  set description(val) { this.setAttribute('description', val); }
  get badge() { return this.getAttribute('badge'); }
  set badge(val) { if (val) this.setAttribute('badge', val); else this.removeAttribute('badge'); }
  get disabled() { return this.hasAttribute('disabled'); }
  set disabled(val) { if (val) this.setAttribute('disabled', ''); else this.removeAttribute('disabled'); }
  get selected() { return this.hasAttribute('selected'); }
  set selected(val) { if (val) this.setAttribute('selected', ''); else this.removeAttribute('selected'); }
}
customElements.define('e-checkbox-option', ECheckboxOption);
