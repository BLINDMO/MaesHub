/* ============ Game 4: Magic Garden ============
 * Tap the grass to plant a seed, then pick up the watering can and carry
 * it to a plant. Watering starts a 20-second magic grow with a little
 * progress bar — sprout, leaves, bud — until it blooms into a big
 * beautiful flower. Blooms attract butterflies; five flowers earn a
 * rainbow. No way to lose!
 */
const Garden = (() => {
  const FLOWERS = ['🌸', '🌷', '🌻', '🌼', '🌺', '🪻', '🌹'];
  const BUTTERFLIES = ['🦋', '🐝', '🐞'];
  const MAX_PLANTS = 10;
  const GROW_SECONDS = 20;
  const STAGES = ['🌱', '🌿', '🪴', '🌷'];

  const CAN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 90">
    <!-- a proper watering can: body, spout, handle, rose -->
    <path d="M30 36 H78 Q82 36 82 42 L78 78 Q78 84 70 84 H38 Q30 84 30 78 Z" fill="#5fa8e0"/>
    <path d="M30 44 L8 28 L14 20 L34 38 Z" fill="#5fa8e0"/>
    <circle cx="11" cy="24" r="9" fill="#4a8fc4"/>
    <circle cx="8" cy="21" r="1.8" fill="#cde8fa"/><circle cx="13" cy="20" r="1.8" fill="#cde8fa"/>
    <circle cx="9" cy="27" r="1.8" fill="#cde8fa"/><circle cx="14" cy="26" r="1.8" fill="#cde8fa"/>
    <path d="M44 36 Q54 14 74 22 Q88 28 80 40" fill="none" stroke="#4a8fc4" stroke-width="8" stroke-linecap="round"/>
    <rect x="30" y="36" width="52" height="9" rx="4" fill="#4a8fc4"/>
    <ellipse cx="56" cy="62" rx="14" ry="10" fill="#7dbcec"/>
    <path d="M49 60 q7 8 14 0" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>
  </svg>`;

  let area, ground, can;
  let plants = [];
  let critters = [];
  let flowerCount = 0;
  let butterflyCount = 0;
  let rafId = null, lastTime = 0, active = false;
  let timers = [];
  let dragging = false;

  function init() {
    area = document.getElementById('garden-area');
    ground = document.getElementById('garden-ground');
    can = document.getElementById('garden-can');
    can.innerHTML = CAN_SVG;

    ground.addEventListener('pointerdown', (e) => {
      if (e.target !== ground || dragging) return;
      plantSeed(e);
    });
    document.getElementById('garden-reset').addEventListener('click', () => {
      Sound.pop();
      resetGarden();
    });
    setupCanDrag();
  }

  function start() {
    active = true;
    lastTime = performance.now();
    rafId = requestAnimationFrame(flutterLoop);
  }

  function stop() {
    active = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  }

  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }

  function resetGarden() {
    timers.forEach(clearTimeout);
    timers = [];
    plants.forEach((p) => { p.el.remove(); if (p.bar) p.bar.remove(); });
    critters.forEach((c) => c.el.remove());
    plants = [];
    critters = [];
    flowerCount = 0;
    butterflyCount = 0;
    updateHud();
    document.getElementById('garden-rainbow').classList.add('hidden');
    document.getElementById('garden-hint').style.display = '';
  }

  /* ----- the draggable watering can ----- */
  function setupCanDrag() {
    can.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      dragging = true;
      can.setPointerCapture(e.pointerId);
      can.classList.add('held');
      moveCan(e);
      Sound.click();
    });
    can.addEventListener('pointermove', (e) => {
      if (dragging) moveCan(e);
    });
    can.addEventListener('pointerup', (e) => {
      if (!dragging) return;
      dragging = false;
      can.classList.remove('held');
      const target = plantNear(e);
      if (target) waterPlant(target, e);
      else returnCan();
    });
  }

  function moveCan(e) {
    const r = area.getBoundingClientRect();
    can.style.left = (e.clientX - r.left - 45) + 'px';
    can.style.top = (e.clientY - r.top - 40) + 'px';
    can.style.right = 'auto';
    can.style.bottom = 'auto';
  }

  function plantNear(e) {
    const r = area.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    let best = null, bestD = 90;
    for (const p of plants) {
      const d = Math.hypot(p.el.offsetLeft - x, p.el.offsetTop - y);
      if (d < bestD) { bestD = d; best = p; }
    }
    return best;
  }

  function returnCan() {
    can.classList.add('returning');
    can.style.left = '';
    can.style.top = '';
    can.style.right = '';
    can.style.bottom = '';
    setTimeout(() => can.classList.remove('returning'), 450);
  }

  /* ----- planting & growing ----- */
  function plantSeed(e) {
    if (plants.length >= MAX_PLANTS) return;
    document.getElementById('garden-hint').style.display = 'none';
    Sound.pop();
    const r = area.getBoundingClientRect();
    const el = document.createElement('button');
    el.className = 'plant';
    el.textContent = STAGES[0];
    el.style.left = (e.clientX - r.left) + 'px';
    el.style.top = (e.clientY - r.top) + 'px';
    const plant = { el, growing: false, bloomed: false, bar: null };
    el.addEventListener('pointerdown', (ev) => {
      ev.stopPropagation();
      if (dragging) return;
      if (plant.bloomed) { Sound.sparkle(); sparkleBurst(el, 5); }
      else { Sound.click(); el.classList.remove('wiggle'); void el.offsetWidth; el.classList.add('wiggle'); }
    });
    area.appendChild(el);
    plants.push(plant);
  }

  function waterPlant(plant, e) {
    if (plant.bloomed || plant.growing) {
      Sound.splash();
      rainDroplets(plant.el);
      later(() => returnCan(), 900);
      pourOver(plant);
      return;
    }
    plant.growing = true;
    pourOver(plant);
    Sound.splash();
    rainDroplets(plant.el);
    later(() => returnCan(), 1100);

    // little progress bar that fills over the 20-second grow
    const bar = document.createElement('div');
    bar.className = 'grow-bar';
    bar.innerHTML = '<div class="grow-fill"></div>';
    bar.style.left = plant.el.offsetLeft + 'px';
    bar.style.top = (plant.el.offsetTop + 14) + 'px';
    area.appendChild(bar);
    plant.bar = bar;
    requestAnimationFrame(() => {
      bar.querySelector('.grow-fill').style.transition = `width ${GROW_SECONDS}s linear`;
      bar.querySelector('.grow-fill').style.width = '100%';
    });

    const stepMs = (GROW_SECONDS * 1000) / STAGES.length;
    for (let s = 1; s < STAGES.length; s++) {
      later(() => {
        plant.el.textContent = STAGES[s];
        plant.el.classList.add('stage-' + s);
        rainDroplets(plant.el);
        Sound.pop();
      }, stepMs * s);
    }
    later(() => bloom(plant), GROW_SECONDS * 1000);
  }

  // park the can tipped over the plant while it pours
  function pourOver(plant) {
    can.classList.add('pouring');
    can.style.left = (plant.el.offsetLeft - 10) + 'px';
    can.style.top = (plant.el.offsetTop - 95) + 'px';
    can.style.right = 'auto';
    can.style.bottom = 'auto';
    setTimeout(() => can.classList.remove('pouring'), 1000);
  }

  function bloom(plant) {
    plant.bloomed = true;
    plant.growing = false;
    if (plant.bar) { plant.bar.remove(); plant.bar = null; }
    plant.el.textContent = FLOWERS[Math.floor(Math.random() * FLOWERS.length)];
    plant.el.classList.add('bloomed');
    Sound.fanfare();
    sparkleBurst(plant.el, 10);
    flowerCount++;
    updateHud();
    maybeCelebrate();
    maybeSpawnButterfly();
  }

  function rainDroplets(el) {
    for (let i = 0; i < 4; i++) {
      const d = document.createElement('span');
      d.className = 'droplet';
      d.textContent = '💧';
      d.style.left = (el.offsetLeft + (i - 1.5) * 16) + 'px';
      d.style.top = (el.offsetTop - 55) + 'px';
      d.style.animationDelay = i * 0.1 + 's';
      area.appendChild(d);
      setTimeout(() => d.remove(), 1200);
    }
  }

  function sparkleBurst(el, n) {
    for (let i = 0; i < n; i++) {
      const s = document.createElement('span');
      s.className = 'sparkle';
      s.textContent = ['✨', '⭐', '💖'][i % 3];
      const ang = (i / n) * Math.PI * 2;
      s.style.setProperty('--dx', Math.cos(ang) * 70 + 'px');
      s.style.setProperty('--dy', Math.sin(ang) * 70 - 30 + 'px');
      s.style.left = el.offsetLeft + 'px';
      s.style.top = (el.offsetTop - 40) + 'px';
      area.appendChild(s);
      setTimeout(() => s.remove(), 1000);
    }
  }

  function maybeCelebrate() {
    if (flowerCount === 5) {
      document.getElementById('garden-rainbow').classList.remove('hidden');
      Sound.fanfare();
      throwConfetti(140);
    }
  }

  /* ----- butterflies ----- */
  function maybeSpawnButterfly() {
    if (critters.length >= 4) return;
    const el = document.createElement('button');
    el.className = 'butterfly';
    el.textContent = BUTTERFLIES[Math.floor(Math.random() * BUTTERFLIES.length)];
    const critter = {
      el,
      x: Math.random() * area.clientWidth,
      y: area.clientHeight * (0.15 + Math.random() * 0.4),
      t: Math.random() * 10,
      speed: 40 + Math.random() * 50,
    };
    el.addEventListener('pointerdown', (ev) => {
      ev.stopPropagation();
      catchCritter(critter);
    });
    area.appendChild(el);
    critters.push(critter);
  }

  function catchCritter(critter) {
    Sound.sparkle();
    sparkleBurst(critter.el, 8);
    critter.el.remove();
    critters = critters.filter((c) => c !== critter);
    butterflyCount++;
    updateHud();
    later(() => { if (active && flowerCount > 0) maybeSpawnButterfly(); }, 2500 + Math.random() * 3000);
  }

  function flutterLoop(now) {
    if (!active) return;
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    const w = area.clientWidth, h = area.clientHeight;
    for (const c of critters) {
      c.t += dt;
      c.x += Math.cos(c.t * 0.7) * c.speed * dt;
      c.y += Math.sin(c.t * 1.3) * c.speed * 0.6 * dt;
      c.x = Math.max(10, Math.min(w - 50, c.x));
      c.y = Math.max(10, Math.min(h * 0.6, c.y));
      c.el.style.left = c.x + 'px';
      c.el.style.top = c.y + 'px';
      c.el.style.transform = `rotate(${Math.sin(c.t * 3) * 16}deg)`;
    }
    rafId = requestAnimationFrame(flutterLoop);
  }

  function updateHud() {
    document.getElementById('garden-flowers').textContent = flowerCount;
    document.getElementById('garden-butterflies').textContent = butterflyCount;
  }

  return { init, start, stop };
})();
