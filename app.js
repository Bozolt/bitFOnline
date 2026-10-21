/* Klasszikus script: file:// alól is működik, nincs letöltés vagy modulbetöltés. */
(function () {
  'use strict';
  const G = window.BitGames;
  const $ = id => document.getElementById(id);
  const status = (id, message, type = '') => { $(id).textContent = message; $(id).className = 'status' + (type ? ' ' + type : ''); };
  const elapsed = value => (value / 1000).toLocaleString('hu-HU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' mp';
  function bindRange(id, format = value => value) {
    const update = () => { $(id + '-value').textContent = format($(id).value); };
    $(id).addEventListener('input', update);
    update();
  }
  bindRange('chair-count'); bindRange('card-speed', v => v + ' / 5'); bindRange('walk-speed', v => v + ' ms'); bindRange('wire-count'); bindRange('memory-count');

  $('prime-form').addEventListener('submit', event => {
    event.preventDefault();
    const n = Number($('prime-number').value);
    $('prime-results').replaceChildren();
    if (!G.integer(n, 2, 100)) {
      $('prime-number').setAttribute('aria-invalid', 'true');
      $('prime-count').textContent = '— találat';
      status('prime-status', 'Adj meg egy 2 és 100 közötti egész számot!', 'error');
      return;
    }
    $('prime-number').removeAttribute('aria-invalid');
    const numbers = G.coprimes(n);
    numbers.forEach(number => {
      const chip = document.createElement('span'); chip.className = 'number-chip'; chip.textContent = number;
      $('prime-results').append(chip);
    });
    $('prime-count').textContent = numbers.length + ' találat';
    status('prime-status', `Ezeknek a számoknak és a(z) ${n}-nak a legnagyobb közös osztója 1.`, 'success');
  });

  let chairs;
  function renderChairs() {
    const scores = G.chairScores(chairs);
    $('score-one').textContent = scores[0]; $('score-two').textContent = scores[1];
    document.querySelectorAll('#chairs .score').forEach((node, i) => node.classList.toggle('active', !chairs.over && chairs.current === i + 1));
    const legal = G.legalChairs(chairs);
    $('chair-board').replaceChildren();
    chairs.values.forEach((value, i) => {
      const owner = chairs.owners[i], blocked = !owner && !legal.includes(i);
      const button = document.createElement('button');
      button.className = 'chair' + (owner ? ' owner-' + owner : blocked ? ' blocked' : '');
      button.disabled = chairs.over || !!owner || blocked;
      const label = owner ? owner + '. játékos' : blocked ? '× tiltott' : 'szabad';
      button.innerHTML = `<span class="chair-seat">${value}<small>${label}</small></span><span class="chair-index">${i + 1}. szék</span>`;
      button.setAttribute('aria-label', `${i + 1}. szék, ${value} pont, ${label}`);
      button.addEventListener('click', () => { if (G.takeChair(chairs, i)) renderChairs(); });
      $('chair-board').append(button);
    });
    if (chairs.over) showChairResult(scores);
  }
  function showChairResult(scores) {
    const draw = scores[0] === scores[1], winner = scores[0] > scores[1] ? 1 : 2;
    $('chair-dialog-title').textContent = draw ? 'Döntetlen!' : `${winner}. játékos nyert!`;
    $('chair-dialog-text').textContent = `A(z) ${chairs.current}. játékos nem tud lépni, ezért a játék véget ért.`;
    $('result-one').querySelector('strong').textContent = scores[0];
    $('result-two').querySelector('strong').textContent = scores[1];
    $('result-one').classList.toggle('active', !draw && winner === 1);
    $('result-two').classList.toggle('active', !draw && winner === 2);
    if (!$('chair-dialog').open) $('chair-dialog').showModal();
  }
  function startChairs() { chairs = G.newChairs(Number($('chair-count').value)); renderChairs(); }
  $('chair-start').addEventListener('click', startChairs);
  $('chair-dialog-new').addEventListener('click', () => { $('chair-dialog').close(); startChairs(); });
  $('chair-dialog-close').addEventListener('click', () => $('chair-dialog').close());
  $('chair-dialog').addEventListener('click', event => { if (event.target === $('chair-dialog')) $('chair-dialog').close(); });
  startChairs();

  let cardRun = 0, cardPhase = 'idle', cardPositions = [0, 1, 2], cardAnimations = [], cardNodes = [];
  const faces = [{ name: 'PIROS', symbol: '♥', className: 'red' }, { name: 'KÉK', symbol: '◆', className: 'blue' }, { name: 'ZÖLD', symbol: '♣', className: 'green' }];
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  function showCard(id, faceUp, selectable = false) {
    const node = cardNodes[id], face = faces[id];
    node.className = 'playing-card ' + (faceUp ? face.className : 'backside');
    node.innerHTML = `<span class="card-symbol" aria-hidden="true">${faceUp ? face.symbol : '✦'}</span><span class="card-name">${faceUp ? face.name : 'BIT'}</span>`;
    node.setAttribute('aria-label', faceUp ? face.name + ' kártya' : `${cardPositions[id] + 1}. lefordított kártya`);
    node.disabled = !selectable;
  }
  function renderCards(faceUp = false) {
    $('card-stage').replaceChildren();
    cardNodes = faces.map((_, id) => {
      const node = document.createElement('button');
      node.style.left = (cardPositions[id] * 36.5) + '%';
      node.addEventListener('click', () => chooseCard(id));
      $('card-stage').append(node); return node;
    });
    faces.forEach((_, id) => showCard(id, faceUp));
  }
  function chooseCard(id) {
    if (cardPhase !== 'choose') return;
    cardPhase = 'done';
    faces.forEach((_, i) => { cardNodes[i].disabled = true; });
    showCard(id, true); cardNodes[id].classList.add('selected');
    $('card-phase').textContent = id === 0 ? 'Megtaláltad!' : 'Újra próbálhatod';
    status('card-status', id === 0 ? 'Szép munka! Ez a piros lap.' : 'Ez most nem a piros lap. Indíts új játékot, és próbáld újra!', id === 0 ? 'success' : 'error');
    $('card-start').textContent = 'Új játék ↗';
    $('card-dialog-title').textContent = id === 0 ? 'Nyertél!' : 'Most nem sikerült!';
    $('card-dialog-text').textContent = id === 0 ? 'Szép munka! Megtaláltad a piros lapot.' : 'Ez most nem a piros lap. Próbáld újra!';
    $('card-dialog-cards').replaceChildren();
    faces.forEach((face, faceId) => {
      const card = document.createElement('div');
      card.className = 'playing-card ' + face.className + (faceId === id ? ' selected' : '');
      card.style.order = cardPositions[faceId];
      card.setAttribute('role', 'img');
      card.setAttribute('aria-label', face.name + ' kártya' + (faceId === id ? ', ezt választottad' : ''));
      card.innerHTML = `<span class="card-symbol" aria-hidden="true">${face.symbol}</span><span class="card-name" aria-hidden="true">${face.name}</span>`;
      $('card-dialog-cards').append(card);
    });
    if (!$('card-dialog').open) $('card-dialog').showModal();
  }
  function cancelCards() {
    cardRun++;
    cardAnimations.forEach(animation => animation.cancel()); cardAnimations = [];
    if (cardPhase === 'preview' || cardPhase === 'shuffle' || cardPhase === 'choose') {
      cardPhase = 'idle'; cardPositions = [0, 1, 2]; renderCards();
      status('card-status', 'A játék megszakadt. Az Indítás gombbal újra kezdheted.');
      $('card-phase').textContent = 'Készen állsz?';
    }
    $('card-start').disabled = false; $('card-speed').disabled = false;
  }
  async function startCards() {
    if ($('card-dialog').open) $('card-dialog').close();
    cancelCards();
    const run = cardRun;
    const speed = Number($('card-speed').value);
    const duration = [1100, 820, 560, 340, 170][speed - 1];
    cardPositions = G.shuffled([0, 1, 2]);
    cardPhase = 'preview'; renderCards(true);
    $('card-start').disabled = true; $('card-speed').disabled = true;
    $('card-phase').textContent = 'Jegyezd meg';
    status('card-status', 'Nézd meg, hol van a piros! A keverés mindjárt indul.');
    await wait(2500); if (run !== cardRun) return;
    faces.forEach((_, id) => showCard(id, false));
    cardPhase = 'shuffle';
    await wait(350); if (run !== cardRun) return;
    for (let turn = 0; turn < 7; turn++) {
      $('card-phase').textContent = `${turn + 1} / 7 csere`;
      status('card-status', 'Kövesd a piros lap mozgását…');
      const a = G.randomInt(0, 2), b = (a + G.randomInt(1, 2)) % 3;
      const fromA = cardPositions[a], fromB = cardPositions[b];
      cardNodes[a].style.zIndex = '2'; cardNodes[b].style.zIndex = '1';
      function animate(id, from, to, arc) {
        return cardNodes[id].animate([
          { left: (from * 36.5) + '%', transform: 'translateY(0)' },
          { left: ((from + to) * 18.25) + '%', transform: `translateY(${arc}px)` },
          { left: (to * 36.5) + '%', transform: 'translateY(0)' }
        ], { duration, easing: 'ease-in-out' });
      }
      cardAnimations = [animate(a, fromA, fromB, -23), animate(b, fromB, fromA, 23)];
      const result = await Promise.allSettled(cardAnimations.map(animation => animation.finished));
      if (run !== cardRun || result.some(item => item.status === 'rejected')) return;
      [cardPositions[a], cardPositions[b]] = [fromB, fromA];
      cardNodes.forEach((node, id) => { node.style.left = (cardPositions[id] * 36.5) + '%'; node.style.zIndex = ''; });
      cardAnimations = [];
      await wait(90); if (run !== cardRun) return;
    }
    cardPhase = 'choose';
    faces.forEach((_, id) => showCard(id, false, true));
    $('card-phase').textContent = 'Te következel';
    status('card-status', 'Melyik a piros? Kattints egy kártyára!');
    $('card-start').disabled = false; $('card-speed').disabled = false;
  }
  $('card-dialog-new').addEventListener('click', () => { $('card-dialog').close(); startCards(); });
  $('card-dialog-close').addEventListener('click', () => $('card-dialog').close());
  $('card-dialog').addEventListener('click', event => { if (event.target === $('card-dialog')) $('card-dialog').close(); });
  $('card-start').addEventListener('click', startCards); renderCards();

  let visits, position, walkSteps, walkTimer = null, walkCompleted = false;
  const openCells = G.map.join('').split('').filter(cell => cell === '0').length;
  function renderWalk() {
    const fragment = document.createDocumentFragment();
    G.map.forEach((row, y) => [...row].forEach((cell, x) => {
      const node = document.createElement('span');
      const isBit = x === position[0] && y === position[1];
      node.className = 'map-cell' + (cell === '1' ? ' wall' : visits[y][x] ? ' visited' : '') + (isBit ? ' bit' : '');
      if (cell === '0') node.textContent = visits[y][x];
      node.title = cell === '1' ? 'Fal' : `${x + 1}. oszlop, ${y + 1}. sor: ${visits[y][x]} látogatás${isBit ? ' · a bit itt van' : ''}`;
      fragment.append(node);
    }));
    $('walk-map').replaceChildren(fragment);
    const seen = visits.flat().filter(n => n > 0).length;
    $('walk-coverage').textContent = `${seen} / ${openCells} mező`;
    $('walk-steps').textContent = walkSteps;
    $('walk-percent').textContent = Math.round(seen / openCells * 100) + '%';
    $('walk-map').setAttribute('aria-label', `Labirintus: ${seen} a ${openCells} mezőből felfedezve. A bit a(z) ${position[1] + 1}. sor ${position[0] + 1}. oszlopában van.`);
  }
  function pauseWalk() {
    clearTimeout(walkTimer); walkTimer = null;
    $('walk-start').textContent = walkSteps ? 'Séta folytatása →' : 'Séta indítása →';
    $('walk-step').disabled = false;
  }
  function stepWalk() {
    const next = G.walkStep(G.map, visits, position);
    if (!next) { pauseWalk(); status('walk-status', 'Nincs szabad szomszédos mező. A séta megállt.'); return false; }
    position = next; walkSteps++; renderWalk();
    if (!walkCompleted && visits.flat().filter(n => n > 0).length === openCells) {
      walkCompleted = true;
      pauseWalk();
      status('walk-status', 'Minden szabad mezőt felfedeztél! A sétát folytathatod.', 'success');
      $('walk-dialog').showModal();
      return false;
    }
    return true;
  }
  function scheduleWalk() {
    walkTimer = setTimeout(() => { if (stepWalk()) scheduleWalk(); }, Number($('walk-speed').value));
  }
  function resumeWalk() {
    if (walkTimer !== null) return;
    $('walk-start').textContent = 'Szüneteltetés Ⅱ';
    $('walk-step').disabled = true;
    status('walk-status', 'A bit felfedez. A sebességet menet közben is állíthatod.');
    scheduleWalk();
  }
  $('walk-dialog-continue').addEventListener('click', () => { $('walk-dialog').close(); resumeWalk(); });
  $('walk-dialog-close').addEventListener('click', () => $('walk-dialog').close());
  $('walk-dialog').addEventListener('click', event => { if (event.target === $('walk-dialog')) $('walk-dialog').close(); });
  $('walk-start').addEventListener('click', () => {
    if (walkTimer !== null) { pauseWalk(); status('walk-status', 'A séta szünetel. Folytathatod vagy léphetsz egyet.'); }
    else resumeWalk();
  });
  $('walk-speed').addEventListener('input', () => { if (walkTimer !== null) { clearTimeout(walkTimer); scheduleWalk(); } });
  $('walk-step').addEventListener('click', () => { if (stepWalk()) status('walk-status', 'Egy lépéssel tovább. Folytasd tetszőleges tempóban.'); });
  function resetWalk() {
    if ($('walk-dialog').open) $('walk-dialog').close();
    walkCompleted = false;
    walkSteps = 0; pauseWalk(); position = G.walkStart ? [...G.walkStart] : [0, 0];
    visits = G.map.map(row => Array(row.length).fill(0)); visits[position[1]][position[0]] = 1;
    renderWalk(); status('walk-status', 'A kiindulómező már 1 látogatásnak számít.');
  }
  $('walk-reset').addEventListener('click', resetWalk); resetWalk();

  let bomb;
  function showBombResult(success) {
    $('bomb-dialog-title').textContent = success ? 'A bomba hatástalanítva!' : 'Rossz sorrend!';
    $('bomb-dialog-text').textContent = $('bomb-status').textContent;
    if (!$('bomb-dialog').open) $('bomb-dialog').showModal();
  }
  function renderBomb(wrong = null) {
    $('wire-board').replaceChildren();
    bomb.wires.forEach((colorId, i) => {
      const color = G.colors[colorId], cut = bomb.cut.includes(i);
      const button = document.createElement('button');
      button.className = 'wire-button' + (cut ? ' cut' : '') + (wrong === i ? ' wrong' : '');
      button.style.setProperty('--wire', color.hex); button.disabled = bomb.over || cut;
      button.setAttribute('aria-label', `${i + 1}. vezeték, ${color.name}${cut ? ', elvágva' : ', elvágás'}`);
      button.innerHTML = `<b>${i + 1}</b><span class="wire" aria-hidden="true"></span><span>${cut ? '✓' : color.name}</span>`;
      button.addEventListener('click', () => {
        const expected = G.wireOrder(bomb.wires)[bomb.cut.length];
        const result = G.cutWire(bomb, i); if (result === null) return;
        renderBomb(result ? null : i);
        if (!result) {
          status('bomb-status', `Rossz sorrend! A próbálkozás véget ért. A(z) ${expected + 1}. (${G.colors[bomb.wires[expected]].name}) vezetékkel kellett volna folytatni.`, 'error');
          $('bomb-light').textContent = '● SIKERTELEN';
          showBombResult(false);
        } else if (bomb.over) {
          status('bomb-status', 'Kiváló munka, Carl! Minden vezetéket jó sorrendben vágtál el. A bomba hatástalanítva!', 'success');
          $('bomb-light').textContent = '● HATÁSTALAN';
          showBombResult(true);
        } else status('bomb-status', 'Jó vágás! Válaszd ki a következő vezetéket.');
      });
      $('wire-board').append(button);
    });
    $('bomb-progress').textContent = `${bomb.cut.length} / ${bomb.wires.length} elvágva`;
  }
  function startBomb() {
    if ($('bomb-dialog').open) $('bomb-dialog').close();
    bomb = { wires: Array.from({ length: Number($('wire-count').value) }, () => G.randomInt(0, 4)), cut: [], over: false };
    $('bomb-light').textContent = '● AKTÍV';
    renderBomb(); status('bomb-status', 'Vágd el a vezetékeket fordított betűrendben, azonos színnél balról jobbra.');
  }
  $('bomb-dialog-new').addEventListener('click', startBomb);
  $('bomb-dialog-close').addEventListener('click', () => $('bomb-dialog').close());
  $('bomb-dialog').addEventListener('click', event => { if (event.target === $('bomb-dialog')) $('bomb-dialog').close(); });
  $('bomb-start').addEventListener('click', startBomb); startBomb();

  let memory = null, memoryFrame = null, memoryNodes = [], memoryStarted = 0;
  function updateTime() {
    $('memory-time').textContent = elapsed(performance.now() - memoryStarted);
    memoryFrame = requestAnimationFrame(updateTime);
  }
  function stopMemoryTime() { cancelAnimationFrame(memoryFrame); memoryFrame = null; }
  function finishMemory(success, wrong = null) {
    stopMemoryTime(); memory.over = true;
    const time = elapsed(performance.now() - memoryStarted);
    $('memory-time').textContent = time;
    memoryNodes.forEach((node, i) => {
      node.disabled = true;
      node.textContent = i + 1 < memory.next ? '✓' : i + 1;
      if (i + 1 === wrong) node.classList.add('wrong');
      if (!success && i + 1 === memory.next) node.classList.add('missed');
    });
    $('memory-next').textContent = success ? 'Hibátlan sorrend!' : 'Próbáld újra!';
    status('memory-status', success ? `Szép munka! Mind a(z) ${memory.count} kört megtaláltad. Időd: ${time}.` : `A sorrend megszakadt. A(z) ${memory.next}. számot kellett volna választani.`, success ? 'success' : 'error');
    $('memory-start').textContent = 'Új próba ↗';
    $('memory-dialog-title').textContent = success ? 'Hibátlan sorrend!' : 'Most nem sikerült!';
    $('memory-dialog-text').textContent = success ? `Időd: ${time}` : `A(z) ${memory.next}. számot kellett volna választani.`;
    if (!$('memory-dialog').open) $('memory-dialog').showModal();
  }
  function pickMemory(number) {
    if (!memory || memory.over) return;
    const result = G.memoryPick(memory, number);
    if (result === null) return;
    if (!result) { finishMemory(false, number); return; }
    memoryNodes.forEach((node, i) => {
      const done = i + 1 < memory.next;
      node.textContent = done ? '✓' : '';
      node.classList.toggle('done', done); node.disabled = done;
      node.setAttribute('aria-label', done ? 'Megtalált kör' : 'Rejtett kör');
    });
    if (memory.over) finishMemory(true);
    else {
      $('memory-next').textContent = `Következő: ${memory.next}`;
      status('memory-status', `A számok rejtve vannak. Keresd meg a(z) ${memory.next}. szám helyét!`);
    }
  }
  function startMemory() {
    if ($('memory-dialog').open) $('memory-dialog').close();
    stopMemoryTime();
    const count = Number($('memory-count').value);
    memory = { count, next: 1, over: false, hidden: false };
    $('memory-board').replaceChildren();
    memoryNodes = G.memoryLayout(count).map(circle => {
      const node = document.createElement('button'); node.className = 'memory-circle'; node.textContent = circle.number;
      node.style.left = (circle.x / 600 * 100) + '%'; node.style.top = (circle.y / 390 * 100) + '%';
      node.setAttribute('aria-label', circle.number + '. szám');
      node.addEventListener('click', () => pickMemory(circle.number));
      $('memory-board').append(node); return node;
    });
    $('memory-next').textContent = 'Következő: 1';
    status('memory-status', 'Jegyezd meg a helyeket! Az 1-esre kattintva eltűnnek a számok.');
    $('memory-start').textContent = 'Újrakezdés ↗';
    memoryStarted = performance.now(); updateTime();
  }
  $('memory-dialog-new').addEventListener('click', startMemory);
  $('memory-dialog-close').addEventListener('click', () => $('memory-dialog').close());
  $('memory-dialog').addEventListener('click', event => { if (event.target === $('memory-dialog')) $('memory-dialog').close(); });
  $('memory-start').addEventListener('click', startMemory);

  let currentView = 'home';
  function navigate() {
    const hash = location.hash.slice(1);
    const target = ['prime', 'chairs', 'cards', 'walk', 'bomb', 'memory'].includes(hash) ? hash : 'home';
    if (currentView !== target) {
      if (currentView === 'cards') cancelCards();
      if (currentView === 'walk' && walkTimer !== null) { pauseWalk(); status('walk-status', 'A séta szünetel. Folytasd, amikor szeretnéd.'); }
      if (currentView === 'memory' && memory && !memory.over) {
        stopMemoryTime(); memory.over = true;
        memoryNodes.forEach(node => { node.disabled = true; });
        status('memory-status', 'A próba megszakadt. Indíts új játékot.');
      }
    }
    if ($('chair-dialog').open) $('chair-dialog').close();
    if ($('card-dialog').open) $('card-dialog').close();
    if ($('walk-dialog').open) $('walk-dialog').close();
    if ($('bomb-dialog').open) $('bomb-dialog').close();
    if ($('memory-dialog').open) $('memory-dialog').close();
    document.querySelectorAll('.view').forEach(section => { section.hidden = section.id !== target; });
    currentView = target;
    const title = target === 'home' ? 'Online műhely' : $(target).querySelector('h1').textContent;
    document.title = title + ' · Bitfaragó';
    if (hash === 'challenges') $('challenges').scrollIntoView();
    else window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', navigate);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) return;
    if (walkTimer !== null) { pauseWalk(); status('walk-status', 'A séta szünetel. A folytatáshoz nyomd meg a gombot.'); }
    if (cardPhase === 'preview' || cardPhase === 'shuffle') cancelCards();
  });
  navigate();
})();
