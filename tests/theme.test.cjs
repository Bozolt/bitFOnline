'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('Téma: kapcsolás, mentett választás és tiltott helyi tárolás', () => {
  const root = path.resolve(__dirname, '..');
  const source = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.ok(html.includes('id="theme-toggle"'));
  const code = source.slice(source.indexOf('  function applyTheme'), source.indexOf('  const status'));
  for (const stored of [null, 'light', 'dark', 'invalid', 'blocked']) {
    const attrs = {}, data = {};
    const button = { setAttribute: (key, value) => { attrs[key] = value; }, addEventListener: (_, fn) => { button.click = fn; } };
    let saved;
    const context = vm.createContext({
      $: () => button,
      document: { documentElement: { dataset: data } },
      localStorage: {
        getItem() { if (stored === 'blocked') throw Error('Storage unavailable'); return stored; },
        setItem(_, value) { if (stored === 'blocked') throw Error('Storage unavailable'); saved = value; }
      }
    });
    vm.runInContext(code, context);
    const initialDark = stored === 'dark';
    assert.equal(data.theme, initialDark ? 'dark' : 'light');
    assert.equal(attrs['aria-pressed'], String(initialDark));
    button.click();
    assert.equal(data.theme, initialDark ? 'light' : 'dark');
    assert.equal(button.textContent, initialDark ? '☾ Sötét mód' : '☀ Világos mód');
    if (stored !== 'blocked') assert.equal(saved, data.theme);
    button.click();
    assert.equal(data.theme, initialDark ? 'dark' : 'light');
  }
});
