// Hand-written type declarations for the package entry point (src/index.js).
// Shipped to dist/index.d.ts by build.mjs. Kept in sync with the entry's
// exports by hand: default EInput plus the four slotted option elements.
// The deprecated per-type <input-*> tags are intentionally untyped here.
declare module 'enhanced-inputs' {
  class EInput extends HTMLElement {
    type: string;
    value: any;
    name: string;
    label: string;
    placeholder: string;
    description: string;
    required: boolean;
    disabled: boolean;
    readonly: boolean;
    valid: boolean;
    error: string | null;
    actionButton: string;
    prefix: string;
    prefixValue: string;
    unstyled: boolean;
    mask: string;
    min: string;
    max: string;
    email: boolean;
    url: boolean;
    startsWith: string;
    endsWith: string;
    includes: string;
    lowercase: boolean;
    uppercase: boolean;
    regex: string;
    format: string;
    requiredMessage: string;
    minMessage: string;
    maxMessage: string;
    emailMessage: string;
    urlMessage: string;
    startsWithMessage: string;
    endsWithMessage: string;
    includesMessage: string;
    lowercaseMessage: string;
    uppercaseMessage: string;
    regexMessage: string;
    formatMessage: string;
    gt: number;
    gte: number;
    lt: number;
    lte: number;
    int: boolean;
    positive: boolean;
    nonnegative: boolean;
    negative: boolean;
    nonpositive: boolean;
    multipleOf: number;
    step: number;
    finite: boolean;
    safe: boolean;
    gtMessage: string;
    gteMessage: string;
    ltMessage: string;
    lteMessage: string;
    multipleOfMessage: string;
    stepMessage: string;
    finiteMessage: string;
    safeMessage: string;
    checked: boolean;
    onLabel: string;
    offLabel: string;
    size: string;
    multiple: boolean;
    rows: number;
    cols: number;
    range: boolean;
    startValue: string;
    endValue: string;
    rangeStartLabel: string;
    rangeEndLabel: string;
    themeMode: string;
    swatches: string;
    valueMin: number;
    valueMax: number;
    valueType: string;
    currencySymbol: string;
    locale: string;
    currencyCode: string;
    currencyDisplay: string;
    currencyStyle: string;
    numberFormatOptions: string;
    relativeTimeFormatOptions: string;
    listFormatOptions: string;
    country: string;
    dialCode: string;
    localDigits: string;
    minDigits: number;
    strengthMeter: boolean;
    shadow: boolean;
    inline: boolean;
    validateOn: string;
    autocomplete: string;
    autofocus: boolean;

    validate(): Promise<{ valid: boolean; error: string | null }>;
    reset(): void;
    focus(): void;
    clearErrors(): void;
  }
  export { EInput };
  export default EInput;

  // Slotted, data-only option elements (see _collectOptions in e-input.js).
  export class ESelectOption extends HTMLElement {
    value: string;
    label: string;
    description: string;
    badge: string;
    disabled: boolean;
    selected: boolean;
  }

  export class EComboboxOption extends HTMLElement {
    value: string;
    label: string;
    description: string;
    badge: string;
    disabled: boolean;
    selected: boolean;
  }

  export class ERadioOption extends HTMLElement {
    value: string;
    label: string;
    description: string;
    badge: string;
    disabled: boolean;
    selected: boolean;
  }

  export class ECheckboxOption extends HTMLElement {
    value: string;
    label: string;
    description: string;
    badge: string;
    disabled: boolean;
    selected: boolean;
  }
}
