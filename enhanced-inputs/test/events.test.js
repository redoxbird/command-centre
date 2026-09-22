// EI2 regression: every component emits the canonical e:* vocabulary.
// A listener attached for e:* must hear each component; no input:* strings
// may be emitted by any shipped module.
import '../src/index.js';
import '../src/inputs/e-input-text.js';
import '../src/inputs/e-input-number.js';
import '../src/inputs/e-input-radio.js';
import '../src/inputs/e-input-checkbox.js';

async function mount(tag, attrs = {}) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

afterEach(() => {
  document.body.innerHTML = '';
});

test('e-input emits e:* events, never input:*', async () => {
  const seen = [];
  for (const t of ['e:input', 'e:change', 'e:validate', 'e:error', 'input:input', 'input:change', 'input:validate', 'input:error']) {
    document.addEventListener(t, (e) => seen.push(e.type));
  }
  const el = await mount('e-input', { type: 'text', name: 'q', required: '' });
  el.value = '';
  await el.validate();
  await el.updateComplete;
  expect(seen).toContain('e:validate');
  expect(seen).toContain('e:error');
  expect(seen.filter((t) => t.startsWith('input:'))).toEqual([]);
});

test('standalone tags emit e:* events, never input:*', async () => {
  const seen = [];
  const listen = (e) => seen.push(e.type);
  for (const t of ['e:input', 'e:change', 'e:validate', 'e:error', 'e:success', 'input:input', 'input:change', 'input:validate', 'input:error']) {
    document.addEventListener(t, listen);
  }
  const text = await mount('input-text', { name: 't' });
  text.value = 'hello';
  await text.validate();
  const num = await mount('input-number', { name: 'n' });
  await num.validate();
  const radio = await mount('input-radio', { name: 'r' });
  await radio.validate();
  const check = await mount('input-checkbox', { name: 'c' });
  await check.validate();
  const legacy = seen.filter((t) => t.startsWith('input:'));
  expect(legacy).toEqual([]);
  expect(seen).toContain('e:validate');
});
