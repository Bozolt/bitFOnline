'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('Séta: teljes felfedezéskor szünet, folytatás ugyanonnan, bezárás és újrakezdés', () => {
  const root = path.resolve(__dirname, '..');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const source = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8');
  class Element {
    constructor() { this.listeners = {}; this.open = false; }
    addEventListener(name, callback) { this.listeners[name] = callback; }
    append() {}
    replaceChildren() {}
    setAttribute() {}
    showModal() { this.open = true; this.shown = (this.shown || 0) + 1; }
    close() { this.open = false; }
  }
  const nodes = new Map([...html.matchAll(/id="([^"]+)"/g)].map(m => [m[1], new Element()]));
  const $ = id => nodes.get(id) || null;
  $('walk-speed').value = 50;
  const timers = new Map(); let timerId = 0;
  const context = vm.createContext({
    $, status: (id, text) => { $(id).textContent = text; },
    document: { createElement: () => new Element(), createDocumentFragment: () => new Element() },
    G: {
      map: ['00'],
      walkStep: (grid, visits, position) => { const x = 1 - position[0]; visits[0][x]++; return [x, 0]; }
    },
    setTimeout: callback => { timers.set(++timerId, callback); return timerId; },
    clearTimeout: id => timers.delete(id)
  });
  vm.runInContext(source.slice(source.indexOf('  let visits'), source.indexOf('  let bomb')), context);
  const tick = () => {
    const [id, callback] = timers.entries().next().value;
    timers.delete(id); callback();
  };
  $('walk-start').listeners.click(); tick();
  assert.equal($('walk-dialog').open, true);
  assert.equal(timers.size, 0);
  assert.equal($('walk-steps').textContent, 1);
  assert.equal($('walk-percent').textContent, '100%');
  $('walk-dialog-continue').listeners.click();
  assert.equal($('walk-dialog').open, false);
  assert.equal(timers.size, 1);
  tick();
  assert.equal($('walk-steps').textContent, 2);
  assert.equal($('walk-dialog').shown, 1, 'Folytatás után nem nyílik újra');
  $('walk-reset').listeners.click();
  assert.equal(timers.size, 0);
  assert.equal($('walk-steps').textContent, 0);
  $('walk-step').listeners.click();
  assert.equal($('walk-dialog').open, true, 'Kézi lépéssel is jelzi a befejezést');
  $('walk-dialog-close').listeners.click();
  assert.equal($('walk-dialog').open, false);
  assert.equal(timers.size, 0, 'Bezárás után szünetel');
  $('walk-start').listeners.click(); tick();
  assert.equal($('walk-steps').textContent, 2, 'A fő gombbal is folytatható');
  assert.equal($('walk-dialog').shown, 2);
});
