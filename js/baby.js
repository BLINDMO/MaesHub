/* ============ Game 10: Baby Care ============
 * A premium baby-care sim for Mae. The baby cycles through needs — hungry,
 * dirty diaper, bath-time, wants to play, and sleepy. Tap the matching
 * care button (🍼 🧷 🛁 🧸 😴) to respond; baby reacts with a full
 * animated sequence and earns a star. Ten stars triggers a confetti party.
 */
const Baby = (() => {

  /* ----- needs catalogue ----- */
  const NEEDS = [
    { id: 'feed',   emoji: '🍼', label: 'Feed',   bubble: "I'm hungry!",        mood: 'crying',  care: 'crying' },
    { id: 'change', emoji: '🧷', label: 'Change', bubble: 'My diaper is yucky!', mood: 'frowning', care: 'crying' },
    { id: 'bath',   emoji: '🛁', label: 'Bath',   bubble: 'Splash time! 💦',     mood: 'frowning', care: 'crying' },
    { id: 'play',   emoji: '🧸', label: 'Play',   bubble: 'Play with me!',       mood: 'frowning', care: 'crying' },
    { id: 'sleep',  emoji: '😴', label: 'Sleep',  bubble: "I'm sleepy…",         mood: 'sleepy',   care: 'sleepy' },
  ];

  let stars = 0;
  let currentNeed = null;
  let caringInProgress = false;
  let needTimer = null;

  /* ----- SVG baby character ----- */
  function babySVG(mood) {
    // mood: 'happy' | 'crying' | 'frowning' | 'sleepy' | 'excited'

    const skinTop = '#fff0e0', skinBot = '#f5c599';
    const hairC   = '#c07830';
    const irisC   = '#4a8ed4';
    const suitTop = '#b8dcf5', suitBot = '#7ac0eb';

    /* Eye shapes per mood */
    function eye(cx, cy, mood) {
      const pupilOff = mood === 'sleepy' ? 1 : 0;
      const iris = mood === 'sleepy'
        ? `<ellipse cx="${cx}" cy="${cy + 4}" rx="11" ry="7" fill="${irisC}"/>
           <ellipse cx="${cx}" cy="${cy + 4}" rx="6"  ry="4" fill="#1a1a2e"/>
           <circle  cx="${cx + 3}" cy="${cy + 2}" r="2.5" fill="white"/>`
        : mood === 'crying'
        ? `<circle cx="${cx}" cy="${cy + 2}" r="11" fill="${irisC}"/>
           <circle cx="${cx}" cy="${cy + 2}" r="6"  fill="#1a1a2e"/>
           <circle cx="${cx + 4}" cy="${cy}"  r="3"  fill="white"/>
           <path d="M${cx - 5} ${cy + 14} Q${cx} ${cy + 22} ${cx + 5} ${cy + 14}" fill="#a8d8f5" opacity="0.85"/>`
        : `<circle cx="${cx}" cy="${cy + 2}" r="11" fill="${irisC}"/>
           <circle cx="${cx}" cy="${cy + 2}" r="6"  fill="#1a1a2e"/>
           <circle cx="${cx + 4}" cy="${cy}"  r="3"  fill="white"/>`;

      const lid = mood === 'sleepy'
        ? `<path d="M${cx-18} ${cy-4} Q${cx} ${cy-14} ${cx+18} ${cy-4}" fill="${skinBot}"/>`
        : mood === 'crying'
        ? `<path d="M${cx-18} ${cy-6} Q${cx} ${cy-18} ${cx+18} ${cy-6}" fill="${skinBot}"/>` : '';

      return `<g>
        <circle cx="${cx}" cy="${cy}" r="18" fill="white"/>
        ${iris}
        ${lid}
      </g>`;
    }

    /* Mouth per mood */
    const mouthY = 225;
    const mouth = mood === 'happy' || mood === 'excited'
      ? `<path d="M175 ${mouthY} Q200 ${mouthY + 22} 225 ${mouthY}" stroke="#e87a8a" stroke-width="4" fill="none" stroke-linecap="round"/>`
      : mood === 'crying'
      ? `<path d="M175 ${mouthY + 8} Q200 ${mouthY - 4} 225 ${mouthY + 8}" stroke="#e87a8a" stroke-width="4" fill="none" stroke-linecap="round"/>
         <path d="M183 ${mouthY + 12} Q200 ${mouthY + 22} 217 ${mouthY + 12}" fill="#e87a8a" opacity="0.55"/>`
      : mood === 'sleepy'
      ? `<path d="M182 ${mouthY + 10} Q200 ${mouthY + 14} 218 ${mouthY + 10}" stroke="#e87a8a" stroke-width="3.5" fill="none" stroke-linecap="round"/>`
      : `<path d="M182 ${mouthY + 6}  Q200 ${mouthY + 12} 218 ${mouthY + 6}"  stroke="#e87a8a" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;

    const stars_expr = mood === 'excited'
      ? `<text x="145" y="168" font-size="20" fill="#ffd700">✦</text>
         <text x="243" y="165" font-size="18" fill="#ffd700">✦</text>` : '';

    const zzz = mood === 'sleepy'
      ? `<text x="242" y="148" font-size="16" fill="#90b8e0" opacity="0.85">z</text>
         <text x="258" y="132" font-size="20" fill="#90b8e0" opacity="0.75">z</text>
         <text x="276" y="112" font-size="24" fill="#90b8e0" opacity="0.65">Z</text>` : '';

    return `<svg viewBox="0 0 400 510" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="b-head" cx="42%" cy="35%" r="60%">
          <stop offset="0"   stop-color="${skinTop}"/>
          <stop offset="1"   stop-color="${skinBot}"/>
        </radialGradient>
        <linearGradient id="b-suit" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${suitTop}"/>
          <stop offset="1" stop-color="${suitBot}"/>
        </linearGradient>
        <radialGradient id="b-cheek" cx="50%" cy="50%">
          <stop offset="0"   stop-color="rgba(255,130,130,0.4)"/>
          <stop offset="1"   stop-color="rgba(255,130,130,0)"/>
        </radialGradient>
        <filter id="b-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="rgba(0,0,0,0.12)"/>
        </filter>
      </defs>

      <!-- shadow under baby -->
      <ellipse cx="200" cy="498" rx="110" ry="16" fill="rgba(0,0,0,0.08)"/>

      <!-- body / onesie -->
      <ellipse cx="200" cy="368" rx="90" ry="112" fill="url(#b-suit)" filter="url(#b-shadow)"/>

      <!-- arms -->
      <ellipse cx="100" cy="330" rx="32" ry="22" fill="${skinBot}" transform="rotate(-35 100 330)"/>
      <ellipse cx="300" cy="330" rx="32" ry="22" fill="${skinBot}" transform="rotate(35 300 330)"/>
      <!-- hands -->
      <circle cx="76"  cy="353" r="26" fill="${skinTop}"/>
      <circle cx="324" cy="353" r="26" fill="${skinTop}"/>

      <!-- feet/booties -->
      <ellipse cx="155" cy="476" rx="48" ry="26" fill="${suitBot}"/>
      <ellipse cx="245" cy="476" rx="48" ry="26" fill="${suitBot}"/>
      <ellipse cx="148" cy="468" rx="32" ry="17" fill="${skinTop}"/>
      <ellipse cx="252" cy="468" rx="32" ry="17" fill="${skinTop}"/>

      <!-- ears -->
      <circle cx="110" cy="202" r="22" fill="${skinBot}"/>
      <circle cx="290" cy="202" r="22" fill="${skinBot}"/>
      <circle cx="110" cy="202" r="13" fill="${skinTop}" opacity="0.6"/>
      <circle cx="290" cy="202" r="13" fill="${skinTop}" opacity="0.6"/>

      <!-- head -->
      <circle cx="200" cy="200" r="92" fill="url(#b-head)" filter="url(#b-shadow)"/>

      <!-- hair tufts -->
      <path d="M180 118 Q182 100 192 108" stroke="${hairC}" stroke-width="7" fill="none" stroke-linecap="round"/>
      <path d="M200 114 Q200  96 200 106" stroke="${hairC}" stroke-width="7" fill="none" stroke-linecap="round"/>
      <path d="M220 118 Q218 100 208 108" stroke="${hairC}" stroke-width="7" fill="none" stroke-linecap="round"/>

      <!-- eyes -->
      ${eye(170, 185, mood)}
      ${eye(230, 185, mood)}

      <!-- blush cheeks -->
      <ellipse cx="150" cy="222" rx="26" ry="16" fill="url(#b-cheek)"/>
      <ellipse cx="250" cy="222" rx="26" ry="16" fill="url(#b-cheek)"/>

      <!-- nose -->
      <ellipse cx="200" cy="210" rx="8" ry="5" fill="${skinBot}" opacity="0.5"/>

      <!-- mouth -->
      ${mouth}

      <!-- onesie collar -->
      <path d="M148 300 Q200 285 252 300" stroke="${suitBot}" stroke-width="3" fill="none" opacity="0.6"/>

      <!-- onesie star decorations -->
      <text x="162" y="358" font-size="15" fill="white" opacity="0.55">✦</text>
      <text x="198" y="400" font-size="13" fill="white" opacity="0.5">✦</text>
      <text x="228" y="362" font-size="12" fill="white" opacity="0.5">✦</text>

      <!-- snap buttons -->
      <circle cx="186" cy="474" r="6" fill="${suitBot}"/>
      <circle cx="200" cy="479" r="6" fill="${suitBot}"/>
      <circle cx="214" cy="474" r="6" fill="${suitBot}"/>

      <!-- mood extras -->
      ${stars_expr}
      ${zzz}
    </svg>`;
  }

  /* ----- nursery background ----- */
  function nurserySVG() {
    return `<svg viewBox="0 0 800 440" xmlns="http://www.w3.org/2000/svg" style="position:absolute;inset:0;width:100%;height:100%">
      <defs>
        <linearGradient id="n-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#fef3fb"/><stop offset="1" stop-color="#fce6f6"/>
        </linearGradient>
        <linearGradient id="n-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#f5d9a8"/><stop offset="1" stop-color="#e8c07a"/>
        </linearGradient>
      </defs>

      <!-- wall -->
      <rect width="800" height="340" fill="url(#n-wall)"/>
      <!-- wall border stripe -->
      <rect y="270" width="800" height="20" fill="#f8c8e8" opacity="0.5"/>

      <!-- floor -->
      <rect y="300" width="800" height="140" fill="url(#n-floor)"/>
      <!-- floor planks -->
      ${[0,1,2,3,4,5,6,7].map(i=>`<line x1="${i*120}" y1="300" x2="${i*120+90}" y2="440" stroke="rgba(0,0,0,0.06)" stroke-width="2"/>`).join('')}

      <!-- left toy shelf -->
      <rect x="20" y="80" width="120" height="12" rx="6" fill="#c2844a"/>
      <rect x="30" y="50" width="30" height="30" rx="4" fill="#f48fb1"/>
      <rect x="70" y="45" width="28" height="35" rx="4" fill="#80cbc4"/>
      <rect x="105" y="52" width="25" height="28" rx="4" fill="#ffcc80"/>
      <!-- shelf bracket -->
      <rect x="22"  y="80" width="6" height="60" rx="3" fill="#a0622a"/>
      <rect x="128" y="80" width="6" height="60" rx="3" fill="#a0622a"/>

      <!-- right curtain -->
      <path d="M660 0 Q700 60 660 140 Q700 220 660 300" fill="#f48fb1" opacity="0.7"/>
      <path d="M800 0 Q760 60 800 140 Q760 220 800 300" fill="#f48fb1" opacity="0.7"/>
      <rect x="645" y="0" width="170" height="18" rx="9" fill="#e91e8c" opacity="0.5"/>

      <!-- mobile above (decorative) -->
      <line x1="350" y1="0" x2="350" y2="55" stroke="#bdbdbd" stroke-width="3"/>
      <line x1="290" y1="55" x2="410" y2="55" stroke="#bdbdbd" stroke-width="3"/>
      <line x1="290" y1="55" x2="290" y2="90" stroke="#bdbdbd" stroke-width="2"/>
      <line x1="350" y1="55" x2="350" y2="85" stroke="#bdbdbd" stroke-width="2"/>
      <line x1="410" y1="55" x2="410" y2="88" stroke="#bdbdbd" stroke-width="2"/>
      <circle cx="290" cy="100" r="16" fill="#f48fb1"/>
      <circle cx="350" cy="92"  r="16" fill="#80cbc4"/>
      <circle cx="410" cy="98"  r="16" fill="#ffcc80"/>
      <text x="283" y="105" font-size="14" text-anchor="middle">🌟</text>
      <text x="343" y="97"  font-size="14" text-anchor="middle">🌙</text>
      <text x="403" y="103" font-size="14" text-anchor="middle">⭐</text>

      <!-- wall art: rainbow -->
      <path d="M120 220 Q180 140 240 220" stroke="#ff8a80" stroke-width="10" fill="none" opacity="0.6"/>
      <path d="M128 220 Q180 152 232 220" stroke="#ffcc80" stroke-width="8"  fill="none" opacity="0.55"/>
      <path d="M136 220 Q180 162 224 220" stroke="#80cbc4" stroke-width="7"  fill="none" opacity="0.5"/>

      <!-- baby name banner -->
      <rect x="460" y="60" width="160" height="46" rx="12" fill="#f8bbd9" opacity="0.7"/>
      <text x="540" y="89" font-size="18" font-family="Georgia,serif" fill="#c2185b" text-anchor="middle">🍼 Baby 🍼</text>
    </svg>`;
  }

  /* ----- care overlays ----- */
  const CARE_EMOJI = { feed: '🍼', change: '✨🧷✨', bath: '🛁💦', play: '🧸🎉', sleep: '💤😴💤' };

  /* ----- DOM helpers ----- */
  function setBaby(mood) {
    const el = document.getElementById('baby-art');
    if (el) el.innerHTML = babySVG(mood);
  }

  function setBubble(text) {
    const el = document.getElementById('baby-bubble');
    if (!el) return;
    el.textContent = text;
    el.classList.remove('hidden', 'pop-in');
    void el.offsetWidth;
    el.classList.add('pop-in');
  }

  function hideBubble() {
    const el = document.getElementById('baby-bubble');
    if (el) el.classList.add('hidden');
  }

  function setStars(n) {
    const el = document.getElementById('baby-stars');
    if (el) el.textContent = '⭐ ' + n;
  }

  /* ----- game logic ----- */
  function pickNeed() {
    // avoid same need twice in a row
    const pool = NEEDS.filter(n => !currentNeed || n.id !== currentNeed.id);
    currentNeed = pool[Math.floor(Math.random() * pool.length)];
    setBaby(currentNeed.mood);
    setBubble(currentNeed.bubble);
    // highlight the matching button
    document.querySelectorAll('.baby-btn').forEach((b) => {
      b.classList.toggle('baby-btn-highlight', b.dataset.action === currentNeed.id);
    });
  }

  function handleCare(action) {
    if (caringInProgress || !currentNeed) return;

    if (action !== currentNeed.id) {
      Sound.bonk();
      const btn = document.querySelector(`.baby-btn[data-action="${action}"]`);
      if (btn) { btn.classList.add('shake'); setTimeout(() => btn.classList.remove('shake'), 500); }
      return;
    }

    caringInProgress = true;
    Sound.sparkle();

    // show care animation
    const scene = document.getElementById('baby-scene');
    const animEl = document.createElement('div');
    animEl.className = 'baby-care-anim';
    animEl.textContent = CARE_EMOJI[action] || '✨';
    scene.appendChild(animEl);

    setBaby('excited');
    hideBubble();

    setTimeout(() => {
      animEl.remove();
      setBaby('happy');
      setBubble('Yay! Thank you! 💖');
      stars++;
      setStars(stars);
      Sound.pop();

      if (stars > 0 && stars % 10 === 0) {
        Confetti.burst();
        setBubble("You're the best! 🎉💖");
        setTimeout(() => {
          caringInProgress = false;
          needTimer = setTimeout(pickNeed, 2500);
        }, 3000);
      } else {
        setTimeout(() => {
          caringInProgress = false;
          setBaby('happy');
          hideBubble();
          document.querySelectorAll('.baby-btn').forEach(b => b.classList.remove('baby-btn-highlight'));
          needTimer = setTimeout(pickNeed, 2000);
        }, 2000);
      }
    }, 1800);
  }

  /* ----- wiring ----- */
  function init() {
    const scene = document.getElementById('baby-scene');
    if (!scene) return;
    scene.insertAdjacentHTML('afterbegin', nurserySVG());
    scene.insertAdjacentHTML('beforeend', `
      <div id="baby-bubble" class="hidden"></div>
      <div id="baby-art"></div>
    `);

    document.querySelectorAll('.baby-btn').forEach((btn) => {
      btn.addEventListener('click', () => handleCare(btn.dataset.action));
    });
  }

  function start() {
    stars = 0;
    currentNeed = null;
    caringInProgress = false;
    setStars(stars);
    setBaby('happy');
    hideBubble();
    document.querySelectorAll('.baby-btn').forEach(b => b.classList.remove('baby-btn-highlight'));
    clearTimeout(needTimer);
    needTimer = setTimeout(pickNeed, 1500);
  }

  function stop() {
    clearTimeout(needTimer);
    caringInProgress = false;
    hideBubble();
  }

  return { init, start, stop };
})();
