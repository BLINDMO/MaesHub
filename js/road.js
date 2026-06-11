/* ============ Game 2: Road Hopper ============
 * Classic frogger-style course: a START line, 10 lanes of traffic, a
 * flowery rest meadow, 10 more lanes, then the checkered FINISH line.
 * The course is fixed (never infinite) and the camera scrolls gently as
 * you hop. Play as one of five cartoon pups.
 */
const Road = (() => {
  const COLS = 9;
  const LANES_PER_HALF = 10;
  // row map: 0 start | 1-10 roads | 11 rest meadow | 12-21 roads | 22 finish
  const REST_ROW = LANES_PER_HALF + 1;
  const FINISH_ROW = LANES_PER_HALF * 2 + 2;
  const ROWS = FINISH_ROW + 1;
  const CARS = ['🚗', '🚕', '🚙', '🚓', '🚌', '🚜', '🛻'];
  const FLOWERS = ['🌼', '🌷', '🌸', '🌻'];
  const BEST_KEY = 'maeshub.road.bestlevel';

  let canvas, ctx;
  let cell = 50, boardX = 0, topY = 0, viewH = 0;
  let lanes = [];
  let player = null;
  let cameraRow = 0;
  let level = 1;
  let pup = null; // {svg, img, name}
  let running = false, rafId = null, lastTime = 0;

  function isRoad(r) { return r > 0 && r < FINISH_ROW && r !== REST_ROW; }

  function init() {
    canvas = document.getElementById('road-canvas');
    ctx = canvas.getContext('2d');

    const row = document.getElementById('road-char-row');
    Chars.PUPS.forEach((p) => {
      const btn = document.createElement('button');
      btn.className = 'char-btn';
      btn.innerHTML = p.svg;
      btn.title = p.name;
      btn.addEventListener('click', () => {
        Sound.fanfare();
        pup = { ...p, img: Chars.toImage(p.svg) };
        document.getElementById('road-char-overlay').classList.add('hidden');
        newRun();
      });
      row.appendChild(btn);
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
    cell = Math.max(44, Math.min(78, innerWidth / COLS));
    boardX = (innerWidth - COLS * cell) / 2;
    topY = 74;            // below the header
    viewH = innerHeight - topY - 44;
  }

  function visibleRows() { return viewH / cell; }

  function newRun() {
    resize();
    updateHud();
    // gentle speeds: a 4-year-old needs time to plan ten lanes in a row
    const base = cell * (0.55 + 0.09 * Math.min(level - 1, 8));
    const carCount = level >= 4 ? 3 : 2;
    lanes = [];
    let i = 0;
    for (let r = 1; r < FINISH_ROW; r++) {
      if (!isRoad(r)) continue;
      const span = COLS * cell + cell * 5;
      lanes.push({
        row: r,
        dir: i % 2 === 0 ? 1 : -1,
        speed: base * (i % 3 === 0 ? 1.15 : i % 3 === 1 ? 0.85 : 1),
        emoji: CARS[(level + i) % CARS.length],
        span,
        cars: Array.from({ length: carCount }, (_, k) => (span / carCount) * k + (i % 2) * cell),
      });
      i++;
    }
    player = { col: Math.floor(COLS / 2), row: 0, hop: null };
    cameraRow = 0;
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
        if (player.row === REST_ROW) Sound.sparkle(); // made it to the meadow!
      }
    }
    for (const lane of lanes) {
      for (let i = 0; i < lane.cars.length; i++) {
        lane.cars[i] = (lane.cars[i] + lane.dir * lane.speed * dt + lane.span) % lane.span;
      }
    }
    // camera keeps the pup about a third of the way up the view
    const target = Math.max(0, Math.min(player.row - visibleRows() * 0.35, ROWS - visibleRows()));
    cameraRow += (target - cameraRow) * Math.min(1, dt * 5);
    checkCollision();
  }

  function carScreenX(lane, t) { return boardX - cell * 2.5 + t; }

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
      `${pup.name} crossed all 20 lanes on level ${level}! Ready for level ${level + 1}?`;
    document.getElementById('road-win-overlay').classList.remove('hidden');
  }

  function gameOver() {
    running = false;
    Sound.bonk();
    const half = player.row > REST_ROW ? 'almost home' : 'on the way to the meadow';
    document.getElementById('road-over-score').textContent =
      `${pup.name} got bonked ${half} on level ${level}. Try again!`;
    document.getElementById('road-over-overlay').classList.remove('hidden');
  }

  /* ----- drawing ----- */
  function seeded(n) {
    const s = Math.sin(n * 127.1) * 43758.5453;
    return s - Math.floor(s);
  }

  // world: row 0 sits at the bottom; camera scrolls in row units
  function rowY(r) { return topY + viewH - (r - cameraRow + 1) * cell; }

  function draw() {
    const w = canvas.width, h = canvas.height;
    ctx.fillStyle = '#6fbf63';
    ctx.fillRect(0, 0, w, h);
    const boardW = COLS * cell;

    // soft side rails so the course reads as one track
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillRect(boardX - 8, 0, 8, h);
    ctx.fillRect(boardX + boardW, 0, 8, h);

    const lo = Math.max(0, Math.floor(cameraRow) - 1);
    const hi = Math.min(ROWS - 1, Math.ceil(cameraRow + visibleRows()) + 1);
    for (let r = lo; r <= hi; r++) {
      const y = rowY(r);
      if (r === FINISH_ROW) {
        drawFinishRow(y, boardW);
      } else if (isRoad(r)) {
        ctx.fillStyle = '#4a4a58';
        ctx.fillRect(boardX, y, boardW, cell + 1);
        if (isRoad(r + 1)) {
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
        ctx.fillStyle = r === REST_ROW ? '#a3e58c' : '#8fd97a';
        ctx.fillRect(boardX, y, boardW, cell + 1);
        ctx.font = `${cell * 0.42}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (r === REST_ROW) {
          // the flowery rest meadow halfway through
          for (let i = 0; i < COLS; i += 2) {
            const fl = FLOWERS[Math.floor(seeded(i * 31) * FLOWERS.length)];
            ctx.fillText(fl, boardX + (i + 0.5) * cell, y + cell * 0.5);
          }
          ctx.fillText('🦋', boardX + boardW * 0.7, y + cell * 0.3);
        } else if (r === 0) {
          drawStartLine(y, boardW);
        }
      }
    }

    // cars
    ctx.save();
    ctx.beginPath();
    ctx.rect(boardX, 0, boardW, h);
    ctx.clip();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${cell * 1.0}px serif`;
    for (const lane of lanes) {
      const y = rowY(lane.row) + cell * 0.5;
      if (y < -cell || y > h + cell) continue;
      for (const t of lane.cars) {
        const x = carScreenX(lane, t);
        ctx.save();
        ctx.translate(x, y);
        if (lane.dir > 0) ctx.scale(-1, 1);
        ctx.fillText(lane.emoji, 0, 0);
        ctx.restore();
      }
    }
    ctx.restore();

    // the pup
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
    ctx.ellipse(px, py + cell * 0.4, cell * 0.3, cell * 0.09, 0, 0, Math.PI * 2);
    ctx.fill();
    if (pup && pup.img.complete) {
      const s = cell * 1.04;
      ctx.drawImage(pup.img, px - s / 2, py - lift - s * 0.58, s, s * 1.1);
    }
  }

  function drawStartLine(y, boardW) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(boardX, y + cell - 8, boardW, 6);
    ctx.font = `700 ${cell * 0.42}px "Lilita One", sans-serif`;
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
