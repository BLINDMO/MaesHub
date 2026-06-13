/* ============ Game: Baby Care ============
 * A hands-on baby-care playset. Five activity stations, each a real
 * direct-manipulation toy (not just a button that plays a clip):
 *   🍼 Feed   — drag the bottle to baby's mouth and watch it drain
 *   🛁 Bath   — scrub the sponge over the dirty smudges to wash them away
 *   🧷 Change — peel the old diaper, wipe, snap on a fresh one
 *   🧸 Play   — peekaboo + pop the floating balloons
 *   😴 Sleep  — rock the baby gently until she drifts off
 * Baby reacts the whole time; finishing a task earns a star + celebration.
 */
const Baby = (() => {
  let scene, stage, bg, figure, props, fx, prompt;
  let stars = 0;
  let station = null;
  let cleanup = [];        // teardown callbacks for the current station
  let intervals = [];      // running intervals to clear on stop

  /* ============================================================
     BABY ARTWORK
     ============================================================ */
  const SKIN = '#ffe0c4', SKIN_D = '#f3c098', HAIR = '#c98b3e';
  const IRIS = '#5aa0dc';

  // Just the face — swapped per emotion without redrawing the body
  function faceSVG(mood) {
    // open eyes with a happy/neutral look
    const openEye = (cx) => `
      <ellipse cx="${cx}" cy="183" rx="17" ry="19" fill="#fff"/>
      <circle cx="${cx}" cy="186" r="11" fill="${IRIS}"/>
      <circle cx="${cx}" cy="186" r="6"  fill="#22203a"/>
      <circle cx="${cx + 4}" cy="182" r="3.4" fill="#fff"/>`;
    // happy closed up-curve eyes (giggling)
    const happyEye = (cx, dir) => `
      <path d="M${cx - 15} 188 Q${cx} 172 ${cx + 15} 188" stroke="#5a3d24" stroke-width="5" fill="none" stroke-linecap="round"/>`;
    // sleepy half / closed
    const closedEye = (cx) => `
      <path d="M${cx - 15} 184 Q${cx} 196 ${cx + 15} 184" stroke="#5a3d24" stroke-width="4.5" fill="none" stroke-linecap="round"/>`;

    let eyes, mouth, extra = '';
    const M = 232; // mouth baseline
    if (mood === 'happy' || mood === 'clean') {
      eyes = openEye(168) + openEye(232);
      mouth = `<path d="M178 ${M} Q200 ${M + 20} 222 ${M}" stroke="#d96a78" stroke-width="5" fill="none" stroke-linecap="round"/>`;
    } else if (mood === 'giggly') {
      eyes = happyEye(168) + happyEye(232);
      mouth = `<path d="M176 ${M - 2} Q200 ${M + 26} 224 ${M - 2} Q200 ${M + 10} 176 ${M - 2} Z" fill="#c8556a"/>
               <path d="M186 ${M + 6} Q200 ${M + 14} 214 ${M + 6}" fill="#ff9eb0"/>`;
    } else if (mood === 'hungry') {
      eyes = openEye(168) + openEye(232);
      mouth = `<ellipse cx="200" cy="${M + 4}" rx="13" ry="15" fill="#c8556a"/>
               <ellipse cx="200" cy="${M + 9}" rx="7" ry="7" fill="#ff9eb0"/>`;
      extra = `<text x="250" y="172" font-size="22">💭</text>`;
    } else if (mood === 'eating') {
      eyes = closedEye(168) + closedEye(232);
      mouth = `<ellipse cx="200" cy="${M + 2}" rx="10" ry="12" fill="#c8556a"/>`;
    } else if (mood === 'sleepy') {
      eyes = `<path d="M153 184 Q168 192 183 184" stroke="#5a3d24" stroke-width="4.5" fill="none" stroke-linecap="round"/>
              <path d="M217 184 Q232 192 247 184" stroke="#5a3d24" stroke-width="4.5" fill="none" stroke-linecap="round"/>`;
      mouth = `<ellipse cx="200" cy="${M + 4}" rx="9" ry="11" fill="#c8556a" opacity="0.85"/>`;
    } else if (mood === 'asleep') {
      eyes = closedEye(168) + closedEye(232);
      mouth = `<path d="M190 ${M + 2} Q200 ${M + 8} 210 ${M + 2}" stroke="#d96a78" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
    } else if (mood === 'crying') {
      eyes = `<path d="M153 188 Q168 174 183 188" stroke="#5a3d24" stroke-width="5" fill="none" stroke-linecap="round"/>
              <path d="M217 188 Q232 174 247 188" stroke="#5a3d24" stroke-width="5" fill="none" stroke-linecap="round"/>
              <path d="M160 196 q-4 14 2 22" stroke="#9fd6f5" stroke-width="5" fill="none" stroke-linecap="round"/>
              <path d="M240 196 q4 14 -2 22" stroke="#9fd6f5" stroke-width="5" fill="none" stroke-linecap="round"/>`;
      mouth = `<ellipse cx="200" cy="${M + 6}" rx="14" ry="13" fill="#c8556a"/>`;
    } else { // neutral fallback
      eyes = openEye(168) + openEye(232);
      mouth = `<path d="M184 ${M + 2} Q200 ${M + 8} 216 ${M + 2}" stroke="#d96a78" stroke-width="4.5" fill="none" stroke-linecap="round"/>`;
    }

    return `
      <!-- hair tufts -->
      <path d="M182 112 Q186 92 196 104" stroke="${HAIR}" stroke-width="8" fill="none" stroke-linecap="round"/>
      <path d="M200 108 Q200 88 200 100" stroke="${HAIR}" stroke-width="8" fill="none" stroke-linecap="round"/>
      <path d="M218 112 Q214 92 204 104" stroke="${HAIR}" stroke-width="8" fill="none" stroke-linecap="round"/>
      <!-- eyebrows -->
      <path d="M156 160 Q168 154 180 159" stroke="${HAIR}" stroke-width="4" fill="none" stroke-linecap="round" opacity="0.7"/>
      <path d="M220 159 Q232 154 244 160" stroke="${HAIR}" stroke-width="4" fill="none" stroke-linecap="round" opacity="0.7"/>
      ${eyes}
      <!-- nose -->
      <ellipse cx="200" cy="210" rx="7" ry="5" fill="${SKIN_D}" opacity="0.55"/>
      ${mouth}
      <!-- blush -->
      <ellipse cx="156" cy="214" rx="18" ry="11" fill="#ff9aa8" opacity="0.45"/>
      <ellipse cx="244" cy="214" rx="18" ry="11" fill="#ff9aa8" opacity="0.45"/>
      ${extra}`;
  }

  // Full sitting baby. `outfit`: 'onesie' (default) | 'diaper' | 'bare'
  function babySVG(mood, outfit) {
    outfit = outfit || 'onesie';
    const suitTop = '#bfe3ff', suitBot = '#7cc0ee';

    let bodyFill, legs;
    if (outfit === 'onesie') {
      bodyFill = `<ellipse cx="200" cy="372" rx="92" ry="116" fill="url(#b-suit)"/>`;
      legs = `<ellipse cx="160" cy="476" rx="40" ry="26" fill="${suitBot}"/>
              <ellipse cx="240" cy="476" rx="40" ry="26" fill="${suitBot}"/>
              <ellipse cx="156" cy="470" rx="26" ry="16" fill="${SKIN}"/>
              <ellipse cx="244" cy="470" rx="26" ry="16" fill="${SKIN}"/>`;
    } else {
      // bare / diaper: skin tummy
      bodyFill = `<ellipse cx="200" cy="372" rx="86" ry="110" fill="url(#b-skin)"/>
                  <ellipse cx="200" cy="356" rx="60" ry="40" fill="${SKIN_D}" opacity="0.18"/>
                  <ellipse cx="200" cy="368" rx="5" ry="7" fill="${SKIN_D}" opacity="0.45"/>`;
      legs = `<ellipse cx="160" cy="470" rx="34" ry="24" fill="${SKIN}"/>
              <ellipse cx="240" cy="470" rx="34" ry="24" fill="${SKIN}"/>`;
      if (outfit === 'diaper') {
        bodyFill += `<path d="M138 392 Q200 372 262 392 L256 452 Q200 474 144 452 Z" fill="#fff"/>
                     <path d="M138 392 Q200 408 262 392" stroke="#dfe9f2" stroke-width="3" fill="none"/>
                     <circle cx="200" cy="420" r="8" fill="#ffd0e0"/>`;
      }
    }

    return `<svg viewBox="0 0 400 520" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="b-head" cx="42%" cy="34%" r="62%">
          <stop offset="0" stop-color="#fff3e6"/><stop offset="1" stop-color="${SKIN_D}"/>
        </radialGradient>
        <radialGradient id="b-skin" cx="50%" cy="40%" r="65%">
          <stop offset="0" stop-color="#fff0e0"/><stop offset="1" stop-color="${SKIN_D}"/>
        </radialGradient>
        <linearGradient id="b-suit" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${suitTop}"/><stop offset="1" stop-color="${suitBot}"/>
        </linearGradient>
      </defs>

      ${legs}
      ${bodyFill}

      <!-- arms -->
      <ellipse cx="118" cy="332" rx="34" ry="22" fill="${outfit==='onesie'?suitBot:SKIN}" transform="rotate(-28 118 332)"/>
      <ellipse cx="282" cy="332" rx="34" ry="22" fill="${outfit==='onesie'?suitBot:SKIN}" transform="rotate(28 282 332)"/>
      <circle cx="92"  cy="350" r="24" fill="${SKIN}"/>
      <circle cx="308" cy="350" r="24" fill="${SKIN}"/>

      <!-- ears -->
      <circle cx="118" cy="196" r="20" fill="${SKIN_D}"/>
      <circle cx="282" cy="196" r="20" fill="${SKIN_D}"/>
      <!-- head -->
      <circle cx="200" cy="196" r="96" fill="url(#b-head)"/>
      ${faceSVG(mood)}
    </svg>`;
  }

  /* ============================================================
     PROP ARTWORK
     ============================================================ */
  function bottleSVG(level) { // level 1 = full milk, 0 = empty
    const milkTop = 78 - level * 52; // y where milk starts (lower number = more milk)
    return `<svg viewBox="0 0 70 150" xmlns="http://www.w3.org/2000/svg">
      <defs><clipPath id="bot-clip"><rect x="14" y="28" width="42" height="104" rx="14"/></clipPath></defs>
      <!-- nipple -->
      <path d="M28 4 Q35 -4 42 4 L44 18 Q35 24 26 18 Z" fill="#ffd9a0"/>
      <rect x="22" y="18" width="26" height="12" rx="5" fill="#ffe6c2"/>
      <!-- collar -->
      <rect x="16" y="26" width="38" height="10" rx="4" fill="#dfe9f2"/>
      <!-- body -->
      <rect x="14" y="28" width="42" height="104" rx="14" fill="#eaf4ff" stroke="#bcd3e8" stroke-width="2"/>
      <!-- milk -->
      <rect x="14" y="${milkTop}" width="42" height="${132 - milkTop}" fill="#fff" clip-path="url(#bot-clip)"/>
      <rect x="14" y="${milkTop}" width="42" height="6" fill="#fbeede" clip-path="url(#bot-clip)"/>
      <!-- measure lines -->
      <line x1="48" y1="50" x2="54" y2="50" stroke="#bcd3e8" stroke-width="2"/>
      <line x1="48" y1="74" x2="54" y2="74" stroke="#bcd3e8" stroke-width="2"/>
      <line x1="48" y1="98" x2="54" y2="98" stroke="#bcd3e8" stroke-width="2"/>
      <!-- shine -->
      <rect x="20" y="40" width="6" height="80" rx="3" fill="#fff" opacity="0.6"/>
    </svg>`;
  }

  const SPONGE_SVG = `<svg viewBox="0 0 90 70" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="20" width="78" height="44" rx="14" fill="#ffd54a" stroke="#e8b520" stroke-width="2"/>
    <rect x="6" y="20" width="78" height="16" rx="8" fill="#9fe0f5" opacity="0.9"/>
    ${Array.from({length:9},(_, i)=>`<circle cx="${16+i*8}" cy="${44+(i%2)*8}" r="2.6" fill="#e8b520"/>`).join('')}
    <!-- bubbles on top -->
    <circle cx="24" cy="16" r="9" fill="#eafaff" opacity="0.95"/>
    <circle cx="42" cy="10" r="11" fill="#eafaff" opacity="0.95"/>
    <circle cx="60" cy="15" r="8" fill="#eafaff" opacity="0.95"/>
    <circle cx="40" cy="9" r="3" fill="#fff"/>
  </svg>`;

  const WIPE_SVG = `<svg viewBox="0 0 80 70" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="14" width="64" height="46" rx="10" fill="#eafaff" stroke="#bcd3e8" stroke-width="2"/>
    <path d="M16 30 H64 M16 40 H64 M16 50 H56" stroke="#bcd3e8" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M20 14 Q40 4 60 14" stroke="#9fe0f5" stroke-width="5" fill="none" stroke-linecap="round"/>
  </svg>`;

  const DUCK_SVG = `<svg viewBox="0 0 80 70" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="40" cy="48" rx="28" ry="18" fill="#ffd93b"/>
    <circle cx="54" cy="30" r="16" fill="#ffd93b"/>
    <path d="M66 30 L80 33 L66 38 Z" fill="#ff9a3b"/>
    <circle cx="58" cy="27" r="3" fill="#3a3a3a"/>
    <circle cx="59" cy="26" r="1" fill="#fff"/>
    <path d="M20 46 Q12 50 18 56" stroke="#f0b800" stroke-width="3" fill="none"/>
  </svg>`;

  /* ============================================================
     SCENE BACKGROUNDS (per station)
     ============================================================ */
  function nurseryBG(night) {
    const wall = night
      ? `<linearGradient id="n-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b2c54"/><stop offset="1" stop-color="#474a82"/></linearGradient>`
      : `<linearGradient id="n-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fdf0fa"/><stop offset="1" stop-color="#fbe4f4"/></linearGradient>`;
    const floor = night ? '#3a3c66' : '#f3d6a4';
    const stars = night
      ? Array.from({length:14},()=>`<circle cx="${Math.random()*800|0}" cy="${Math.random()*230|0}" r="${1.5+Math.random()*1.5|0}" fill="#fff" opacity="${0.5+Math.random()*0.5}"/>`).join('')
      : '';
    const moon = night ? `<circle cx="690" cy="70" r="40" fill="#fff7d6"/><circle cx="706" cy="60" r="34" fill="${'#474a82'}"/>` : '';
    return `<svg viewBox="0 0 800 440" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs>${wall}</defs>
      <rect width="800" height="330" fill="url(#n-wall)"/>
      ${stars}${moon}
      <rect y="300" width="800" height="140" fill="${floor}"/>
      <rect y="300" width="800" height="10" fill="rgba(0,0,0,0.08)"/>
      <!-- mobile -->
      <line x1="400" y1="0" x2="400" y2="40" stroke="${night?'#888':'#cdb6cf'}" stroke-width="3"/>
      <line x1="350" y1="40" x2="450" y2="40" stroke="${night?'#888':'#cdb6cf'}" stroke-width="3"/>
      <text x="338" y="68" font-size="22">${night?'🌙':'⭐'}</text>
      <text x="430" y="68" font-size="22">${night?'⭐':'🌙'}</text>
      <!-- rainbow wall art -->
      <path d="M70 250 Q130 175 190 250" stroke="#ff9aa8" stroke-width="11" fill="none" opacity="${night?0.3:0.6}"/>
      <path d="M80 250 Q130 190 180 250" stroke="#ffd86b" stroke-width="9" fill="none" opacity="${night?0.3:0.55}"/>
      <path d="M90 250 Q130 205 170 250" stroke="#8fd3a8" stroke-width="8" fill="none" opacity="${night?0.3:0.5}"/>
    </svg>`;
  }

  /* ============================================================
     LOW-LEVEL HELPERS
     ============================================================ */
  function setBaby(mood, outfit) { figure.innerHTML = babySVG(mood, outfit); }

  function say(text) {
    prompt.textContent = text;
    prompt.classList.remove('hidden', 'pop');
    void prompt.offsetWidth;
    prompt.classList.add('pop');
  }

  function rect(el) { return el.getBoundingClientRect(); }
  function centerDist(a, b) {
    const r1 = rect(a), r2 = rect(b);
    const dx = (r1.left + r1.width/2) - (r2.left + r2.width/2);
    const dy = (r1.top + r1.height/2) - (r2.top + r2.height/2);
    return Math.hypot(dx, dy);
  }
  // a point on the baby, given as fractions of the figure's own box
  function babyPoint(fx, fy) {
    const r = rect(figure);
    return { x: r.left + r.width * fx, y: r.top + r.height * fy };
  }
  function distToPoint(el, pt) {
    const r = rect(el);
    return Math.hypot(r.left + r.width/2 - pt.x, r.top + r.height/2 - pt.y);
  }
  // place a prop at a point on the baby, written as a % of the stage
  function placeOnBaby(el, fx, fy) {
    const r = rect(figure), s = rect(stage);
    el.style.left = ((r.left + r.width * fx - s.left) / s.width * 100) + '%';
    el.style.top  = ((r.top + r.height * fy - s.top) / s.height * 100) + '%';
  }

  function spawnFX(emoji, xPct, yPct, opts) {
    opts = opts || {};
    const s = document.createElement('span');
    s.className = 'baby-fx-bit';
    s.textContent = emoji;
    s.style.left = xPct + '%';
    s.style.top = yPct + '%';
    s.style.setProperty('--dx', (opts.dx ?? (Math.random()*80-40)) + 'px');
    s.style.setProperty('--dy', (opts.dy ?? -(50+Math.random()*50)) + 'px');
    s.style.fontSize = (opts.size || 28) + 'px';
    fx.appendChild(s);
    setTimeout(() => s.remove(), opts.life || 1100);
  }

  function burst(emojis, n, xPct, yPct) {
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * Math.PI * 2;
      spawnFX(emojis[i % emojis.length], xPct, yPct, {
        dx: Math.cos(ang) * 70, dy: Math.sin(ang) * 70 - 20,
      });
    }
  }

  // Draggable prop. opts: { onMove, onDrop, home:true }
  function makeDraggable(el, opts) {
    opts = opts || {};
    let dragging = false, offX = 0, offY = 0;
    el.style.touchAction = 'none';
    el.classList.add('baby-prop');

    function down(e) {
      dragging = true;
      el.classList.add('grabbing');
      const r = rect(el), s = rect(stage);
      // capture the original resting spot (in px, relative to stage) once
      if (el.dataset.homeL === undefined) {
        el.dataset.homeL = r.left - s.left;
        el.dataset.homeT = r.top - s.top;
      }
      offX = e.clientX - r.left;
      offY = e.clientY - r.top;
      try { el.setPointerCapture(e.pointerId); } catch (_) {}
      opts.onStart && opts.onStart();
    }
    function move(e) {
      if (!dragging) return;
      const s = rect(stage);
      el.style.left = (e.clientX - s.left - offX) + 'px';
      el.style.top = (e.clientY - s.top - offY) + 'px';
      el.style.transform = 'none';
      opts.onMove && opts.onMove();
    }
    function up() {
      if (!dragging) return;
      dragging = false;
      el.classList.remove('grabbing');
      opts.onDrop && opts.onDrop();
      if (opts.home && el.dataset.homeL !== undefined) {
        el.classList.add('snapping');
        el.style.left = el.dataset.homeL + 'px';
        el.style.top = el.dataset.homeT + 'px';
        el.style.transform = '';
        setTimeout(() => el.classList.remove('snapping'), 320);
      }
    }
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    cleanup.push(() => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
    });
  }

  function makeProp(html, cls, leftPct, topPct, w) {
    const el = document.createElement('div');
    el.className = 'baby-prop ' + (cls || '');
    el.innerHTML = html;
    el.style.position = 'absolute';
    el.style.left = leftPct + '%';
    el.style.top = topPct + '%';
    el.style.width = w + 'px';
    props.appendChild(el);
    return el;
  }

  function clearStage() {
    cleanup.forEach((fn) => { try { fn(); } catch (_) {} });
    cleanup = [];
    intervals.forEach(clearInterval);
    intervals = [];
    props.innerHTML = '';
    fx.innerHTML = '';
    scene.classList.remove('baby-night');
  }

  function win(message, bonusEmojis) {
    stars++;
    setStars(stars);
    Sound.yay();
    if (typeof throwConfetti === 'function') throwConfetti(120);
    say(message);
    burst(bonusEmojis || ['⭐','💖','✨'], 12, 50, 40);
    // gentle "do it again or pick another" — keep current station playable
  }

  function setStars(n) {
    const el = document.getElementById('baby-stars');
    if (el) el.textContent = '⭐ ' + n;
  }

  /* ============================================================
     STATION: FEED 🍼
     ============================================================ */
  function startFeed() {
    bg.innerHTML = nurseryBG(false);
    setBaby('hungry', 'onesie');
    say("Baby is hungry! Drag the bottle to her mouth. 🍼");

    let level = 1, feeding = false, done = false;
    const bottle = makeProp(bottleSVG(level), 'bottle', 74, 58, 64);

    function tick() {
      if (done) return;
      const near = distToPoint(bottle, babyPoint(0.5, 0.44)) < 78;
      if (near && level > 0) {
        if (!feeding) { feeding = true; setBaby('eating', 'onesie'); Sound.slurp(); }
        level = Math.max(0, level - 0.018);
        bottle.innerHTML = bottleSVG(level);
        if (Math.random() < 0.15) spawnFX('💛', 50, 42, { size: 18, life: 700 });
        if (level <= 0 && !done) finish();
      } else if (feeding) {
        feeding = false;
        if (!done) setBaby('hungry', 'onesie');
      }
    }
    intervals.push(setInterval(tick, 60));

    function finish() {
      done = true;
      setBaby('content', 'onesie');
      setBaby('happy', 'onesie');
      setTimeout(() => { Sound.burp(); spawnFX('💨', 56, 36, { size: 26 }); setBaby('giggly','onesie'); }, 500);
      win('All full! *burp* Thank you! 💖', ['💖','🍼','⭐']);
      bottle.style.opacity = '0.35';
    }

    makeDraggable(bottle, { home: false });
  }

  /* ============================================================
     STATION: BATH 🛁
     ============================================================ */
  function startBath() {
    bg.innerHTML = nurseryBG(false);
    setBaby('happy', 'bare');
    say('Baby is mucky! Scrub the sponge over the dirty spots. 🧽');

    // tub drawn in front of the baby's lower half
    const tub = document.createElement('div');
    tub.className = 'baby-tub';
    tub.innerHTML = `<svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="200" cy="60" rx="180" ry="38" fill="#bfe8fb"/>
      <path d="M20 60 Q20 190 70 196 L330 196 Q380 190 380 60 Z" fill="#dff3ff"/>
      <path d="M20 60 Q200 110 380 60 L380 90 Q200 140 20 90 Z" fill="#9fdcf7"/>
      <path d="M20 76 Q200 126 380 76" stroke="#7cc7ec" stroke-width="4" fill="none" opacity="0.6"/>
      <rect x="14" y="52" width="372" height="18" rx="9" fill="#eaf7ff"/>
      <ellipse cx="120" cy="64" rx="14" ry="6" fill="#fff" opacity="0.8"/>
      <ellipse cx="250" cy="70" rx="18" ry="7" fill="#fff" opacity="0.7"/>
    </svg>`;
    props.appendChild(tub);

    // floating bubbles on the water (decor)
    ['💧','🫧','🫧','💦'].forEach((b,i)=>{ const e=makeProp(`<span style="font-size:22px">${b}</span>`,'bath-bubble',20+i*20,66,30); e.style.pointerEvents='none'; });

    // dirty smudges over the baby's visible upper body (anchored to the figure)
    const SPOTS = [[0.42,0.34],[0.58,0.36],[0.5,0.5],[0.3,0.6],[0.7,0.6],[0.5,0.64]];
    const smudges = SPOTS.map(([fx,fy]) => {
      const sm = document.createElement('div');
      sm.className = 'baby-smudge';
      sm.innerHTML = `<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="14" fill="#a9794a" opacity="0.85"/><circle cx="14" cy="16" r="6" fill="#8a5f37" opacity="0.7"/><circle cx="26" cy="24" r="5" fill="#8a5f37" opacity="0.7"/></svg>`;
      props.appendChild(sm);
      placeOnBaby(sm, fx, fy);
      return sm;
    });
    let remaining = smudges.length;

    const sponge = makeProp(SPONGE_SVG, 'sponge', 76, 70, 72);
    makeDraggable(sponge, {
      home: true,
      onMove() {
        smudges.forEach((sm) => {
          if (sm.dataset.gone) return;
          if (centerDist(sponge, sm) < 46) {
            sm.dataset.gone = '1';
            sm.classList.add('washing');
            Sound.splash();
            const r = sm.getBoundingClientRect(), s = rect(stage);
            const xp = ((r.left + r.width/2 - s.left) / s.width) * 100;
            const yp = ((r.top + r.height/2 - s.top) / s.height) * 100;
            spawnFX('🫧', xp, yp, { size: 22, dy: -40 });
            setTimeout(() => sm.remove(), 320);
            remaining--;
            if (remaining === 0) finish();
          }
        });
      },
    });

    function finish() {
      setBaby('giggly', 'bare');
      Sound.squeak();
      say('Squeaky clean! 🦆✨');
      // rubber duck hops in to celebrate
      const duck = makeProp(DUCK_SVG, 'duck-pop', 50, 30, 64);
      duck.style.pointerEvents = 'none';
      win('So fresh and clean! 🛁💖', ['🫧','🦆','✨']);
    }
  }

  /* ============================================================
     STATION: CHANGE 🧷  (3-step sequence)
     ============================================================ */
  function startChange() {
    bg.innerHTML = nurseryBG(false);
    setBaby('crying', 'bare');
    say('Uh oh, yucky diaper! Tap it to take it off. 1️⃣');

    let step = 0;
    // old (dirty) diaper to peel
    const oldD = makeProp(
      `<svg viewBox="0 0 120 80"><path d="M10 16 Q60 0 110 16 L100 64 Q60 82 20 64 Z" fill="#e8e2d0"/><circle cx="44" cy="44" r="7" fill="#b89a52" opacity="0.7"/><circle cx="72" cy="40" r="6" fill="#b89a52" opacity="0.7"/><circle cx="58" cy="54" r="5" fill="#a98c44" opacity="0.7"/></svg>`,
      'diaper-old', 38, 64, 96);
    oldD.style.cursor = 'pointer';

    function tapStep1() {
      if (step !== 0) return;
      step = 1;
      Sound.pop();
      oldD.classList.add('peel-away');
      setTimeout(() => oldD.remove(), 400);
      setBaby('happy', 'bare');
      say('Now wipe to clean. Drag the wipe! 2️⃣');
      // wipe step — scrub over the baby's lower tummy
      const wipe = makeProp(WIPE_SVG, 'wipe', 74, 64, 64);
      let wiped = 0;
      makeDraggable(wipe, {
        home: true,
        onMove() {
          if (step !== 1) return;
          if (distToPoint(wipe, babyPoint(0.5, 0.74)) < 70) {
            wiped++;
            if (wiped % 6 === 0) spawnFX('✨', 50, 72, { size: 18, life: 600 });
            if (wiped > 30) tapStep2(wipe);
          }
        },
      });
    }

    function tapStep2(wipe) {
      if (step !== 1) return;
      step = 2;
      Sound.sparkle();
      wipe.remove();
      say('All clean! Tap the fresh diaper to put it on. 3️⃣');
      const freshD = makeProp(
        `<svg viewBox="0 0 120 80"><path d="M10 16 Q60 0 110 16 L100 64 Q60 82 20 64 Z" fill="#fff" stroke="#dfe9f2" stroke-width="2"/><circle cx="60" cy="40" r="9" fill="#ffd0e0"/><path d="M30 24 Q60 14 90 24" stroke="#bfe3ff" stroke-width="4" fill="none"/></svg>`,
        'diaper-fresh', 70, 18, 96);
      freshD.style.cursor = 'pointer';
      freshD.addEventListener('pointerdown', () => {
        if (step !== 2) return;
        step = 3;
        freshD.remove();
        setBaby('giggly', 'diaper');
        win('Fresh and dry! So comfy! 🧷💖', ['💖','✨','🧷']);
      });
    }

    oldD.addEventListener('pointerdown', tapStep1);
  }

  /* ============================================================
     STATION: PLAY 🧸  (peekaboo + pop balloons)
     ============================================================ */
  function startPlay() {
    bg.innerHTML = nurseryBG(false);
    setBaby('happy', 'onesie');
    say('Tap baby for peekaboo, and pop the balloons! 🎈');

    let pops = 0, peeks = 0, won = false;

    // tap the baby = peekaboo
    const handFn = () => {
      if (won) return;
      const hands = makeProp(`<span style="font-size:90px">🙈</span>`, 'peekaboo', 38, 22, 120);
      hands.style.pointerEvents = 'none';
      setBaby('happy', 'onesie');
      setTimeout(() => {
        hands.remove();
        setBaby('giggly', 'onesie');
        Sound.giggle();
        say('Peekaboo! 🙈');
        peeks++;
        spawnFX('😄', 50, 28, { size: 30 });
        maybeWin();
      }, 600);
    };
    figure.style.cursor = 'pointer';
    figure.addEventListener('pointerdown', handFn);
    cleanup.push(() => { figure.removeEventListener('pointerdown', handFn); figure.style.cursor = ''; });

    // floating balloons to pop
    const COLORS = ['🎈','🩷','💜','💚','💙'];
    function spawnBalloon() {
      if (won) return;
      const b = document.createElement('button');
      b.className = 'baby-balloon';
      b.textContent = COLORS[Math.floor(Math.random()*COLORS.length)];
      const x = 8 + Math.random()*78;
      b.style.left = x + '%';
      b.style.bottom = '-60px';
      b.style.setProperty('--sway', (Math.random()*40-20) + 'px');
      b.style.animationDuration = (6 + Math.random()*4) + 's';
      props.appendChild(b);
      b.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        Sound.pop();
        const s = rect(stage), r = b.getBoundingClientRect();
        spawnFX('✨', ((r.left+r.width/2-s.left)/s.width)*100, ((r.top+r.height/2-s.top)/s.height)*100, { size: 22 });
        b.remove();
        pops++;
        maybeWin();
      });
      b.addEventListener('animationend', () => b.remove());
    }
    intervals.push(setInterval(spawnBalloon, 1400));
    spawnBalloon();

    function maybeWin() {
      if (won || pops < 5 || peeks < 2) return;
      won = true;
      win('What a fun playtime! 🎈😄', ['🎈','😄','⭐']);
    }
  }

  /* ============================================================
     STATION: SLEEP 😴  (rock to sleep)
     ============================================================ */
  function startSleep() {
    bg.innerHTML = nurseryBG(true);
    scene.classList.add('baby-night');
    setBaby('sleepy', 'onesie');
    say('Shhh… rock the baby gently to sleep. Drag left and right. 🌙');

    // a soft blanket/crib feel
    const crib = document.createElement('div');
    crib.className = 'baby-crib';
    crib.innerHTML = `<svg viewBox="0 0 400 120" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 30 Q200 -10 390 30 L390 90 Q200 120 10 90 Z" fill="#b9a0e0" opacity="0.55"/>
      <path d="M10 30 Q200 70 390 30" stroke="#cdb6e8" stroke-width="4" fill="none"/>
    </svg>`;
    props.appendChild(crib);

    // rocking: drag left↔right across the baby; each change of direction
    // is one "rock" that makes her drowsier. Keep her centered (translateX -50%).
    let dragging = false, lastX = null, dir = 0, sleepy = 0, asleep = false;
    const BASE = 'translateX(-50%)';
    figure.classList.add('rockable');
    figure.style.transform = BASE;

    function tilt(deg) { figure.style.transform = `${BASE} rotate(${deg}deg)`; }

    function down(e) {
      if (asleep) return;
      dragging = true; lastX = e.clientX;
      try { figure.setPointerCapture(e.pointerId); } catch (_) {}
    }
    function move(e) {
      if (!dragging || asleep) return;
      const dx = e.clientX - lastX;
      tilt(Math.max(-10, Math.min(10, dx * 0.5)));
      const ndir = Math.sign(dx);
      if (ndir !== 0 && ndir !== dir && Math.abs(dx) > 12) {
        dir = ndir;
        sleepy = Math.min(100, sleepy + 12);
        spawnFX('💤', 56, 22, { size: 20, dy: -55 });
        Sound.lullaby();
        if (sleepy >= 45) setBaby('sleepy', 'onesie');
        if (sleepy >= 100) fallAsleep();
      }
      lastX = e.clientX;
    }
    function up() { dragging = false; if (!asleep) tilt(0); }

    figure.addEventListener('pointerdown', down);
    figure.addEventListener('pointermove', move);
    figure.addEventListener('pointerup', up);
    figure.addEventListener('pointercancel', up);

    function fallAsleep() {
      if (asleep) return;
      asleep = true;
      figure.style.transform = BASE;
      setBaby('asleep', 'onesie');
      scene.classList.add('baby-dim');
      for (let i = 0; i < 3; i++) spawnFX('💤', 56, 22, { size: 20 + i*6, dy: -60 - i*20, life: 1600 });
      Sound.lullaby();
      say('Sweet dreams, baby… 🌙💫');
      win('Baby is fast asleep! 🌙😴', ['💤','🌙','⭐']);
      setTimeout(() => scene.classList.remove('baby-dim'), 2600);
    }

    cleanup.push(() => {
      figure.removeEventListener('pointerdown', down);
      figure.removeEventListener('pointermove', move);
      figure.removeEventListener('pointerup', up);
      figure.removeEventListener('pointercancel', up);
      figure.classList.remove('rockable');
      figure.style.transform = '';
      scene.classList.remove('baby-dim');
    });
  }

  /* ============================================================
     STATION SWITCHING
     ============================================================ */
  const STATIONS = { feed: startFeed, bath: startBath, change: startChange, play: startPlay, sleep: startSleep };

  function selectStation(name) {
    if (!STATIONS[name]) return;
    station = name;
    clearStage();
    document.querySelectorAll('.baby-btn').forEach((b) =>
      b.classList.toggle('baby-btn-active', b.dataset.action === name));
    STATIONS[name]();
  }

  /* ============================================================
     WIRING
     ============================================================ */
  function init() {
    scene = document.getElementById('baby-scene');
    if (!scene) return;
    scene.innerHTML = `
      <div id="baby-bg"></div>
      <div id="baby-stage">
        <div id="baby-figure"></div>
        <div id="baby-props"></div>
        <div id="baby-fx"></div>
      </div>
      <div id="baby-prompt" class="hidden"></div>`;
    bg = document.getElementById('baby-bg');
    stage = document.getElementById('baby-stage');
    figure = document.getElementById('baby-figure');
    props = document.getElementById('baby-props');
    fx = document.getElementById('baby-fx');
    prompt = document.getElementById('baby-prompt');

    document.querySelectorAll('.baby-btn').forEach((btn) => {
      btn.addEventListener('click', () => { Sound.pop(); selectStation(btn.dataset.action); });
    });
  }

  function start() {
    stars = 0;
    setStars(stars);
    selectStation('feed');
  }

  function stop() {
    clearStage();
  }

  return { init, start, stop };
})();
