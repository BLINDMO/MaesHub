/* ============ Game 4: Magic Garden ============
 * A no-fail sandbox made for a four-year-old: tap the grass to plant seeds,
 * tap a plant to water it and watch it grow into a surprise flower.
 * Blooming flowers attract butterflies she can catch for sparkles, and a
 * big garden earns a rainbow. There is no way to lose — only ways to play.
 */
const Garden = (() => {
  const FLOWERS = ['🌸', '🌷', '🌻', '🌼', '🌺', '🪻', '🌹'];
  const BUTTERFLIES = ['🦋', '🐝', '🐞'];
  const MAX_PLANTS = 14;

  let area, ground;
  let plants = [];
  let critters = [];
  let flowerCount = 0;
  let butterflyCount = 0;
  let rafId = null;
  let lastTime = 0;
  let active = false;

  function init() {
    area = document.getElementById('garden-area');
    ground = document.getElementById('garden-ground');
    ground.addEventListener('pointerdown', (e) => {
      if (e.target !== ground) return;
      plantSeed(e);
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

  function resetGarden() {
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
    el.textContent = '🌱';
    el.style.left = (e.clientX - r.left) + 'px';
    el.style.top = (e.clientY - r.top) + 'px';
    const plant = { el, stage: 0, busy: false };
    el.addEventListener('pointerdown', (ev) => {
      ev.stopPropagation();
      waterPlant(plant);
    });
    area.appendChild(el);
    plants.push(plant);
  }

  function waterPlant(plant) {
    if (plant.busy || plant.stage >= 2) {
      if (plant.stage >= 2) sparkleBurst(plant.el, 4); // blooms still sparkle when patted
      return;
    }
    plant.busy = true;
    Sound.splash();
    rainDroplets(plant.el);
    setTimeout(() => {
      plant.stage++;
      plant.busy = false;
      if (plant.stage === 1) {
        plant.el.textContent = '🌿';
        plant.el.classList.add('stage-1');
      } else {
        plant.el.textContent = FLOWERS[Math.floor(Math.random() * FLOWERS.length)];
        plant.el.classList.add('stage-2');
        Sound.sparkle();
        sparkleBurst(plant.el, 8);
        flowerCount++;
        updateHud();
        maybeCelebrate();
        maybeSpawnButterfly();
      }
    }, 750);
  }

  function rainDroplets(el) {
    for (let i = 0; i < 3; i++) {
      const d = document.createElement('span');
      d.className = 'droplet';
      d.textContent = '💧';
      d.style.left = (el.offsetLeft + (i - 1) * 18) + 'px';
      d.style.top = (el.offsetTop - 40) + 'px';
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
      s.style.setProperty('--dx', Math.cos(ang) * 60 + 'px');
      s.style.setProperty('--dy', Math.sin(ang) * 60 - 30 + 'px');
      s.style.left = el.offsetLeft + 'px';
      s.style.top = (el.offsetTop - 30) + 'px';
      area.appendChild(s);
      setTimeout(() => s.remove(), 1000);
    }
  }

  function maybeCelebrate() {
    if (flowerCount === 6) {
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
    // a new friend flutters in a little later
    setTimeout(() => { if (active && flowerCount > 0) maybeSpawnButterfly(); }, 2500 + Math.random() * 3000);
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
