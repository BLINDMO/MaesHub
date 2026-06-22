/* ============ Wobbly Bridge ============
 * Top-down stepping-stone crossing. A 5-wide x 10-deep grid of wooden
 * rafts floats on the river. Each row has exactly 2 CRACKED rafts that
 * give way — the other 3 are safe. Hop up one row at a time, looking
 * closely to pick a solid raft; step on a cracked one and the pup
 * splashes into the water. The camera scrolls up as the pup climbs.
 * Reach the far bank to move on to a fresh crossing.
 */
const Bridge = (() => {
  const BEST_KEY = 'maeshub.bridge.bestlevel';
  const COLS = 5, ROWS = 10, LOOSE_PER_ROW = 2;

  let area, board, pupEl, riverEl;
  let level = 1;
  let pup = null;
  let rows = [];           // rows[i] = [{el, loose, x, y}]
  let finishPad = null;
  let startY = 0, boardH = 0;
  let currentRow = -1;     // -1 = start bank
  let busy = false;
  let playing = false;
  let timers = [];

  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }

  function init() {
    area = document.getElementById('bridge-area');
    board = document.getElementById('bridge-board');
    riverEl = document.getElementById('bridge-river');
    pupEl = document.getElementById('bridge-pup');

    const row = document.getElementById('bridge-char-row');
    Chars.PUPS.forEach((p) => {
      const btn = document.createElement('button');
      btn.className = 'char-btn';
      btn.innerHTML = p.svg;
      btn.title = p.name;
      btn.addEventListener('click', () => {
        Sound.fanfare();
        pup = p;
        document.getElementById('bridge-start-overlay').classList.add('hidden');
        newRun();
      });
      row.appendChild(btn);
    });

    document.getElementById('bridge-retry').addEventListener('click', () => {
      Sound.click();
      document.getElementById('bridge-fall-overlay').classList.add('hidden');
      newRun();
    });
    document.getElementById('bridge-next').addEventListener('click', () => {
      Sound.click();
      level++;
      document.getElementById('bridge-win-overlay').classList.add('hidden');
      newRun();
    });
    for (const [btnId, overlayId] of [['bridge-fall-newchar', 'bridge-fall-overlay'], ['bridge-win-newchar', 'bridge-win-overlay']]) {
      document.getElementById(btnId).addEventListener('click', () => {
        Sound.click();
        document.getElementById(overlayId).classList.add('hidden');
        document.getElementById('bridge-start-overlay').classList.remove('hidden');
      });
    }
  }

  function start() {
    level = 1;
    updateHud();
    document.getElementById('bridge-start-overlay').classList.remove('hidden');
    document.getElementById('bridge-fall-overlay').classList.add('hidden');
    document.getElementById('bridge-win-overlay').classList.add('hidden');
    board.innerHTML = '';
    pupEl.classList.add('hidden');
  }

  function stop() {
    playing = false;
    clearTimers();
  }

  function updateHud() {
    document.getElementById('bridge-level').textContent = level;
    const best = Number(localStorage.getItem(BEST_KEY) || 1);
    if (level > best) localStorage.setItem(BEST_KEY, level);
    document.getElementById('bridge-best').textContent = Math.max(best, level);
  }

  /* ----- build the crossing ----- */
  function newRun() {
    clearTimers();
    updateHud();
    board.innerHTML = '';
    rows = [];
    currentRow = -1;
    busy = false;
    playing = true;

    const W = area.clientWidth || 380;
    const side = Math.max(14, W * 0.05);
    const colSpace = (W - side * 2) / COLS;
    const tileW = Math.min(colSpace * 0.86, 92);
    const colX = (j) => side + colSpace * (j + 0.5);
    const rowSpace = Math.max(tileW * 1.18, 78);

    const finishY = 64;
    const rowY = (i) => finishY + rowSpace * (ROWS - i);  // row 9 nearest finish, row 0 nearest start
    startY = rowY(0) + rowSpace;
    boardH = startY + 80;

    board.style.height = boardH + 'px';

    // banks
    addPad(W / 2, finishY, '🏡', 'finish-pad');
    finishPad = { x: W / 2, y: finishY };
    addPad(W / 2, startY, '🌿', 'start-pad');

    // 10 rows x 5 rafts; exactly 2 cracked per row
    for (let i = 0; i < ROWS; i++) {
      const loose = pickTwo(COLS);
      const rowTiles = [];
      for (let j = 0; j < COLS; j++) {
        const x = colX(j), y = rowY(i);
        const isLoose = loose.includes(j);
        const tile = document.createElement('button');
        tile.className = 'bridge-tile' + (isLoose ? ' cracked' : '');
        tile.style.width = tileW + 'px';
        tile.style.height = (tileW * 0.82) + 'px';
        tile.style.left = x + 'px';
        tile.style.top = y + 'px';
        tile.innerHTML = isLoose ? crackMarks() : plankMarks();
        const info = { el: tile, loose: isLoose, x, y };
        tile.addEventListener('click', () => stepOn(i, info));
        board.appendChild(tile);
        rowTiles.push(info);
      }
      rows.push(rowTiles);
    }

    // pup waits on the start bank (inside the board so it scrolls with it)
    pupEl.innerHTML = pup.svg;
    pupEl.className = '';
    board.appendChild(pupEl);
    pupEl.style.width = Math.min(tileW * 0.8, 66) + 'px';
    movePup(W / 2, startY);
    pupEl.classList.remove('hidden');
    markNextRow();
    scrollTo(startY);
  }

  function pickTwo(n) {
    const a = Math.floor(Math.random() * n);
    let b = Math.floor(Math.random() * n);
    while (b === a) b = Math.floor(Math.random() * n);
    return [a, b];
  }

  // surface detail for a solid raft (top-down planks + rope binding)
  function plankMarks() {
    return `<span class="raft-grain"></span>`;
  }
  function crackMarks() {
    return `<span class="raft-grain"></span><span class="raft-crack"></span>`;
  }

  function addPad(x, y, decor, cls) {
    const pad = document.createElement('div');
    pad.className = 'bridge-pad ' + (cls || '');
    pad.style.left = x + 'px';
    pad.style.top = y + 'px';
    pad.textContent = decor;
    board.appendChild(pad);
    return pad;
  }

  function movePup(x, y) {
    pupEl.style.left = x + 'px';
    pupEl.style.top = y + 'px';
  }

  // scroll the board so the given board-y sits ~68% down the viewport
  function scrollTo(focusY) {
    const Hview = area.clientHeight || 600;
    let offset = Hview * 0.68 - focusY;
    offset = Math.min(0, Math.max(Hview - boardH, offset));
    board.style.transform = `translateY(${offset}px)`;
  }

  function markNextRow() {
    const nextIdx = currentRow + 1;
    rows.forEach((row, i) => row.forEach((p) =>
      p.el.classList.toggle('next', i === nextIdx && playing)));
    // after the last row, the finish bank lights up
    const fp = board.querySelector('.finish-pad');
    if (fp) fp.classList.toggle('next', nextIdx >= ROWS && playing);
  }

  /* ----- gameplay ----- */
  function stepOn(rowIndex, tile) {
    if (!playing || busy || rowIndex !== currentRow + 1) return;
    busy = true;
    Sound.hop();
    pupEl.classList.add('hopping');
    movePup(tile.x, tile.y);
    scrollTo(tile.y);

    later(() => {
      pupEl.classList.remove('hopping');
      if (tile.loose) return fall(tile);
      currentRow = rowIndex;
      busy = false;
      tile.el.classList.add('stood');
      if (currentRow === ROWS - 1) reachTheEnd();
      else markNextRow();
    }, 420);
  }

  function reachTheEnd() {
    busy = true;
    markNextRow();
    later(() => {
      Sound.hop();
      pupEl.classList.add('hopping');
      movePup(finishPad.x, finishPad.y);
      scrollTo(finishPad.y);
      later(() => {
        playing = false;
        Sound.fanfare();
        throwConfetti(150);
        updateHud();
        document.getElementById('bridge-win-text').textContent =
          `${pup.name} hopped all the way across — 10 rows without a splash! 🏡`;
        document.getElementById('bridge-win-overlay').classList.remove('hidden');
      }, 520);
    }, 220);
  }

  function fall(tile) {
    playing = false;
    markNextRow();
    tile.el.classList.add('gone');
    Sound.bonk();

    later(() => {
      pupEl.classList.add('falling');
      Sound.splash();
    }, 240);

    later(() => {
      for (let i = 0; i < 5; i++) {
        const s = document.createElement('span');
        s.className = 'river-splash';
        s.textContent = '💦';
        s.style.left = tile.x + (i - 2) * 22 + 'px';
        s.style.top = tile.y + 'px';
        s.style.animationDelay = i * 0.05 + 's';
        board.appendChild(s);
        setTimeout(() => s.remove(), 1200);
      }
    }, 600);

    later(() => {
      document.getElementById('bridge-fall-text').textContent =
        `Splash! That raft was cracked. ${pup.name} is okay — look for the cracked rafts and step around them!`;
      document.getElementById('bridge-fall-overlay').classList.remove('hidden');
    }, 1450);
  }

  return { init, start, stop };
})();
