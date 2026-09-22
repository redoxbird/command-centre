// Option collection: slotted child elements (never a JSON attribute) are
// normalized to {value, label, description, ...} with selected flags honored.
import '../src/index.js';

afterEach(() => {
  document.body.innerHTML = '';
});

function option(tag, value, label, attrs = {}) {
  const o = document.createElement(tag);
  o.setAttribute('value', value);
  o.textContent = label;
  for (const [k, v] of Object.entries(attrs)) o.setAttribute(k, v);
  return o;
}

test('select collects e-select-option children with labels', async () => {
  const el = document.createElement('e-input');
  el.setAttribute('type', 'select');
  el.setAttribute('name', 'codec');
  el.appendChild(option('e-select-option', 'h264', 'H.264', { description: 'Default' }));
  el.appendChild(option('e-select-option', 'h265', 'H.265'));
  document.body.appendChild(el);
  await el.updateComplete;
  expect(el.options.map((o) => o.value)).toEqual(['h264', 'h265']);
  expect(el.options[0].label || el.options[0].text).toBe('H.264');
});

test('radio collects e-radio-option children; divergent input-radio-option does not feed e-input', async () => {
  const el = document.createElement('e-input');
  el.setAttribute('type', 'radio');
  el.setAttribute('name', 'mode');
  el.appendChild(option('e-radio-option', 'a', 'A'));
  const legacy = option('input-radio-option', 'b', 'B');
  document.body.appendChild(el);
  await el.updateComplete;
  // Appending a foreign-named option after connect must not leak in.
  el.appendChild(legacy);
  await el.updateComplete;
  expect(el.options.map((o) => o.value)).toEqual(['a']);
});

test('checkbox-group collects e-checkbox-option children', async () => {
  const el = document.createElement('e-input');
  el.setAttribute('type', 'checkbox-group');
  el.setAttribute('name', 'flags');
  el.appendChild(option('e-checkbox-option', 'x', 'X'));
  el.appendChild(option('e-checkbox-option', 'y', 'Y'));
  document.body.appendChild(el);
  await el.updateComplete;
  expect(el.options.map((o) => o.value)).toEqual(['x', 'y']);
});
