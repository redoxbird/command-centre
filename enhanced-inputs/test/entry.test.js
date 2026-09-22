// Entry-point surface (EI3 + EI6): one documented surface exists.
// Importing the entry registers <e-input> + option elements — and must NOT
// register any deprecated standalone <input-*> tag.
import EInputDefault, { EInput, ESelectOption } from '../src/index.js';

afterEach(() => {
  document.body.innerHTML = '';
});

test('default and named EInput exports exist', () => {
  expect(typeof EInputDefault).toBe('function');
  expect(EInput).toBe(EInputDefault);
  expect(typeof ESelectOption).toBe('function');
});

test('entry registers e-input but no standalone tags', async () => {
  expect(customElements.get('e-input')).toBeDefined();
  for (const tag of ['input-text', 'input-number', 'input-select', 'input-radio', 'input-checkbox', 'input-toggle', 'input-range']) {
    expect(customElements.get(tag)).toBeUndefined();
  }
  const el = document.createElement('e-input');
  el.setAttribute('type', 'text');
  document.body.appendChild(el);
  await el.updateComplete;
  expect(el.tagName).toBe('E-INPUT');
});
