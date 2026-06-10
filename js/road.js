/* ============ Game 2: Road Hopper ============
 * A structured course: hop from the START line at the bottom to the
 * checkered FINISH line at the top. The whole course fits on screen,
 * lanes alternate direction with evenly spaced cars, and each finished
 * crossing unlocks a slightly busier level.
 */
const Road = (() => {
  const COLS = 9;
  const ROWS = 13;             // row 0 = start, row 12 = finish
  const FINISH_ROW = ROWS - 1;
  const CARS = ['🚗', '🚕', '🚙', '🚓', '🚌', '🚜', '🛻'];
  const FLOWERS = ['🌼', '🌷', '🌸', '🌻'];
  const BEST_KEY = 'maeshub.road.bestlevel';

  // tidy lane layouts: which rows are roads, by difficulty tier
  const LAYOUTS = [
    [3, 5, 7, 9],                  // level 1: four single roads
    [2, 4, 6, 8, 10],              // level 2: five single roads
    [2, 3, 5, 7, 9, 10],           // level 3: two pairs + singles
    [2, 3, 5, 6, 8, 9, 11],        // level 4+: three pairs + one
  ];

  let canvas, ctx;
  let cell = 50, boardX = 0, boardY = 0;
  let lanes = [];   // {row, dir, speed, emoji, cars:[x], span}
  let player = null;
  let level = 1;
  let character = '🐔';
  let running = false, rafId = null, lastTime = 0;

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
    document.getElementById('road-next').addEventListener('click', () => {
      Sound.click();
      level++;
      document.getElementById('road-win-overlay').classList.add('hidden');
      newRun();
    });
    for (const [btnId, overlayId] of [['road-newchar', 'road-over-overlay'], ['road-win-newchar', 'road-win-overlay']]) {
      document.getElementById(btnId).addEventListener('click', () => {
        Sound.click();
        document.getElementById(overlayId).classList.add('hidden');
        document.getElementById('road-char-overlay').classList.remove('hidden');
      });
    }

    canvas.addEventListener('pointerdown', (e) => {
      if (!running) return;
      const x = e.clientX;
      if (x < innerWidth * 0.25) hop(-1, 0);
      else if (x > innerWidth * 0.75) hop(1, 0);
      else hop(0, 1);
    });
    window.addEventListener('keydown', (e) => {
      if (!running || !document.getElementById('screen-road').classList.contains('active')) return;
      if (e.key === 'ArrowUp') hop(0, 1);
      else if (e.key === 'ArrowLeft') hop(-1, 0);
      else if (e.key === 'ArrowRight') hop(1, 0);
      else if (e.key === 'ArrowDown') hop(0, -1);
    });

    document.getElementById('road-best').textContent = localStorage.getItem(BEST_KEY) || 1;
  }

  function start() {
    resize();
    level = 1;
    updateHud();
    document.getElementById('road-char-overlay').classList.remove('hidden');
    document.getElementById('road-over-overlay').classList.add('hidden');
    document.getElementById('road-win-overlay').classList.add('hidden');
  }

  function stop() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  }

  function resize() {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    const headerH = 80, footerH = 50;
    cell = Math.min(innerWidth / COLS, (innerHeight - headerH - footerH) / ROWS);
    boardX = (innerWidth - COLS * cell) / 2;
    boardY = headerH + (innerHeight - headerH - footerH - ROWS * cell) / 2;
  }

  function newRun() {
    resize();
    updateHud();
    const layout = LAYOUTS[Math.min(level - 1, LAYOUTS.length - 1)];
    const boardW = COLS * cell;
    const speed = cell * (0.85 + 0.12 * Math.min(level - 1, 8));
    const carCount = level >= 3 ? 3 : 2;
    lanes = layout.map((row, i) => {
      const span = boardW + cell * 4;
      return {
        row,
        dir: i % 2 === 0 ? 1 : -1,                 // alternating, predictable
        speed: speed * (i % 2 === 0 ? 1 : 0.85),   // two calm tempos, no chaos
        emoji: CARS[(level + i) % CARS.length],
        span,
        cars: Array.from({ length: carCount }, (_, k) => (span / carCount) * k),
      };
    });
    player = { col: Math.floor(COLS / 2), row: 0, hop: null };
    running = true;
    lastTime = performance.now();
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(loop);
  }

  function updateHud() {
    document.getElementById('road-level').textContent = level;
    const best = Number(localStorage.getItem(BEST_KEY) || 1);
    if (level > best) localStorage.setItem(BEST_KEY, level);
    document.getElementById('road-best').textContent = Math.max(best, level);
  }

  /* ----- input ----- */
  function hop(dx, dy) {
    if (player.hop && player.hop.t < 0.7) return;
    const nc = player.col + dx;
    const nr = player.row + dy;
    if (nc < 0 || nc >= COLS || nr < 0 || nr > FINISH_ROW) return;
    Sound.hop();
    player.hop = { fromCol: player.col, fromRow: player.row, toCol: nc, toRow: nr, t: 0 };
    player.col = nc;
    player.row = nr;
  }

  /* ----- loop ----- */
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
      if (player.hop.t >= 1) {
        player.hop = null;
        if (player.row === FINISH_ROW) return win();
      }
    }
    for (const lane of lanes) {
      for (let i = 0; i < lane.cars.length; i++) {
        lane.cars[i] = (lane.cars[i] + lane.dir * lane.speed * dt + lane.span) % lane.span;
      }
    }
    checkCollision();
  }

  function carScreenX(lane, t) {
    return boardX - cell * 2 + t;
  }

  function checkCollision() {
    if (player.hop && player.hop.t < 0.5) return;
    const lane = lanes.find((l) => l.row === player.row);
    if (!lane) return;
    const px = boardX + (player.col + 0.5) * cell;
    for (const t of lane.cars) {
      if (Math.abs(carScreenX(lane, t) - px) < cell * 0.75) return gameOver();
    }
  }

  function win() {
    running = false;
    Sound.fanfare();
    throwConfetti(140);
    updateHud();
    document.getElementById('road-win-text').textContent =
      `${character} finished level ${level}! Ready for level ${level + 1}?`;
    document.getElementById('road-win-overlay').classList.remove('hidden');
  }

  function gameOver() {
    running = false;
    Sound.bonk();
    document.getElementById('road-over-score').textContent =
      `${character} almost made it across level ${level}!`;
    document.getElementById('road-over-overlay').classList.remove('hidden');
  }

  /* ----- drawing ----- */
  function seeded(n) {
    const s = Math.sin(n * 127.1) * 43758.5453;
    return s - Math.floor(s);
  }

  function rowY(r) { return boardY + (ROWS - 1 - r) * cell; } // row 0 at the bottom

  function draw() {
    const w = canvas.width, h = canvas.height;
    ctx.fillStyle = '#6fbf63';
    ctx.fillRect(0, 0, w, h);

    const isRoad = (r) => lanes.some((l) => l.row === r);
    const boardW = COLS * cell;

    // board panel with a soft border
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.fillRect(boardX - 8, boardY - 8, boardW + 16, ROWS * cell + 16);

    for (let r = 0; r < ROWS; r++) {
      const y = rowY(r);
      if (r === FINISH_ROW) {
        drawFinishRow(y, boardW);
      } else if (isRoad(r)) {
        ctx.fillStyle = '#4a4a58';
        ctx.fillRect(boardX, y, boardW, cell + 1);
        if (isRoad(r + 1) && r + 1 !== FINISH_ROW) {
          ctx.strokeStyle = 'rgba(255,255,255,0.7)';
          ctx.lineWidth = 4;
          ctx.setLineDash([cell * 0.45, cell * 0.4]);
          ctx.beginPath();
          ctx.moveTo(boardX, y);
          ctx.lineTo(boardX + boardW, y);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      } else {
        ctx.fillStyle = r % 2 === 0 ? '#8fd97a' : '#84d36e';
        ctx.fillRect(boardX, y, boardW, cell + 1);
        ctx.font = `${cell * 0.4}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (let i = 0; i < 2; i++) {
          if (seeded(r * 13 + i * 7) < 0.6) {
            const fl = FLOWERS[Math.floor(seeded(r * 31 + i) * FLOWERS.length)];
            const fx = boardX + (0.5 + Math.floor(seeded(r * 53 + i * 17) * COLS)) * cell;
            ctx.fillText(fl, fx, y + cell * 0.5);
          }
        }
        if (r === 0) drawStartLine(y, boardW);
      }
    }

    // cars (clipped to the board so they enter/exit cleanly)
    ctx.save();
    ctx.beginPath();
    ctx.rect(boardX, boardY, boardW, ROWS * cell);
    ctx.clip();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${cell * 1.0}px serif`;
    for (const lane of lanes) {
      const y = rowY(lane.row) + cell * 0.5;
      for (const t of lane.cars) {
        const x = carScreenX(lane, t);
        ctx.save();
        ctx.translate(x, y);
        if (lane.dir > 0) ctx.scale(-1, 1); // car emojis face left by default
        ctx.fillText(lane.emoji, 0, 0);
        ctx.restore();
      }
    }
    ctx.restore();

    // player
    let col = player.col, row = player.row, lift = 0;
    if (player.hop) {
      const t = Math.min(player.hop.t, 1);
      col = player.hop.fromCol + (player.hop.toCol - player.hop.fromCol) * t;
      row = player.hop.fromRow + (player.hop.toRow - player.hop.fromRow) * t;
      lift = Math.sin(t * Math.PI) * cell * 0.35;
    }
    const px = boardX + (col + 0.5) * cell;
    const py = rowY(row) + cell * 0.5;
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath();
    ctx.ellipse(px, py + cell * 0.32, cell * 0.3, cell * 0.09, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = `${cell * 0.82}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(character, px, py - lift);
  }

  function drawStartLine(y, boardW) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(boardX, y + cell - 8, boardW, 6);
    ctx.font = `700 ${cell * 0.42}px Fredoka, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#2c6e1f';
    ctx.fillText('S T A R T', boardX + boardW / 2, y + cell * 0.38);
  }

  function drawFinishRow(y, boardW) {
    const sq = cell / 3;
    for (let row = 0; row < 3; row++) {
      for (let i = 0; i * sq < boardW; i++) {
        ctx.fillStyle = (i + row) % 2 === 0 ? '#ffffff' : '#3a3a44';
        ctx.fillRect(boardX + i * sq, y + row * sq, Math.min(sq, boardW - i * sq), sq + 0.5);
      }
    }
    ctx.font = `${cell * 0.7}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🏁', boardX + boardW * 0.12, y + cell * 0.5);
    ctx.fillText('🏁', boardX + boardW * 0.88, y + cell * 0.5);
  }

  return { init, start, stop };
})();
