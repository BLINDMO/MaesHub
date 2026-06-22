/* ============ Game 3: Egg Surprise ============
 * Press Start: 25 colorful eggs sit piled in the middle of the screen,
 * the wolf trots in from the side, DIVES into the pile, and the eggs
 * scatter everywhere. Open eggs to find all 24 baby chicks — but don't
 * open the one the wolf is hiding in!
 */
const Eggs = (() => {
  const TOTAL = 25;
  const CHICKS = ['🐣', '🐥', '🐤'];
  const COLOR_CLASSES = 8;   // egg-c0..c7 in the stylesheet
  const PATTERN_CLASSES = 3; // egg-p0..p2

  let field, opened, wolfIndex, finished, accepting;
  let timers = [];

  function init() {
    field = document.getElementById('eggs-field');
    document.getElementById('eggs-start').addEventListener('click', () => {
      Sound.fanfare();
      document.getElementById('eggs-start-overlay').classList.add('hidden');
      newRound();
    });
    document.getElementById('eggs-again').addEventListener('click', () => {
      Sound.click();
      document.getElementById('eggs-result-overlay').classList.add('hidden');
      newRound();
    });
  }

  function start() {
    clearTimers();
    field.innerHTML = '';
    document.getElementById('eggs-start-overlay').classList.remove('hidden');
    document.getElementById('eggs-result-overlay').classList.add('hidden');
    document.getElementById('eggs-found').textContent = 0;
    document.getElementById('eggs-total').textContent = TOTAL - 1;
  }

  function stop() { clearTimers(); }

  function clearTimers() {
    timers.forEach(clearTimeout);
    timers = [];
  }
  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }

  // a sunny meadow behind the eggs: a deep sky with sun glow and drifting
  // clouds at a couple of depths, flowers in the grass
  function decorate() {
    const add = (txt, x, y, cls, size) => {
      const s = document.createElement('span');
      s.className = 'field-decor ' + cls;
      s.textContent = txt;
      s.style.left = x + '%';
      s.style.top = y + '%';
      if (size) s.style.fontSize = size + 'rem';
      field.appendChild(s);
    };
    const glow = document.createElement('span');
    glow.className = 'field-decor sun-glow';
    glow.style.left = '85%';
    glow.style.top = '1%';
    field.appendChild(glow);
    add('🌞', 85, 1, 'cloud sun-emoji', 3.1);
    add('☁️', 10 + Math.random() * 10, 3, 'cloud cloud-far', 2.2);
    add('☁️', 30 + Math.random() * 14, 1, 'cloud cloud-far', 1.8);
    add('☁️', 4 + Math.random() * 10, 9, 'cloud cloud-near', 3.4);
    add('☁️', 56 + Math.random() * 16, 8, 'cloud cloud-near', 2.8);
    add('🐦', 22 + Math.random() * 12, 6, 'cloud bird', 1.1);
    const plants = ['🌼', '🌷', '🌾', '☘️', '🍄', '🌻', '🌸', '🌾'];
    plants.forEach((p, i) => {
      add(p, 4 + ((i * 37 + Math.random() * 18) % 92), 28 + ((i * 23 + Math.random() * 12) % 64), 'plant-decor', 1.3 + Math.random() * 0.8);
    });
  }

  function newRound() {
    clearTimers();
    field.innerHTML = '';
    decorate();
    opened = 0;
    finished = false;
    accepting = false; // no peeking until the wolf has hidden!
    wolfIndex = Math.floor(Math.random() * TOTAL);
    document.getElementById('eggs-found').textContent = 0;
    document.getElementById('eggs-total').textContent = TOTAL - 1;

    const spots = gridSpots(TOTAL);
    const eggs = [];
    for (let i = 0; i < TOTAL; i++) {
      const egg = document.createElement('button');
      egg.className = `egg egg-c${i % COLOR_CLASSES} egg-p${(i * 7 + 3) % PATTERN_CLASSES}`;
      // start piled in the middle of the screen
      egg.style.left = 50 + (Math.random() - 0.5) * 14 + '%';
      egg.style.top = 50 + (Math.random() - 0.5) * 16 + '%';
      egg.style.rotate = (Math.random() * 40 - 20) + 'deg';
      egg.addEventListener('click', () => openEgg(egg, i), { once: true });
      field.appendChild(egg);
      eggs.push(egg);
    }

    // the wolf trots in on four legs...
    const wolf = document.createElement('div');
    wolf.id = 'eggs-wolf';
    wolf.innerHTML = Chars.wolfSVG();
    wolf.style.left = '-15%';
    wolf.style.top = '52%';
    field.appendChild(wolf);
    requestAnimationFrame(() => {
      wolf.classList.add('walking');
      wolf.style.left = '42%';
    });

    // ...crouches, springs, and DIVES into the pile...
    later(() => {
      wolf.classList.remove('walking');
      wolf.classList.add('diving');
      Sound.growl();
    }, 2600);

    // ...lands with a thump and a dust puff, and the eggs burst outward!
    later(() => {
      wolf.remove();
      for (let i = 0; i < 5; i++) {
        const puff = document.createElement('span');
        puff.className = 'dust-puff';
        puff.textContent = '💨';
        puff.style.left = (44 + (i - 2) * 5) + '%';
        puff.style.top = (50 + (Math.random() - 0.5) * 8) + '%';
        field.appendChild(puff);
        setTimeout(() => puff.remove(), 900);
      }
      field.classList.add('shake');
      setTimeout(() => field.classList.remove('shake'), 450);
      Sound.pop();

      // wait for every egg's slide-into-place transition to actually finish
      // before accepting taps — a fixed guess-timer here used to race the
      // CSS transition on slower devices, so taps right after the dive were
      // silently swallowed and looked like the eggs were "stuck"
      let settled = 0;
      eggs.forEach((egg, i) => {
        egg.style.transitionDelay = (Math.random() * 0.22) + 's';
        egg.style.left = spots[i].x + '%';
        egg.style.top = spots[i].y + '%';
        egg.style.rotate = (Math.random() * 36 - 18) + 'deg';
        egg.addEventListener('transitionend', function onSettled(e) {
          if (e.propertyName !== 'left') return;
          egg.removeEventListener('transitionend', onSettled);
          egg.style.transitionDelay = '0s';
          settled++;
          if (settled === eggs.length) accepting = true;
        });
      });
      // safety net in case a transitionend event is ever missed (e.g. tab
      // backgrounded mid-animation) so the game never gets permanently stuck
      later(() => { accepting = true; }, 2200);
    }, 3500);
  }

  // lay the eggs out in a tidy grid across the grass, with a touch of
  // jitter per slot so it still feels hand-scattered rather than robotic
  function gridSpots(n) {
    const cols = 5;
    const rows = Math.ceil(n / cols);
    const xs = Array.from({ length: cols }, (_, c) => 12 + c * (76 / (cols - 1)));
    const ys = Array.from({ length: rows }, (_, r) => 34 + r * (54 / (rows - 1)));
    const coords = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (coords.length >= n) break;
        coords.push({
          x: xs[c] + (Math.random() - 0.5) * 5,
          y: ys[r] + (Math.random() - 0.5) * 5,
        });
      }
    }
    // shuffle slot assignment so egg colors aren't in tidy diagonal stripes
    for (let i = coords.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [coords[i], coords[j]] = [coords[j], coords[i]];
    }
    return coords;
  }

  function openEgg(egg, i) {
    if (finished || !accepting) return;
    egg.classList.add('wiggle');
    Sound.pop();
    later(() => {
      if (finished) return;
      egg.classList.remove('wiggle');
      egg.classList.add('opened');
      egg.disabled = true;
      if (i === wolfIndex) {
        finished = true;
        wolfEscapes(egg);
      } else {
        egg.textContent = CHICKS[Math.floor(Math.random() * CHICKS.length)];
        Sound.chirp();
        opened++;
        document.getElementById('eggs-found').textContent = opened;
        if (opened === TOTAL - 1) {
          finished = true;
          field.querySelectorAll('.egg:not(.opened)').forEach((e) => {
            e.classList.add('wiggle', 'opened', 'wolf-egg');
            e.innerHTML = Chars.wolfHeadSVG();
          });
          Sound.fanfare();
          throwConfetti(160);
          later(() => showResult(true), 900);
        }
      }
    }, 420);
  }

  /* Found him! The wolf bursts out of the egg and sprints away. */
  function wolfEscapes(egg) {
    egg.textContent = '🥚';
    egg.classList.add('cracked-shell');
    Sound.growl();

    const wolf = document.createElement('div');
    wolf.id = 'eggs-wolf';
    wolf.classList.add('escaping');
    wolf.innerHTML = Chars.wolfSVG();
    wolf.style.left = egg.style.left;
    wolf.style.top = egg.style.top;
    field.appendChild(wolf);

    // a beat to realize what happened… then he bolts for the edge
    later(() => {
      Sound.bonk();
      wolf.classList.add('running');
      wolf.style.left = '125%';
      const fromLeft = parseFloat(egg.style.left);
      for (let k = 0; k < 4; k++) {
        later(() => {
          const puff = document.createElement('span');
          puff.className = 'dust-puff';
          puff.textContent = '💨';
          puff.style.left = Math.min(96, fromLeft + 8 + k * (96 - fromLeft) / 4) + '%';
          puff.style.top = egg.style.top;
          field.appendChild(puff);
          setTimeout(() => puff.remove(), 900);
        }, 150 + k * 280);
      }
    }, 800);

    later(() => showResult(false), 2700);
  }

  function showResult(won) {
    const overlay = document.getElementById('eggs-result-overlay');
    document.getElementById('eggs-result-emoji').textContent = won ? '🐥🎉🐥' : '🐺';
    document.getElementById('eggs-result-text').textContent = won
      ? 'You found ALL 24 chicks and dodged the wolf! Amazing!'
      : 'You found the wolf — and he ran away! Game over, try again!';
    overlay.classList.remove('hidden');
  }

  return { init, start, stop };
})();
