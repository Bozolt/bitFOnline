'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('Kártyák: a valódi HTML-lel elindul a keverés, majd a popupból újrakezdhető', async () => {
  const root = path.resolve(__dirname, '..');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const source = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8');
  let animationCount = 0;
  class Element {
    constructor() {
      this.children = []; this.style = {}; this.listeners = {};
      this.classList = { add() {} }; this.open = false;
    }
    addEventListener(name, fn) { this.listeners[name] = fn; }
    setAttribute() {}
    replaceChildren() { this.children = []; }
    append(node) { this.children.push(node); }
    animate() {
      animationCount++;
      return { finished: Promise.resolve(), cancel() {} };
    }
    showModal() { this.open = true; }
    close() { this.open = false; }
  }
  // Csak a valódi HTML-ben létező elemek kérhetők le.
  const elements = new Map([...html.matchAll(/id="([^"]+)"/g)].map(match => [match[1], new Element()]));
  const $ = id => elements.get(id) || null;
  $('card-speed').value = '5';
  const context = vm.createContext({
    $, document: { createElement: () => new Element() },
    status: (id, message) => { $(id).textContent = message; },
    G: { shuffled: values => values, randomInt: () => 0 },
    setTimeout: callback => { callback(); }
  });
  const cardCode = source.slice(source.indexOf('  let cardRun'), source.indexOf('  let visits'));
  vm.runInContext(cardCode, context);
  await $('card-start').listeners.click();
  assert.equal(animationCount, 14, '7 csere, cserénként 2 animáció');
  assert.equal($('card-phase').textContent, 'Te következel');
  assert.equal($('card-start').disabled, false);
  assert.ok($('card-stage').children.every(card => !card.disabled));
  $('card-stage').children[0].listeners.click();
  assert.equal($('card-dialog').open, true);
  assert.equal($('card-dialog-title').textContent, 'Nyertél!');
  assert.equal($('card-dialog-cards').children.length, 3);
  $('card-dialog-new').listeners.click();
  // Az új kör aszinkron animációs láncának végére várunk.
  for (let i = 0; i < 100 && $('card-phase').textContent !== 'Te következel'; i++) await Promise.resolve();
  assert.equal($('card-dialog').open, false);
  assert.equal(animationCount, 28);
  assert.equal($('card-phase').textContent, 'Te következel');
  $('card-stage').children[1].listeners.click();
  assert.equal($('card-dialog-title').textContent, 'Most nem sikerült!');
  assert.equal($('card-dialog-cards').children.length, 3);
});
