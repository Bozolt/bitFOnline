(function (root) {
  'use strict';
  const integer = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;
  const randomInt = (min, max, random = Math.random) => min + Math.floor(random() * (max - min + 1));
  function gcd(a, b) {
    while (b !== 0) [a, b] = [b, a % b];
    return Math.abs(a);
  }
  function coprimes(n) {
    if (!integer(n, 2, 100)) throw new RangeError('2 és 100 közötti egész szám szükséges.');
    return Array.from({ length: 99 }, (_, i) => i + 2).filter(v => gcd(v, n) === 1);
  }
  function newChairs(count, random = Math.random) {
    if (!integer(count, 10, 20)) throw new RangeError('10–20 szék szükséges.');
    return { values: Array.from({ length: count }, () => randomInt(5, 15, random)), owners: Array(count).fill(0), current: 1, last: null, over: false };
  }
  function legalChairs(state) {
    return state.owners.flatMap((owner, i) => !owner && (state.last === null || Math.abs(i - state.last) !== 1) ? [i] : []);
  }
  function takeChair(state, index) {
    if (state.over || !legalChairs(state).includes(index)) return false;
    state.owners[index] = state.current;
    state.last = index;
    state.current = 3 - state.current;
    state.over = legalChairs(state).length === 0;
    return true;
  }
  function chairScores(state) {
    return [1, 2].map(player => state.values.reduce((sum, value, i) => sum + (state.owners[i] === player ? value : 0), 0));
  }
  // A magyar színnevek fordított betűrendje.
  const colors = [
    { name: 'zöld', hex: '#278465' },
    { name: 'sárga', hex: '#e9b82b' },
    { name: 'piros', hex: '#d9524b' },
    { name: 'kék', hex: '#4c7dcb' },
    { name: 'fekete', hex: '#303937' }
  ];
  function wireOrder(wires) {
    return wires.map((color, index) => ({ color, index })).sort((a, b) => a.color - b.color || a.index - b.index).map(wire => wire.index);
  }
  function cutWire(state, index) {
    if (state.over || !integer(index, 0, state.wires.length - 1) || state.cut.includes(index)) return null;
    if (wireOrder(state.wires)[state.cut.length] !== index) {
      state.over = true;
      return false;
    }
    state.cut.push(index);
    state.over = state.cut.length === state.wires.length;
    return true;
  }
  const walkStart = [2, 2];
  const map = [
    '0100000000',
    '0010000000',
    '0001100101',
    '0000100101',
    '0011110111',
    '0100000000',
    '0100000100',
    '0000000000',
    '0010000010',
    '1100000000'
  ];
  function walkOptions(grid, visits, position) {
    const [x, y] = position;
    const neighbors = [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]
      .filter(([nx, ny]) => ny >= 0 && ny < grid.length && nx >= 0 && nx < grid[ny].length && grid[ny][nx] === '0');
    const min = Math.min(...neighbors.map(([nx, ny]) => visits[ny][nx]));
    return neighbors.filter(([nx, ny]) => visits[ny][nx] === min);
  }
  function walkStep(grid, visits, position, random = Math.random) {
    const options = walkOptions(grid, visits, position);
    if (!options.length) return null;
    const next = options[randomInt(0, options.length - 1, random)];
    visits[next[1]][next[0]]++;
    return next;
  }
  function shuffled(values, random = Math.random) {
    const result = [...values];
    for (let i = result.length - 1; i > 0; i--) {
      const j = randomInt(0, i, random);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  function memoryLayout(count, random = Math.random) {
    if (!integer(count, 5, 9)) throw new RangeError('5–9 kör szükséges.');
    // Egy kör egy cellába kerül: véletlen eltolás mellett sem metszhetik egymást.
    const cells = shuffled(Array.from({ length: 12 }, (_, i) => i), random).slice(0, count);
    return cells.map((cell, i) => ({
      number: i + 1,
      x: 75 + (cell % 4) * 150 + randomInt(-20, 20, random),
      y: 65 + Math.floor(cell / 4) * 130 + randomInt(-15, 15, random),
      radius: 30
    }));
  }
  function memoryPick(state, number) {
    if (state.over || number < state.next) return null;
    if (number !== state.next) { state.over = true; return false; }
    state.next++;
    state.hidden = true;
    state.over = state.next > state.count;
    return true;
  }
  const api = { integer, randomInt, gcd, coprimes, newChairs, legalChairs, takeChair, chairScores, colors, wireOrder, cutWire, map, walkStart, walkOptions, walkStep, shuffled, memoryLayout, memoryPick };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.BitGames = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
