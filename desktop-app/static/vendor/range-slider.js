const g = {
  value: "valuenow",
  min: "valuemin",
  max: "valuemax"
};
function A(l = "") {
  const t = String(l).split(".")[1];
  return t ? t.length : 0;
}
function h(l, t, e) {
  const i = g[t];
  i && l.setAttribute(`aria-${i}`, e);
}
const E = ["min", "max", "step", "value", "disabled", "value-precision"], m = {
  stepUp: ["ArrowUp", "ArrowRight"],
  stepDown: ["ArrowDown", "ArrowLeft"]
}, f = document.createElement("template");
f.innerHTML = `
  <div data-track></div>
  <div data-track-fill></div>
  <div data-runnable-track>
    <div data-thumb></div>
  </div>
`;
class o extends HTMLElement {
  /**
   * Registers the custom element with the global or provided custom element registry.
   *
   * @param {string} [tagName='range-slider'] - The tag name to register the element under.
   * @param {CustomElementRegistry} [registry=window.customElements] - Optional custom element registry.
   * @returns {typeof RangeSliderElement | undefined} - Returns the class constructor if successfully defined, otherwise undefined.
   * @example
   * RangeSliderElement.define();
   * RangeSliderElement.define('my-slider', customElements);
   */
  static define(t = "range-slider", e = customElements) {
    if (!e.get(t))
      return e.define(t, o), o;
  }
  static observedAttributes = E;
  static formAssociated = !0;
  #r;
  #o;
  #t = [];
  #n = [];
  #i = 0;
  /**
   * Creates a new instance of the RangeSliderElement.
   *
   * @constructor
   */
  constructor() {
    super(), this.#r = this.attachInternals(), this.addEventListener("focusin", this.#m), this.addEventListener("pointerdown", this.#f), this.addEventListener("keydown", this.#v);
  }
  get min() {
    return this.hasAttribute("min") ? Number(this.getAttribute("min")) : 0;
  }
  get max() {
    return this.hasAttribute("max") ? Number(this.getAttribute("max")) : 100;
  }
  get step() {
    return this.hasAttribute("step") ? Number(this.getAttribute("step")) : 1;
  }
  get value() {
    return this.#t.join(",");
  }
  get disabled() {
    return this.getAttribute("disabled") === "" || !1;
  }
  get valuePrecision() {
    return this.getAttribute("value-precision") || "";
  }
  get #s() {
    return this.getAttribute("orientation") === "vertical";
  }
  get #l() {
    return !!(this.#s || this.getAttribute("dir") === "rtl");
  }
  get #d() {
    return this.#e.length > 1;
  }
  get #e() {
    return this.querySelectorAll("[data-runnable-track] [data-thumb]");
  }
  get #c() {
    return this.querySelector("[data-track-fill]");
  }
  get #a() {
    return this.#s ? this.offsetHeight : this.offsetWidth;
  }
  set min(t) {
    this.setAttribute("min", t);
    for (const e of this.#e)
      h(e, "min", t);
  }
  set max(t) {
    this.setAttribute("max", t);
    for (const e of this.#e)
      h(e, "max", t);
  }
  set step(t) {
    this.setAttribute("step", t);
  }
  set value(t) {
    String(t).split(",").map((e, i) => {
      this.#u(i, e);
    });
  }
  set disabled(t) {
    if (t) {
      this.setAttribute("disabled", ""), this.removeAttribute("tabindex");
      for (const e of this.#e)
        e.removeAttribute("tabindex");
    } else {
      this.removeAttribute("disabled"), this.setAttribute("tabindex", "-1");
      for (const e of this.#e)
        e.setAttribute("tabindex", 0);
    }
  }
  set valuePrecision(t) {
    this.setAttribute("value-precision", t);
  }
  /**
   * Form data support
   * The following properties and methods aren't strictly required,
   * but browser-level form controls provide them. Providing them helps
   * ensure consistency with browser-provided controls.
   */
  get form() {
    return this.#r.form;
  }
  get name() {
    return this.getAttribute("name");
  }
  get type() {
    return this.localName;
  }
  get validity() {
    return this.#r.validity;
  }
  get validationMessage() {
    return this.#r.validationMessage;
  }
  get willValidate() {
    return this.#r.willValidate;
  }
  checkValidity() {
    return this.#r.checkValidity();
  }
  reportValidity() {
    return this.#r.reportValidity();
  }
  connectedCallback() {
    this.firstChild || this.appendChild(f.content.cloneNode(!0)), this.disabled || this.setAttribute("tabindex", "-1"), this.#e.forEach((t, e) => {
      t.dataset.thumb = e, t.setAttribute("role", "slider"), h(t, "min", this.min), h(t, "max", this.max), this.disabled || t.setAttribute("tabindex", 0);
    }), this.value = this.getAttribute("value") || this.#E();
  }
  disconnectedCallback() {
    this.removeEventListener("focusin", this.#m), this.removeEventListener("pointerdown", this.#f), this.removeEventListener("keydown", this.#v);
  }
  attributeChangedCallback(t, e, i) {
    e !== i && (t === "value" ? this.value = i : this.value = this.value);
  }
  #m = (t) => {
    t.target.dataset.thumb !== void 0 && (this.#i = Number(t.target.dataset.thumb));
  };
  #f = (t) => {
    if (!this.disabled)
      if (this.setPointerCapture(t.pointerId), this.addEventListener("pointermove", this.#b), window.addEventListener("pointerup", this.#h), window.addEventListener("pointercancel", this.#h), this.#o = this.value, t.target.dataset.thumb !== void 0)
        this.#i = Number(t.target.dataset.thumb);
      else {
        const { offsetX: e, offsetY: i } = t;
        this.#i = this.#w(this.#s ? i : e), this.#p(this.#s ? i : e);
      }
  };
  #b = (t) => {
    t.target === this && (t.preventDefault(), this.#p(this.#s ? t.offsetY : t.offsetX));
  };
  #h = (t) => {
    this.releasePointerCapture(t.pointerId), this.removeEventListener("pointermove", this.#b), window.removeEventListener("pointerup", this.#h), window.removeEventListener("pointercancel", this.#h), this.#o !== this.value && this.dispatchEvent(new Event("change", { bubbles: !0 }));
  };
  #v = (t) => {
    const i = Object.keys(m).find((s) => m[s].includes(t.code) && s);
    document.activeElement !== this.#e[this.#i] && this.#e[this.#i].focus({ focusVisible: !1 }), i && (t.preventDefault(), this[i]());
  };
  /**
   *
   * @param {number} offset
   */
  #p = (t) => {
    const i = Math.min(Math.max(t, 0), this.#a) / this.#a, s = this.#A(this.#l ? 1 - i : i);
    this.#u(this.#i, s, ["input"]);
  };
  #E() {
    return this.max < this.min ? this.min : this.min + (this.max - this.min) / 2;
  }
  /**
   *
   * @param {number} value
   * @returns
   */
  #g(t) {
    return 100 * (t - this.min) / (this.max - this.min);
  }
  /**
   * Fit the percentage complete between the range [min,max]
   * by remapping from [0, 1] to [min, min+(max-min)].
   *
   * @param {number} percent
   * @returns
   */
  #A(t) {
    return this.min + t * (this.max - this.min);
  }
  /**
   *
   * @param {number} offset
   * @returns
   */
  #w(t) {
    let e;
    const s = Math.min(Math.max(t, 0), this.#a) / this.#a, n = this.#A(this.#l ? 1 - s : s), r = this.#t.findIndex((a) => n - a < 0);
    if (r === 0)
      e = r;
    else if (r === -1)
      e = this.#t.length - 1;
    else {
      const a = this.#t[r - 1], d = this.#t[r];
      Math.abs(a - n) < Math.abs(d - n) ? e = r - 1 : e = r;
    }
    return e;
  }
  /**
   *
   * @param {number} index
   * @param {number} value
   * @param {string[]} dispatchEvents
   */
  #u(t, e, i = []) {
    const s = this.#t[t], n = Number(this.valuePrecision) || A(this.step) || 0, r = this.#t[t - 1] || this.min, a = this.#t[t + 1] || this.max, b = Math.min(Math.max(e, r), a) - this.min, v = Math.round(b / this.step) * this.step, c = this.min + v, u = Number(
      n ? c.toFixed(n) : Math.round(c)
    );
    s !== u && (this.#t[t] = u, this.#n[t] = this.#g(u), this.#r.setFormValue(this.#t.join(",")), this.#x(t, u), this.#V(), i.map((p) => {
      this.dispatchEvent(new Event(p, { bubbles: !0 }));
    }));
  }
  /**
   *
   * @param {number} index
   * @param {number} value
   */
  #x(t, e) {
    this.#e[t] && (this.#e[t].style.setProperty(
      `inset-${this.#s ? "block" : "inline"}-${this.#s ? "end" : "start"}`,
      `${this.#g(e)}%`
    ), h(this.#e[t], "value", e));
  }
  #V() {
    if (!this.#c) return;
    const t = this.#d ? `${this.#n[0]}%` : 0, i = `clamp(var(--thumb-size) / 2, ${this.#d ? `${100 - this.#n[this.#n.length - 1]}%` : `${100 - this.#n[0]}%`}, 100% - var(--thumb-size) / 2)`;
    this.#c.style.setProperty(
      `inset-${this.#s ? "block" : "inline"}`,
      this.#s ? `${i} ${t}` : `${t} ${i}`
    );
  }
  /**
   * Increments the value
   * @param {number} amount - The amount to increment by.
   */
  stepUp(t = this.step) {
    const e = this.#t[this.#i] + t;
    this.#u(this.#i, e, ["change"]);
  }
  /**
   * Decrements the value
   * @param {number} amount - The amount to decrement by.
   */
  stepDown(t = this.step) {
    const e = this.#t[this.#i] - t;
    this.#u(this.#i, e, ["change"]);
  }
}
new URL(import.meta.url).searchParams.has("define", "false") || (window.RangeSliderElement = o.define());
export {
  o as default
};
