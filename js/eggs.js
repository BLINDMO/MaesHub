/* ============ Game 3: Egg Surprise ============
 * Press start and a sneaky wolf hides inside one of the eggs scattered
 * around the screen. Open eggs to find all the baby chicks — open every
 * egg EXCEPT the wolf's and you win!
 */
const Eggs = (() => {
  const TOTAL = 10;
  const CHICKS = ['🐣', '🐥', '🐤'];

  let field, opened, wolfIndex, finished;

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
    field.innerHTML = '';
    document.getElementById('eggs-start-overlay').classList.remove('hidden');
    document.getElementById('eggs-result-overlay').classList.add('hidden');
    document.getElementById('eggs-found').textContent = 0;
    document.getElementById('eggs-total').textContent = TOTAL - 1;
  }

  function newRound() {
    field.innerHTML = '';
    opened = 0;
    finished = false;
    wolfIndex = Math.floor(Math.random() * TOTAL);
    document.getElementById('eggs-found').textContent = 0;
    document.getElementById('eggs-total').textContent = TOTAL - 1;

    const spots = scatter(TOTAL);
    spots.forEach((pos, i) => {
      const egg = document.createElement('button');
      egg.className = 'egg';
      egg.textContent = '🥚';
      egg.style.left = pos.x + '%';
      egg.style.top = pos.y + '%';
      egg.style.rotate = (Math.random() * 24 - 12) + 'deg';
      egg.addEventListener('click', () => openEgg(egg, i), { once: true });
      field.appendChild(egg);
    });
  }

  function scatter(n) {
    // random spots that keep a friendly distance from each other
    const w = field.clientWidth, h = field.clientHeight;
    const minDist = Math.min(w, h) / 4.2;
    const spots = [];
    for (let i = 0; i < n; i++) {
      let best = null, bestScore = -1;
      for (let attempt = 0; attempt < 40; attempt++) {
        const p = { x: 10 + Math.random() * 80, y: 14 + Math.random() * 72 };
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
    if (finished) return;
    egg.classList.add('wiggle');
    Sound.pop();
    setTimeout(() => {
      if (finished) return;
      egg.classList.remove('wiggle');
      egg.classList.add('opened');
      egg.disabled = true;
      if (i === wolfIndex) {
        egg.textContent = '🐺';
        Sound.growl();
        finished = true;
        setTimeout(() => showResult(false), 700);
      } else {
        egg.textContent = CHICKS[Math.floor(Math.random() * CHICKS.length)];
        Sound.chirp();
        opened++;
        document.getElementById('eggs-found').textContent = opened;
        if (opened === TOTAL - 1) {
          finished = true;
          // reveal the wolf's egg with a relieved giggle
          field.querySelectorAll('.egg:not(.opened)').forEach((e) => {
            e.classList.add('wiggle');
            e.textContent = '🐺';
          });
          Sound.fanfare();
          throwConfetti(140);
          setTimeout(() => showResult(true), 900);
        }
      }
    }, 420);
  }

  function showResult(won) {
    const overlay = document.getElementById('eggs-result-overlay');
    document.getElementById('eggs-result-emoji').textContent = won ? '🐥🎉🐥' : '🐺';
    document.getElementById('eggs-result-text').textContent = won
      ? 'You found ALL the chicks and dodged the wolf! Amazing!'
      : 'Aaooo! The wolf was hiding in that one! Try again!';
    overlay.classList.remove('hidden');
  }

  return { init, start };
})();
