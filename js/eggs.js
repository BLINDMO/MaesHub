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

  // a sunny meadow behind the eggs: clouds in the sky, flowers in the grass
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
    add('☁️', 8 + Math.random() * 14, 2, 'cloud');
    add('☁️', 62 + Math.random() * 24, 5, 'cloud');
    add('🌞', 88, 1, 'cloud', 2.6);
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

    const spots = scatter(TOTAL);
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
      eggs.forEach((egg, i) => {
        egg.style.transitionDelay = (Math.random() * 0.35) + 's';
        egg.style.left = spots[i].x + '%';
        egg.style.top = spots[i].y + '%';
        egg.style.rotate = (Math.random() * 36 - 18) + 'deg';
      });
    }, 3500);

    later(() => {
      eggs.forEach((egg) => { egg.style.transitionDelay = '0s'; });
      accepting = true;
    }, 4600);
  }

  function scatter(n) {
    const w = field.clientWidth || 800, h = field.clientHeight || 600;
    const minDist = Math.sqrt((w * h) / n) * 0.62;
    const spots = [];
    for (let i = 0; i < n; i++) {
      let best = null, bestScore = -1;
      for (let attempt = 0; attempt < 60; attempt++) {
        // keep the eggs on the grass, below the sky line
        const p = { x: 7 + Math.random() * 86, y: 26 + Math.random() * 64 };
        const px = (p.x / 100) * w, py = (p.y / 100) * h;
        let nearest = Infinity;
        for (const s of spots) {
          const d = Math.hypot(px - (s.x / 100) * w, py - (s.y / 100) * h);
          if (d < nearest) nearest = d;
        }
        if (nearest >= minDist) { best = p; break; }
        if (nearest > bestScore) { bestScore = nearest; best = p; }
      }
      spots.push(best);
    }
    return spots;
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
        egg.innerHTML = Chars.wolfHeadSVG();
        egg.classList.add('wolf-egg');
        Sound.growl();
        finished = true;
        later(() => showResult(false), 700);
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

  function showResult(won) {
    const overlay = document.getElementById('eggs-result-overlay');
    document.getElementById('eggs-result-emoji').textContent = won ? '🐥🎉🐥' : '🐺';
    document.getElementById('eggs-result-text').textContent = won
      ? 'You found ALL 24 chicks and dodged the wolf! Amazing!'
      : 'Aaooo! The wolf was hiding in that one! Try again!';
    overlay.classList.remove('hidden');
  }

  return { init, start, stop };
})();
