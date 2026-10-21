'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const G = require('../js/core.js');
function rng(seed = 1) {
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
}

test('Relatív prímek: minden bemenet összevetése független osztókereséssel', () => {
  for (let n = 2; n <= 100; n++) {
    const expected = [];
    for (let i = 2; i <= 100; i++) {
      let common = false;
      for (let d = 2; d <= Math.min(i, n); d++) if (i % d === 0 && n % d === 0) common = true;
      if (!common) expected.push(i);
    }
    assert.deepEqual(G.coprimes(n), expected);
  }
});
test('Relatív prímek: határok és hibás bemenetek', () => {
  for (const n of [-1, 0, 1, 101, 2.5, NaN, Infinity]) assert.throws(() => G.coprimes(n), RangeError);
  assert.equal(G.coprimes(2).length, 49);
  assert.equal(G.coprimes(100).length, 39);
});
test('Székek: a mennyiség és az értékek határai', () => {
  assert.deepEqual(G.newChairs(10, () => 0).values, Array(10).fill(5));
  assert.deepEqual(G.newChairs(20, () => .99999).values, Array(20).fill(15));
  for (const n of [9, 21, 14.5]) assert.throws(() => G.newChairs(n), RangeError);
});
test('Székek: tiltás csak egy körre, foglalt szék nem választható', () => {
  const state = G.newChairs(10, () => 0);
  assert.equal(G.takeChair(state, 4), true);
  assert.equal(state.current, 2);
  assert.equal(G.takeChair(state, 3), false);
  assert.equal(G.takeChair(state, 5), false);
  assert.equal(G.takeChair(state, 4), false);
  assert.equal(G.takeChair(state, 8), true);
  assert.ok(G.legalChairs(state).includes(3));
  assert.ok(G.legalChairs(state).includes(5));
  assert.equal(G.legalChairs(state).includes(7), false);
  assert.deepEqual(G.chairScores(state), [5, 5]);
});
test('Székek: szélső széknek egy szomszédja van', () => {
  const state = G.newChairs(10);
  G.takeChair(state, 0);
  assert.deepEqual(G.legalChairs(state), [2, 3, 4, 5, 6, 7, 8, 9]);
});
test('Székek: azonnali befejezés akkor is, ha maradt szabad szék', () => {
  const state = { values: [7, 9, 11], owners: [1, 0, 0], current: 2, last: 0, over: false };
  assert.equal(G.takeChair(state, 2), true);
  assert.equal(state.over, true);
  assert.equal(state.owners[1], 0);
  assert.equal(G.takeChair(state, 1), false);
  assert.deepEqual(G.chairScores(state), [7, 11]);
});
test('Székek: 100 teljes véletlen játék helyes végállapottal', () => {
  const random = rng(73);
  for (let game = 0; game < 100; game++) {
    const state = G.newChairs(G.randomInt(10, 20, random), random);
    let moves = 0;
    while (!state.over) {
      const options = G.legalChairs(state);
      assert.ok(G.takeChair(state, options[G.randomInt(0, options.length - 1, random)]));
      assert.ok(++moves <= state.values.length);
    }
    assert.equal(G.legalChairs(state).length, 0);
    assert.equal(G.chairScores(state).reduce((a, b) => a + b), state.values.reduce((sum, value, i) => sum + (state.owners[i] ? value : 0), 0));
  }
});
test('Kártyák: a keverés megőrzi az összes lapot és változtatja a sorrendet', () => {
  const random = rng(5), variants = new Set();
  for (let i = 0; i < 100; i++) {
    const positions = G.shuffled([0, 1, 2], random);
    variants.add(positions.join(''));
    assert.deepEqual([...positions].sort(), [0, 1, 2]);
  }
  assert.equal(variants.size, 6);
});
test('Séta: a térkép minden szabad mezője elérhető', () => {
  const seen = new Set(['0,0']), queue = [[0, 0]];
  while (queue.length) {
    const [x, y] = queue.shift();
    for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
      if (G.map[ny]?.[nx] === '0' && !seen.has(`${nx},${ny}`)) { seen.add(`${nx},${ny}`); queue.push([nx, ny]); }
    }
  }
  assert.equal(seen.size, G.map.join('').split('').filter(c => c === '0').length);
});
test('Séta: legkevesebbet látogatott szomszédok és döntetlen', () => {
  const grid = ['000', '000', '010'];
  const visits = [[0, 1, 0], [4, 5, 1], [0, 0, 0]];
  assert.deepEqual(G.walkOptions(grid, visits, [1, 1]), [[2, 1], [1, 0]]);
  assert.deepEqual(G.walkStep(grid, visits, [1, 1], () => 0), [2, 1]);
  assert.equal(visits[1][2], 2);
  assert.equal(G.walkStep(['01', '11'], [[1, 0], [0, 0]], [0, 0]), null);
});
test('Séta: 5000 lépés során nincs fal, kilépés vagy ugrás, a számláló pontos', () => {
  const random = rng(9), visits = G.map.map(row => Array(row.length).fill(0));
  let position = [0, 0]; visits[0][0] = 1;
  for (let i = 0; i < 5000; i++) {
    const next = G.walkStep(G.map, visits, position, random);
    assert.equal(G.map[next[1]][next[0]], '0');
    assert.equal(Math.abs(next[0] - position[0]) + Math.abs(next[1] - position[1]), 1);
    position = next;
  }
  assert.equal(visits.flat().reduce((a, b) => a + b), 5001);
  assert.equal(visits.flat().filter(v => v > 0).length, G.map.join('').split('').filter(v => v === '0').length);
});
test('Bomba: fordított magyar betűrend és azonos színeknél balról jobbra', () => {
  const wires = [4, 2, 0, 1, 0, 3, 2, 4];
  assert.deepEqual(G.wireOrder(wires), [2, 4, 3, 1, 6, 5, 0, 7]);
  assert.deepEqual(G.wireOrder([2, 2, 2]), [0, 1, 2]);
});
test('Bomba: rossz választás után nem folytatható', () => {
  const state = { wires: [4, 0, 2], cut: [], over: false };
  assert.equal(G.cutWire(state, 0), false);
  assert.equal(state.over, true);
  assert.equal(G.cutWire(state, 1), null);
  assert.deepEqual(state.cut, []);
});
test('Bomba: siker és ismételt vágás kezelése', () => {
  const state = { wires: [0, 0, 4], cut: [], over: false };
  assert.equal(G.cutWire(state, 0), true);
  assert.equal(G.cutWire(state, 0), null);
  assert.equal(G.cutWire(state, 1), true);
  assert.equal(state.over, false);
  assert.equal(G.cutWire(state, 2), true);
  assert.equal(state.over, true);
});
test('Memória: 500 elrendezésnél sincs átfedés vagy kilógás (5–9 kör)', () => {
  const random = rng(29);
  for (let count = 5; count <= 9; count++) for (let trial = 0; trial < 100; trial++) {
    const circles = G.memoryLayout(count, random);
    assert.equal(circles.length, count);
    for (const a of circles) {
      assert.ok(a.x - a.radius >= 0 && a.x + a.radius <= 600);
      assert.ok(a.y - a.radius >= 0 && a.y + a.radius <= 390);
      for (const b of circles) if (a !== b) assert.ok(Math.hypot(a.x - b.x, a.y - b.y) >= a.radius + b.radius);
    }
  }
});
test('Memória: számok az első helyes kattintáskor rejtve, siker után lezárás', () => {
  const state = { count: 7, next: 1, hidden: false, over: false };
  assert.equal(state.hidden, false);
  for (let i = 1; i <= 7; i++) {
    assert.equal(G.memoryPick(state, i), true);
    assert.equal(state.hidden, true);
    assert.equal(state.over, i === 7);
  }
  assert.equal(G.memoryPick(state, 1), null);
});
test('Memória: hibás első és későbbi kattintás is leállít', () => {
  for (const next of [1, 4]) {
    const state = { count: 7, next, hidden: next > 1, over: false };
    assert.equal(G.memoryPick(state, next + 1), false);
    assert.equal(state.over, true);
    assert.equal(G.memoryPick(state, next), null);
  }
});
test('Offline: minden HTML-erőforrás relatív, helyben megtalálható', () => {
  const root = path.resolve(__dirname, '..');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  for (const [, ref] of html.matchAll(/(?:src|href)="([^"#][^"]*)"/g)) {
    assert.equal(/^(?:https?:|\/)/.test(ref), false);
    assert.ok(fs.existsSync(path.join(root, ref)), ref);
  }
  for (const file of ['js/app.js', 'js/core.js']) {
    assert.equal(/\b(?:fetch|XMLHttpRequest|WebSocket|import)\s*\(/.test(fs.readFileSync(path.join(root, file), 'utf8')), false);
  }
  assert.equal(/type="module"/.test(html), false);
});
