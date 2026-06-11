/* ============ Wobbly Bridge ============
 * A rickety plank bridge climbs at 45° from the bottom-left riverbank to
 * the top-right one. Pick a pup, then tap the planks one at a time to
 * choose the path across. Loose planks (look for the cracks!) give way —
 * the plank tumbles and the pup splashes into the river below. Reach the
 * far bank to unlock a longer, trickier bridge.
 */
const Bridge = (() => {
  const BEST_KEY = 'maeshub.bridge.bestlevel';

  let area, board, pupEl, riverEl;
  let level = 1;
  let pup = null;
  let rows = [];          // rows[i] = [{el, loose, x, y}]
  let endPad = null;
  let currentRow = -1;    // -1 = start platform
  let busy = false;       // ignore taps while the pup is mid-hop
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

  /* ----- build the bridge ----- */
  function newRun() {
    clearTimers();
    updateHud();
    board.innerHTML = '';
    rows = [];
    currentRow = -1;
    busy = false;
    playing = true;

    const W = area.clientWidth || 900;
    const H = area.clientHeight || 600;
    const nRows = Math.min(5 + level, 9);
    const perRow = level >= 3 ? 3 : 2;

    // the bridge spans the whole river, corner to corner
    const startX = Math.max(90, W * 0.1);
    const startY = H - 96;
    const endX = W - Math.max(110, W * 0.12);
    const topY = 96;
    const dx = (endX - startX) / (nRows + 1);
    const dy = (startY - topY) / (nRows + 1);
    const pos = (i) => ({ x: startX + (i + 1) * dx, y: startY - (i + 1) * dy });

    // grassy banks at both ends
    addPad(startX, startY, '🌿');
    const end = pos(nRows);
    endPad = addPad(end.x, end.y, '🏡');

    // planks lie across the bridge's width, perpendicular to the crossing
    const len = Math.hypot(dx, dy);
    const perpX = dy / len, perpY = dx / len;
    const plankW = Math.max(72, Math.min(112, Math.min(dx, dy) * 1.6));
    const spacing = plankW * 0.62 + 18;
    for (let i = 0; i < nRows; i++) {
      const c = pos(i);
      const loose = Math.floor(Math.random() * perRow);
      const rowPlanks = [];
      for (let j = 0; j < perRow; j++) {
        const off = (j - (perRow - 1) / 2) * spacing;
        const x = c.x + perpX * off;
        const y = c.y + perpY * off;
        const plank = document.createElement('button');
        plank.className = 'plank' + (j === loose ? ' cracked' : '');
        plank.style.width = plankW + 'px';
        plank.style.left = x + 'px';
        plank.style.top = y + 'px';
        const info = { el: plank, loose: j === loose, x, y };
        plank.addEventListener('click', () => stepOn(i, info));
        board.appendChild(plank);
        rowPlanks.push(info);
      }
      rows.push(rowPlanks);
    }

    // pup waits on the starting bank
    pupEl.innerHTML = pup.svg;
    pupEl.className = '';
    movePup(startX, startY);
    pupEl.classList.remove('hidden');
    markNextRow();
  }

  function addPad(x, y, decor) {
    const pad = document.createElement('div');
    pad.className = 'bridge-pad';
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

  function markNextRow() {
    rows.forEach((row, i) => row.forEach((p) =>
      p.el.classList.toggle('next', i === currentRow + 1 && playing)));
  }

  /* ----- gameplay ----- */
  function stepOn(rowIndex, plank) {
    if (!playing || busy || rowIndex !== currentRow + 1) return;
    busy = true;
    Sound.hop();
    pupEl.classList.add('hopping');
    movePup(plank.x, plank.y);

    later(() => {
      pupEl.classList.remove('hopping');
      if (plank.loose) return fall(plank);
      currentRow = rowIndex;
      busy = false;
      plank.el.classList.add('stood');
      if (currentRow === rows.length - 1) reachTheEnd();
      else markNextRow();
    }, 460);
  }

  function reachTheEnd() {
    busy = true;
    later(() => {
      Sound.hop();
      pupEl.classList.add('hopping');
      const x = parseFloat(endPad.style.left), y = parseFloat(endPad.style.top);
      movePup(x, y);
      later(() => {
        playing = false;
        Sound.fanfare();
        throwConfetti(140);
        updateHud();
        document.getElementById('bridge-win-text').textContent =
          `${pup.name} crossed the wobbly bridge on level ${level}! The next bridge is longer…`;
        document.getElementById('bridge-win-overlay').classList.remove('hidden');
      }, 500);
    }, 200);
  }

  function fall(plank) {
    playing = false;
    markNextRow();
    plank.el.classList.add('gone');
    Sound.bonk();

    later(() => {
      // the pup tumbles straight down into the water under the bridge
      pupEl.style.setProperty('--fall', '195px');
      pupEl.classList.add('falling');
      Sound.splash();
    }, 250);

    later(() => {
      for (let i = 0; i < 4; i++) {
        const s = document.createElement('span');
        s.className = 'river-splash';
        s.textContent = '💦';
        s.style.left = plank.x + (i - 1.5) * 26 + 'px';
        s.style.top = plank.y + 165 + 'px';
        s.style.animationDelay = i * 0.06 + 's';
        board.appendChild(s);
        setTimeout(() => s.remove(), 1200);
      }
    }, 750);

    later(() => {
      document.getElementById('bridge-fall-text').textContent =
        `Splash! That plank was loose! ${pup.name} is okay — look for the cracks next time!`;
      document.getElementById('bridge-fall-overlay').classList.remove('hidden');
    }, 1500);
  }

  return { init, start, stop };
})();
