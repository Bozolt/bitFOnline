'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const G = require('../js/core.js');

test('Bomba: sikeres és hibás vágás eredményablaka, bezárás és új bomba', () => {
  const root = path.resolve(__dirname, '..');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const source = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8');
  class Element {
    constructor() { this.children = []; this.listeners = {}; this.style = { setProperty() {} }; this.open = false; }
    addEventListener(name, fn) { this.listeners[name] = fn; }
    setAttribute() {}
    replaceChildren() { this.children = []; }
    append(node) { this.children.push(node); }
    showModal() { this.open = true; }
    close() { this.open = false; }
  }
  const elements = new Map([...html.matchAll(/id="([^"]+)"/g)].map(m => [m[1], new Element()]));
  const $ = id => elements.get(id) || null;
  $('wire-count').value = '3';
  let generated = 0;
  const context = vm.createContext({
    $, G: { ...G, randomInt: () => generated++ % 3 },
    document: { createElement: () => new Element() },
    status: (id, text) => { $(id).textContent = text; }
  });
  vm.runInContext(source.slice(source.indexOf('  let bomb;'), source.indexOf('  let memory')), context);
  const cut = index => $('wire-board').children[index].listeners.click();
  assert.equal($('bomb-dialog').open, false);
  cut(0);
  assert.equal($('bomb-dialog').open, false, 'Jó köztes vágás nem szakítja meg a játékot');
  cut(1); cut(2);
  assert.equal($('bomb-dialog').open, true);
  assert.equal($('bomb-dialog-title').textContent, 'A bomba hatástalanítva!');
  assert.ok($('bomb-dialog-text').textContent.includes('Kiváló munka'));
  assert.ok($('wire-board').children.every(node => node.disabled));
  $('bomb-dialog-new').listeners.click();
  assert.equal($('bomb-dialog').open, false);
  assert.ok($('wire-board').children.every(node => !node.disabled));
  cut(2);
  assert.equal($('bomb-dialog').open, true);
  assert.equal($('bomb-dialog-title').textContent, 'Rossz sorrend!');
  assert.ok($('bomb-dialog-text').textContent.includes('1. (zöld)'));
  assert.ok($('wire-board').children.every(node => node.disabled));
  $('bomb-dialog-close').listeners.click();
  assert.equal($('bomb-dialog').open, false);
  assert.ok($('wire-board').children.every(node => node.disabled));
  $('bomb-start').listeners.click();
  assert.ok($('wire-board').children.every(node => !node.disabled));
  assert.equal($('bomb-light').textContent, '● AKTÍV');
});
