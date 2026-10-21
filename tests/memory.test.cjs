'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const G = require('../js/core.js');

test('Memória: siker idővel, hibás sorrend, új próba és bezárás', () => {
  const root = path.resolve(__dirname, '..');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const source = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8');
  class Element {
    constructor() { this.children = []; this.listeners = {}; this.style = {}; this.classList = { add() {}, toggle() {} }; this.open = false; }
    addEventListener(name, fn) { this.listeners[name] = fn; }
    setAttribute() {}
    replaceChildren() { this.children = []; }
    append(node) { this.children.push(node); }
    showModal() { this.open = true; }
    close() { this.open = false; }
  }
  const elements = new Map([...html.matchAll(/id="([^"]+)"/g)].map(m => [m[1], new Element()]));
  const $ = id => elements.get(id) || null;
  $('memory-count').value = '5';
  let now = 1000, frame = 0;
  const frames = new Set();
  const context = vm.createContext({
    $, G, document: { createElement: () => new Element() },
    status: (id, text) => { $(id).textContent = text; },
    elapsed: value => (value / 1000).toFixed(2) + ' mp',
    performance: { now: () => now },
    requestAnimationFrame: () => { frames.add(++frame); return frame; },
    cancelAnimationFrame: id => frames.delete(id)
  });
  vm.runInContext(source.slice(source.indexOf('  let memory'), source.indexOf('  let currentView')), context);
  $('memory-start').listeners.click();
  const circles = $('memory-board').children;
  assert.equal(circles.length, 5);
  assert.equal($('memory-dialog').open, false);
  circles[0].listeners.click();
  assert.ok(circles.slice(1).every(node => node.textContent === ''));
  now = 3500;
  circles.slice(1).forEach(node => node.listeners.click());
  assert.equal($('memory-dialog').open, true);
  assert.equal($('memory-dialog-title').textContent, 'Hibátlan sorrend!');
  assert.equal($('memory-dialog-text').textContent, 'Időd: 2.50 mp');
  assert.equal(frames.size, 0);
  assert.ok(circles.every(node => node.disabled));
  $('memory-dialog-new').listeners.click();
  assert.equal($('memory-dialog').open, false);
  assert.equal($('memory-board').children[0].textContent, 1);
  $('memory-board').children[1].listeners.click();
  assert.equal($('memory-dialog-title').textContent, 'Most nem sikerült!');
  assert.equal($('memory-dialog-text').textContent, 'A(z) 1. számot kellett volna választani.');
  assert.equal(frames.size, 0);
  $('memory-dialog-close').listeners.click();
  assert.equal($('memory-dialog').open, false);
  assert.ok($('memory-board').children.every(node => node.disabled));
});
