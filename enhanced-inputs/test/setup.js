// jest setup: minimal browser APIs jsdom lacks but the components need.
if (typeof HTMLElement !== 'undefined' && !HTMLElement.prototype.attachInternals) {
  HTMLElement.prototype.attachInternals = function () {
    return {
      setFormValue: () => {},
      setValidity: () => {},
      setValidationMessage: () => {},
      states: new Set(),
      shadowRoot: null,
      form: null,
      labels: [],
      willValidate: true,
      validity: {},
      validationMessage: '',
      checkValidity: () => true,
      reportValidity: () => true,
    };
  };
}

if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = () => ({
    matches: false,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
  });
}
