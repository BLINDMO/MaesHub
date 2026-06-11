/* ============ Nighttime Countdown ============
 * Parent-locked bedtime timer. Unlocking the moon tile with the passcode
 * lets a parent pick the playtime; a small persistent countdown then sits
 * at the top while Mae plays anything she likes. At 5 minutes a popup
 * warns her, at 60 seconds the timer blinks and the screen slowly fades
 * to black, and at zero the goodnight pup takes over the screen. The lock
 * stays until a grown-up taps 10 times quickly and enters the passcode.
 * The end-time is saved on the device, so reloading the app can't skip it.
 */
const Night = (() => {
  const PASSCODE = '0617';
  const STORE_KEY = 'maeshub.night.v1';
  const PRESETS = [5, 10, 15, 20, 30, 45, 60];

  let endTime = null;       // ms epoch, null = no timer
  let interval = null;
  let warned = false;
  let locked = false;
  let taps = [];

  const $ = (id) => document.getElementById(id);

  function init() {
    $('night-lock-art').innerHTML = Chars.SLEEPY_PUP;

    const gatePad = Keypad.create((code, pad) => {
      if (code === PASSCODE) {
        pad.reset();
        $('night-gate').classList.add('hidden');
        openSetup();
      } else {
        Sound.bonk();
        pad.shake();
        pad.reset();
      }
    });
    $('night-pad').appendChild(gatePad.el);
    $('night-tile').addEventListener('click', () => {
      gatePad.reset();
      $('night-gate').classList.remove('hidden');
    });
    $('night-gate-cancel').addEventListener('click', () => $('night-gate').classList.add('hidden'));

    const presets = $('night-presets');
    PRESETS.forEach((min) => {
      const btn = document.createElement('button');
      btn.className = 'btn-pill btn-go preset-btn';
      btn.textContent = `${min} min`;
      btn.addEventListener('click', () => {
        Sound.fanfare();
        startTimer(min);
        $('night-setup').classList.add('hidden');
      });
      presets.appendChild(btn);
    });
    $('night-setup-close').addEventListener('click', () => $('night-setup').classList.add('hidden'));
    $('night-extend').addEventListener('click', () => {
      Sound.click();
      endTime += 5 * 60000;
      save();
      $('night-setup').classList.add('hidden');
    });
    $('night-end').addEventListener('click', () => {
      Sound.click();
      clearTimer();
      $('night-setup').classList.add('hidden');
    });
    $('night-warning-ok').addEventListener('click', () => {
      Sound.click();
      $('night-warning').classList.add('hidden');
    });

    // the 10-quick-taps grown-up escape hatch on the lock screen
    const unlockPad = Keypad.create((code, pad) => {
      if (code === PASSCODE) {
        Sound.fanfare();
        pad.reset();
        clearTimer();
      } else {
        Sound.bonk();
        pad.shake();
        pad.reset();
        $('night-unlock-box').classList.add('hidden');
      }
    });
    $('night-unlock-pad').appendChild(unlockPad.el);
    $('night-lock').addEventListener('pointerdown', (e) => {
      if (e.target.closest('#night-unlock-box')) return;
      const now = Date.now();
      taps = taps.filter((t) => now - t < 4000);
      taps.push(now);
      if (taps.length >= 10) {
        taps = [];
        unlockPad.reset();
        $('night-unlock-box').classList.remove('hidden');
      }
    });

    // resume a timer that was running when the app was closed
    try {
      const saved = JSON.parse(localStorage.getItem(STORE_KEY));
      if (saved && saved.end) {
        endTime = saved.end;
        warned = !!saved.warned;
        if (endTime - Date.now() <= 0) lock();
        else run();
      }
    } catch (e) { /* no timer */ }
  }

  function openSetup() {
    const active = endTime && endTime > Date.now();
    $('night-setup-text').textContent = active
      ? `Timer running — ${fmt(endTime - Date.now())} left. Add time or end it:`
      : 'How much playtime until bedtime?';
    $('night-presets').style.display = active ? 'none' : '';
    $('night-extend').classList.toggle('hidden', !active);
    $('night-end').classList.toggle('hidden', !active);
    $('night-setup').classList.remove('hidden');
  }

  function startTimer(min) {
    endTime = Date.now() + min * 60000;
    warned = min <= 5; // no 5-minute warning if the whole timer is 5 minutes
    save();
    run();
  }

  function save() {
    localStorage.setItem(STORE_KEY, JSON.stringify({ end: endTime, warned }));
  }

  function run() {
    $('night-bar').classList.remove('hidden');
    $('night-lock-icon').textContent = '⏳';
    if (interval) clearInterval(interval);
    interval = setInterval(tick, 500);
    tick();
  }

  function fmt(ms) {
    const s = Math.max(0, Math.ceil(ms / 1000));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }

  function tick() {
    const left = endTime - Date.now();
    $('night-time').textContent = fmt(left);

    if (left <= 300000 && !warned) {
      warned = true;
      save();
      Sound.bonk();
      $('night-warning').classList.remove('hidden');
    }

    const dim = $('night-dim');
    if (left <= 60000 && left > 0) {
      $('night-bar').classList.add('blink');
      dim.classList.remove('hidden');
      dim.style.opacity = ((60000 - left) / 60000) * 0.9;
    } else {
      $('night-bar').classList.remove('blink');
      if (left > 60000) { dim.classList.add('hidden'); dim.style.opacity = 0; }
    }

    if (left <= 0) lock();
  }

  function lock() {
    if (locked) return;
    locked = true;
    if (interval) clearInterval(interval);
    interval = null;
    save();
    $('night-warning').classList.add('hidden');
    $('night-bar').classList.add('hidden');
    $('night-dim').classList.add('hidden');
    $('night-unlock-box').classList.add('hidden');
    $('night-lock').classList.remove('hidden');
    Sound.sparkle();
  }

  function clearTimer() {
    endTime = null;
    warned = false;
    locked = false;
    taps = [];
    if (interval) clearInterval(interval);
    interval = null;
    localStorage.removeItem(STORE_KEY);
    $('night-bar').classList.add('hidden');
    $('night-bar').classList.remove('blink');
    $('night-dim').classList.add('hidden');
    $('night-dim').style.opacity = 0;
    $('night-lock').classList.add('hidden');
    $('night-unlock-box').classList.add('hidden');
    $('night-lock-icon').textContent = '🔒';
  }

  return { init };
})();
