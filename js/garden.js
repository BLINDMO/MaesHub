/* ============ Game 4: Magic Garden ============
 * Two tools: seeds 🌱 and the water pail 🪣. Pick the seeds and tap the
 * grass to plant; then pick the pail and tap a plant to water it. Watered
 * plants grow on their own over 20 seconds — sprout, leaves, bud — until
 * they bloom into a big beautiful flower. Blooms attract butterflies to
 * catch, and a full garden earns a rainbow. No way to lose!
 */
const Garden = (() => {
  const FLOWERS = ['🌸', '🌷', '🌻', '🌼', '🌺', '🪻', '🌹'];
  const BUTTERFLIES = ['🦋', '🐝', '🐞'];
  const MAX_PLANTS = 10;
  const GROW_SECONDS = 20;
  // emoji shown along the way: planted → watered stages → final flower
  const STAGES = ['🌱', '🌿', '🪴', '🌷'];

  let area, ground;
  let tool = 'seed';
  let plants = [];
  let critters = [];
  let flowerCount = 0;
  let butterflyCount = 0;
  let rafId = null, lastTime = 0, active = false;
  let timers = [];

  function init() {
    area = document.getElementById('garden-area');
    ground = document.getElementById('garden-ground');

    document.querySelectorAll('.tool-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        Sound.click();
        tool = btn.dataset.tool;
        document.querySelectorAll('.tool-btn').forEach((b) => b.classList.toggle('selected', b === btn));
        area.classList.toggle('watering', tool === 'water');
      });
    });

    ground.addEventListener('pointerdown', (e) => {
      if (e.target !== ground) return;
      if (tool === 'seed') plantSeed(e);
      else Sound.splash(); // splashing water on empty grass is still fun
    });
    document.getElementById('garden-reset').addEventListener('click', () => {
      Sound.pop();
      resetGarden();
    });
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
    plants.forEach((p) => p.el.remove());
    critters.forEach((c) => c.el.remove());
    plants = [];
    critters = [];
    flowerCount = 0;
    butterflyCount = 0;
    updateHud();
    document.getElementById('garden-rainbow').classList.add('hidden');
    document.getElementById('garden-hint').style.display = '';
  }

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
    const plant = { el, growing: false, bloomed: false };
    el.addEventListener('pointerdown', (ev) => {
      ev.stopPropagation();
      tapPlant(plant);
    });
    area.appendChild(el);
    plants.push(plant);
  }

  function tapPlant(plant) {
    if (plant.bloomed) { Sound.sparkle(); sparkleBurst(plant.el, 5); return; }
    if (tool !== 'water') { Sound.click(); wobble(plant.el); return; }
    if (plant.growing) { Sound.splash(); rainDroplets(plant.el); return; }

    // one watering starts the 20-second magic grow
    plant.growing = true;
    Sound.splash();
    rainDroplets(plant.el);
    const stepMs = (GROW_SECONDS * 1000) / (STAGES.length);
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

  function bloom(plant) {
    plant.bloomed = true;
    plant.el.textContent = FLOWERS[Math.floor(Math.random() * FLOWERS.length)];
    plant.el.classList.add('bloomed');
    Sound.fanfare();
    sparkleBurst(plant.el, 10);
    flowerCount++;
    updateHud();
    maybeCelebrate();
    maybeSpawnButterfly();
  }

  function wobble(el) {
    el.classList.remove('wiggle');
    void el.offsetWidth; // restart the animation
    el.classList.add('wiggle');
  }

  function rainDroplets(el) {
    for (let i = 0; i < 3; i++) {
      const d = document.createElement('span');
      d.className = 'droplet';
      d.textContent = '💧';
      d.style.left = (el.offsetLeft + (i - 1) * 18) + 'px';
      d.style.top = (el.offsetTop - 50) + 'px';
      d.style.animationDelay = i * 0.1 + 's';
      area.appendChild(d);
      setTimeout(() => d.remove(), 1100);
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
