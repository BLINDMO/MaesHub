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

  function newRound() {
    clearTimers();
    field.innerHTML = '';
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

    // the wolf trots in...
    const wolf = document.createElement('div');
    wolf.id = 'eggs-wolf';
    wolf.textContent = '🐺';
    wolf.style.left = '-12%';
    wolf.style.top = '50%';
    field.appendChild(wolf);
    requestAnimationFrame(() => {
      wolf.classList.add('walking');
      wolf.style.left = '46%';
    });

    // ...dives into the pile...
    later(() => {
      wolf.classList.remove('walking');
      wolf.classList.add('diving');
      Sound.growl();
    }, 2600);

    // ...and the eggs scatter everywhere!
    later(() => {
      wolf.remove();
      Sound.pop();
      eggs.forEach((egg, i) => {
        egg.style.transitionDelay = (Math.random() * 0.35) + 's';
        egg.style.left = spots[i].x + '%';
        egg.style.top = spots[i].y + '%';
        egg.style.rotate = (Math.random() * 36 - 18) + 'deg';
      });
    }, 3400);

    later(() => {
      eggs.forEach((egg) => { egg.style.transitionDelay = '0s'; });
      accepting = true;
    }, 4500);
  }

  function scatter(n) {
    const w = field.clientWidth || 800, h = field.clientHeight || 600;
    const minDist = Math.sqrt((w * h) / n) * 0.62;
    const spots = [];
    for (let i = 0; i < n; i++) {
      let best = null, bestScore = -1;
      for (let attempt = 0; attempt < 60; attempt++) {
        const p = { x: 7 + Math.random() * 86, y: 10 + Math.random() * 80 };
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
        egg.textContent = '🐺';
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
            e.classList.add('wiggle', 'opened');
            e.textContent = '🐺';
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
