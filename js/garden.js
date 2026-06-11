/* ============ Game 4: Magic Garden ============
 * Tap the grass to plant a seed — a little stem pushes up out of the
 * dirt. Tap the watering can to pick it up, then tap a plant: the can
 * flies over, tips, and pours. That starts a 20-second magic grow with a
 * progress bar — stem, leaves, bud — until it blooms into a big
 * beautiful flower. Blooms attract butterflies; five flowers earn a
 * rainbow. No way to lose!
 */
const Garden = (() => {
  const FLOWERS = ['🌸', '🌷', '🌻', '🌼', '🌺', '🪻', '🌹'];
  const BUTTERFLIES = ['🦋', '🐝', '🐞'];
  const MAX_PLANTS = 14;
  const MAX_UNWATERED = 5; // water your seeds before planting more!
  const GROW_SECONDS = 20;

  // the seed drawer: flowers AND fruits
  const SEEDS = [
    { id: 'mix', icon: '✨', name: 'Surprise', bloom: null },
    { id: 'tulip', icon: '🌷', name: 'Tulip', bloom: '🌷' },
    { id: 'rose', icon: '🌹', name: 'Rose', bloom: '🌹' },
    { id: 'sunflower', icon: '🌻', name: 'Sunflower', bloom: '🌻' },
    { id: 'blossom', icon: '🌸', name: 'Blossom', bloom: '🌸' },
    { id: 'daisy', icon: '🌼', name: 'Daisy', bloom: '🌼' },
    { id: 'strawberry', icon: '🍓', name: 'Strawberry', bloom: '🍓' },
    { id: 'watermelon', icon: '🍉', name: 'Watermelon', bloom: '🍉' },
    { id: 'apple', icon: '🍎', name: 'Apple', bloom: '🍎' },
    { id: 'grapes', icon: '🍇', name: 'Grapes', bloom: '🍇' },
    { id: 'cherry', icon: '🍒', name: 'Cherries', bloom: '🍒' },
    { id: 'carrot', icon: '🥕', name: 'Carrot', bloom: '🥕' },
  ];
  let selectedSeed = SEEDS[0];
  const STAGES = ['', '🌿', '🪴', '🌷']; // stage 0 is the drawn stem sprout

  // a fresh stem pushing out of its little dirt mound
  const SPROUT_SVG = `<svg viewBox="0 0 60 62" width="52" height="54">
    <ellipse cx="30" cy="54" rx="19" ry="7" fill="#8a5a32"/>
    <ellipse cx="30" cy="52" rx="15" ry="5" fill="#a06b3c"/>
    <g class="stem">
      <path d="M30 52 C31 44 29 36 30 26" stroke="#4f9e3f" stroke-width="4.5" fill="none" stroke-linecap="round"/>
      <path d="M30 38 C22 37 17 31 19 25 C26 27 30 32 30 38 Z" fill="#5fb44e"/>
      <path d="M30 31 C38 30 43 24 41 18 C34 20 30 25 30 31 Z" fill="#6fc75d"/>
    </g>
  </svg>`;

  // a proper smiling sun: glowing core with spinning rays
  const SUN_SVG = `<svg viewBox="0 0 120 120">
    <defs>
      <radialGradient id="sun-core"><stop offset="0.3" stop-color="#fff3b0"/><stop offset="1" stop-color="#ffc93d"/></radialGradient>
    </defs>
    <g id="sun-rays" fill="#ffd34d">
      ${Array.from({ length: 12 }, (_, i) =>
        `<path d="M60 4 L66 24 L54 24 Z" transform="rotate(${i * 30} 60 60)"/>`).join('')}
    </g>
    <circle cx="60" cy="60" r="33" fill="url(#sun-core)" stroke="#f0a92e" stroke-width="3"/>
    <circle cx="49" cy="55" r="3.4" fill="#7a4d12"/>
    <circle cx="71" cy="55" r="3.4" fill="#7a4d12"/>
    <circle cx="50.2" cy="53.8" r="1.1" fill="#fff"/>
    <circle cx="72.2" cy="53.8" r="1.1" fill="#fff"/>
    <path d="M48 66 Q60 76 72 66" stroke="#7a4d12" stroke-width="3.4" fill="none" stroke-linecap="round"/>
    <circle cx="43" cy="64" r="4.5" fill="#ffaf63" opacity="0.65"/>
    <circle cx="77" cy="64" r="4.5" fill="#ffaf63" opacity="0.65"/>
  </svg>`;

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
  let canSelected = false;

  function init() {
    area = document.getElementById('garden-area');
    ground = document.getElementById('garden-ground');
    can = document.getElementById('garden-can');
    can.innerHTML = CAN_SVG;
    document.getElementById('garden-sun').innerHTML = SUN_SVG;

    // tap the can to pick it up / put it down
    can.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      Sound.click();
      canSelected = !canSelected;
      can.classList.toggle('selected', canSelected);
    });

    ground.addEventListener('pointerdown', (e) => {
      if (e.target !== ground) return;
      if (canSelected) { Sound.splash(); return; } // watering bare grass is just a splash
      plantSeed(e);
    });
    document.getElementById('garden-reset').addEventListener('click', () => {
      Sound.pop();
      resetGarden();
    });

    // the seed drawer slides open next to the watering can
    const drawer = document.getElementById('seed-drawer');
    const seedBtn = document.getElementById('garden-seed-btn');
    seedBtn.textContent = selectedSeed.icon;
    seedBtn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      Sound.click();
      drawer.classList.toggle('open');
    });
    SEEDS.forEach((seed) => {
      const packet = document.createElement('button');
      packet.className = 'seed-packet' + (seed === selectedSeed ? ' selected' : '');
      packet.innerHTML = `<span>${seed.icon}</span><small>${seed.name}</small>`;
      packet.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        Sound.pop();
        selectedSeed = seed;
        seedBtn.textContent = seed.icon;
        drawer.querySelectorAll('.seed-packet').forEach((p) => p.classList.toggle('selected', p === packet));
        drawer.classList.remove('open');
      });
      drawer.appendChild(packet);
    });
  }

  function toast(msg) {
    const t = document.getElementById('garden-toast');
    t.textContent = msg;
    t.classList.remove('hidden');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => t.classList.add('hidden'), 1800);
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

  /* ----- the flying watering can ----- */
  function returnCan() {
    can.classList.add('returning');
    can.classList.remove('flying');
    can.style.left = '';
    can.style.top = '';
    setTimeout(() => can.classList.remove('returning'), 500);
  }

  /* ----- planting & growing ----- */
  function plantSeed(e) {
    if (plants.length >= MAX_PLANTS) return;
    const unwatered = plants.filter((p) => !p.growing && !p.bloomed).length;
    if (unwatered >= MAX_UNWATERED) {
      Sound.bonk();
      toast('5 seeds are waiting! Water them first! 💧');
      can.classList.remove('nudge');
      void can.offsetWidth;
      can.classList.add('nudge');
      return;
    }
    document.getElementById('garden-hint').style.display = 'none';
    Sound.pop();
    const r = area.getBoundingClientRect();
    const el = document.createElement('button');
    el.className = 'plant';
    el.innerHTML = SPROUT_SVG; // a stem pushes up out of the dirt first
    el.style.left = (e.clientX - r.left) + 'px';
    el.style.top = (e.clientY - r.top) + 'px';
    const plant = { el, growing: false, bloomed: false, bar: null, bloom: selectedSeed.bloom };
    el.addEventListener('pointerdown', (ev) => {
      ev.stopPropagation();
      if (canSelected) { waterPlant(plant); return; }
      if (plant.bloomed) { Sound.sparkle(); sparkleBurst(el, 5); }
      else { Sound.click(); el.classList.remove('wiggle'); void el.offsetWidth; el.classList.add('wiggle'); }
    });
    area.appendChild(el);
    plants.push(plant);
  }

  function waterPlant(plant) {
    if (can.classList.contains('flying')) return; // one pour at a time
    if (plant.bloomed || plant.growing) {
      pourOver(plant);
      later(() => { Sound.splash(); rainDroplets(plant.el); }, 420);
      later(() => returnCan(), 1500);
      return;
    }
    plant.growing = true;
    pourOver(plant);
    later(() => { Sound.splash(); rainDroplets(plant.el); }, 420);
    later(() => returnCan(), 1500);

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

  // the can flies over the plant, tips, and pours
  function pourOver(plant) {
    can.classList.add('flying');
    can.style.left = (plant.el.offsetLeft - 10) + 'px';
    can.style.top = (plant.el.offsetTop - 100) + 'px';
    later(() => can.classList.add('pouring'), 380);
    later(() => can.classList.remove('pouring'), 1400);
  }

  function bloom(plant) {
    plant.bloomed = true;
    plant.growing = false;
    if (plant.bar) { plant.bar.remove(); plant.bar = null; }
    plant.el.textContent = plant.bloom || FLOWERS[Math.floor(Math.random() * FLOWERS.length)];
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
