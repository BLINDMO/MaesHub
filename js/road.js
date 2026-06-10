/* ============ Game 2: Road Hopper ============
 * Crossy-Road-style lane hopper, tuned to be gentle for little hands:
 * tap (or up arrow) to hop forward, tap the left/right edges to sidestep.
 * Pick your character first — chicken, bunny, duck or kitty.
 */
const Road = (() => {
  const COLS = 9;
  const CARS = ['🚗', '🚕', '🚙', '🚓', '🚌', '🚜', '🛻'];
  const FLOWERS = ['🌼', '🌷', '🌸', '🍄', '🌻'];
  const BEST_KEY = 'maeshub.road.best';

  let canvas, ctx, dpr = 1;
  let cell = 60;
  let rows = new Map(); // rowIndex -> { type, dir, speed, cars: [{x, emoji}] }
  let player = null;
  let cameraY = 0;
  let running = false;
  let rafId = null;
  let lastTime = 0;
  let score = 0;
  let character = '🐔';

  function init() {
    canvas = document.getElementById('road-canvas');
    ctx = canvas.getContext('2d');

    document.querySelectorAll('.char-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        Sound.fanfare();
        character = btn.dataset.char;
        document.getElementById('road-char-overlay').classList.add('hidden');
        newRun();
      });
    });
    document.getElementById('road-retry').addEventListener('click', () => {
      Sound.click();
      document.getElementById('road-over-overlay').classList.add('hidden');
      newRun();
    });
    document.getElementById('road-newchar').addEventListener('click', () => {
      Sound.click();
      document.getElementById('road-over-overlay').classList.add('hidden');
      document.getElementById('road-char-overlay').classList.remove('hidden');
    });

    canvas.addEventListener('pointerdown', (e) => {
      if (!running) return;
      const x = e.clientX;
      if (x < innerWidth * 0.22) hop(-1, 0);
      else if (x > innerWidth * 0.78) hop(1, 0);
      else hop(0, 1);
    });
    window.addEventListener('keydown', (e) => {
      if (!running || !document.getElementById('screen-road').classList.contains('active')) return;
      if (e.key === 'ArrowUp') hop(0, 1);
      else if (e.key === 'ArrowLeft') hop(-1, 0);
      else if (e.key === 'ArrowRight') hop(1, 0);
      else if (e.key === 'ArrowDown') hop(0, -1);
    });

    document.getElementById('road-best').textContent = localStorage.getItem(BEST_KEY) || 0;
  }

  function start() {
    resize();
    document.getElementById('road-char-overlay').classList.remove('hidden');
    document.getElementById('road-over-overlay').classList.add('hidden');
  }

  function stop() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cell = Math.max(46, Math.min(76, innerWidth / COLS));
  }

  function newRun() {
    resize();
    rows = new Map();
    score = 0;
    player = { col: Math.floor(COLS / 2), row: 0, hop: null };
    cameraY = rowWorldY(0);
    updateScore();
    ensureRows();
    running = true;
    lastTime = performance.now();
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(loop);
  }

  /* ----- world generation ----- */
  function rowWorldY(row) { return -row * cell; }

  function ensureRows() {
    const need = player.row + Math.ceil(innerHeight / cell) + 4;
    let r = 0;
    while (rows.size > 0 && rows.has(r)) r++;
    for (; r <= need; r++) {
      if (r <= 2) { rows.set(r, { type: 'grass' }); continue; }
      const prev = rows.get(r - 1);
      const prev2 = rows.get(r - 2);
      let roadChance = 0.55;
      if (prev && prev.type === 'road' && prev2 && prev2.type === 'road') roadChance = 0.35; // cap road runs
      if (prev && prev.type === 'grass' && prev2 && prev2.type === 'grass') roadChance = 0.8;
      if (Math.random() < roadChance) rows.set(r, makeRoadRow(r));
      else rows.set(r, { type: 'grass' });
    }
  }

  function makeRoadRow(r) {
    const dir = Math.random() < 0.5 ? -1 : 1;
    // Slowly raise difficulty with distance, but keep it toddler-friendly.
    const speed = (0.9 + Math.random() * 0.8 + Math.min(r / 80, 0.8)) * cell;
    const emoji = CARS[Math.floor(Math.random() * CARS.length)];
    const count = 2 + (Math.random() < 0.4 ? 1 : 0);
    const span = innerWidth + cell * 6;
    const cars = [];
    for (let i = 0; i < count; i++) {
      cars.push({ x: (span / count) * i + Math.random() * cell * 2, emoji });
    }
    return { type: 'road', dir, speed, cars, span };
  }

  /* ----- input ----- */
  function hop(dx, dy) {
    if (player.hop && player.hop.t < 0.7) return; // ignore frantic mashing mid-hop
    const nc = player.col + dx;
    const nr = player.row + dy;
    if (nc < 0 || nc >= COLS || nr < 0) return;
    Sound.hop();
    player.hop = {
      fromCol: player.col, fromRow: player.row,
      toCol: nc, toRow: nr, t: 0,
    };
    player.col = nc;
    player.row = nr;
    if (nr > score) { score = nr; updateScore(); }
    ensureRows();
  }

  function updateScore() {
    document.getElementById('road-score').textContent = score;
    const best = Number(localStorage.getItem(BEST_KEY) || 0);
    if (score > best) localStorage.setItem(BEST_KEY, score);
    document.getElementById('road-best').textContent = Math.max(best, score);
  }

  /* ----- game loop ----- */
  function loop(now) {
    if (!running) return;
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    update(dt);
    draw();
    rafId = requestAnimationFrame(loop);
  }

  function update(dt) {
    if (player.hop) {
      player.hop.t += dt / 0.16;
      if (player.hop.t >= 1) player.hop = null;
    }
    for (const row of rows.values()) {
      if (row.type !== 'road') continue;
      for (const car of row.cars) {
        car.x += row.dir * row.speed * dt;
        const margin = cell * 3;
        if (row.dir > 0 && car.x > innerWidth + margin) car.x = -margin - Math.random() * cell * 2;
        if (row.dir < 0 && car.x < -margin) car.x = innerWidth + margin + Math.random() * cell * 2;
      }
    }
    // camera eases toward keeping the player in the lower third
    const targetCam = rowWorldY(player.row);
    cameraY += (targetCam - cameraY) * Math.min(1, dt * 6);
    checkCollision();
  }

  function playerScreenPos() {
    let col = player.col, row = player.row, lift = 0;
    if (player.hop) {
      const t = Math.min(player.hop.t, 1);
      col = player.hop.fromCol + (player.hop.toCol - player.hop.fromCol) * t;
      row = player.hop.fromRow + (player.hop.toRow - player.hop.fromRow) * t;
      lift = Math.sin(t * Math.PI) * cell * 0.35;
    }
    const x = (col + 0.5) * (innerWidth / COLS);
    const y = rowWorldY(row) - cameraY + innerHeight * 0.68 - lift;
    return { x, y };
  }

  function rowScreenY(r) {
    return rowWorldY(r) - cameraY + innerHeight * 0.68;
  }

  function checkCollision() {
    if (player.hop && player.hop.t < 0.5) return; // safe while mid-air
    const row = rows.get(player.row);
    if (!row || row.type !== 'road') return;
    const px = (player.col + 0.5) * (innerWidth / COLS);
    for (const car of row.cars) {
      // forgiving hitbox: cars are drawn ~1.5 cells wide, we test ~1.0
      if (Math.abs(car.x - px) < cell * 0.78) return gameOver();
    }
  }

  function gameOver() {
    running = false;
    Sound.bonk();
    const overlay = document.getElementById('road-over-overlay');
    document.getElementById('road-over-score').textContent =
      `${character} hopped ${score} ${score === 1 ? 'step' : 'steps'}! 🏅 Best: ${localStorage.getItem(BEST_KEY) || score}`;
    overlay.classList.remove('hidden');
    if (score >= Number(localStorage.getItem(BEST_KEY) || 0)) throwConfetti(80);
  }

  /* ----- drawing ----- */
  function seeded(n) {
    const s = Math.sin(n * 127.1) * 43758.5453;
    return s - Math.floor(s);
  }

  function draw() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    const firstRow = Math.floor((rowWorldY(0) - cameraY + innerHeight * 0.68 - innerHeight) / cell) - 2;
    const topRow = Math.ceil(player.row + innerHeight / cell) + 2;

    for (let r = Math.max(0, -firstRow - 100); r <= topRow; r++) {
      const row = rows.get(r);
      if (!row) continue;
      const y = rowScreenY(r);
      if (y < -cell * 2 || y > innerHeight + cell * 2) continue;

      if (row.type === 'grass') {
        ctx.fillStyle = r % 2 === 0 ? '#8fd97a' : '#7ccb67';
        ctx.fillRect(0, y - cell, innerWidth, cell + 1);
        // sprinkle deterministic flowers so they don't flicker between frames
        ctx.font = `${cell * 0.42}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (let i = 0; i < 3; i++) {
          const fx = seeded(r * 13 + i * 7);
          if (fx < 0.55) {
            const fl = FLOWERS[Math.floor(seeded(r * 31 + i) * FLOWERS.length)];
            ctx.fillText(fl, fx * innerWidth + i * (innerWidth / 3), y - cell * 0.5);
          }
        }
      } else {
        ctx.fillStyle = '#4a4a58';
        ctx.fillRect(0, y - cell, innerWidth, cell + 1);
        const below = rows.get(r - 1);
        if (below && below.type === 'road') {
          ctx.strokeStyle = 'rgba(255,255,255,0.7)';
          ctx.lineWidth = 4;
          ctx.setLineDash([cell * 0.45, cell * 0.4]);
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(innerWidth, y);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
    }

    // cars
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const [r, row] of rows) {
      if (row.type !== 'road') continue;
      const y = rowScreenY(r) - cell * 0.5;
      if (y < -cell || y > innerHeight + cell) continue;
      ctx.font = `${cell * 1.05}px serif`;
      for (const car of row.cars) {
        ctx.save();
        ctx.translate(car.x, y);
        if (row.dir > 0) ctx.scale(-1, 1); // car emojis face left by default
        ctx.fillText(car.emoji, 0, 0);
        ctx.restore();
      }
    }

    // player (with a soft shadow)
    const p = playerScreenPos();
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath();
    ctx.ellipse(p.x, rowScreenY(player.hop ? player.hop.toRow : player.row) - cell * 0.18, cell * 0.32, cell * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = `${cell * 0.85}px serif`;
    ctx.fillText(character, p.x, p.y - cell * 0.5);
  }

  return { init, start, stop };
})();
