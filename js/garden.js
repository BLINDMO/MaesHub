/* ============ Game 4: Magic Garden 2.0 ============
 * A storybook garden, fully hand-drawn in crisp SVG: rolling hills, a
 * white picket fence, drifting clouds and a smiling sun. Ten tilled soil
 * plots wait in two tidy rows. Pick seeds (flowers AND fruits), tap a
 * plot to plant, then switch to the watering can and tap the plant: it
 * grows through drawn stages — stem, leaves, bud — into a hand-drawn
 * bloom that sways in the breeze. Sunflowers are the stars: tallest of
 * all, with golden petals, a seed-spiral face and their own celebration.
 * Five blooms paint a rainbow; fill all ten plots for the grand finale.
 */
const Garden = (() => {
  const MAX_UNWATERED = 5;
  const GROW_SECONDS = 20;
  const FLOWER_IDS = ['sunflower', 'tulip', 'rose', 'daisy', 'blossom'];
  const BUTTERFLIES = ['🦋', '🐝', '🐞'];

  const SEEDS = [
    { id: 'mix', icon: '✨', name: 'Surprise' },
    { id: 'sunflower', icon: '🌻', name: 'Sunflower' },
    { id: 'tulip', icon: '🌷', name: 'Tulip' },
    { id: 'rose', icon: '🌹', name: 'Rose' },
    { id: 'daisy', icon: '🌼', name: 'Daisy' },
    { id: 'blossom', icon: '🌸', name: 'Blossom' },
    { id: 'strawberry', icon: '🍓', name: 'Strawberry' },
    { id: 'watermelon', icon: '🍉', name: 'Watermelon' },
    { id: 'apple', icon: '🍎', name: 'Apple' },
    { id: 'grapes', icon: '🍇', name: 'Grapes' },
    { id: 'cherry', icon: '🍒', name: 'Cherries' },
    { id: 'carrot', icon: '🥕', name: 'Carrot' },
  ];
  let selectedSeed = SEEDS[0];

  // two tidy rows of tilled soil — the back row sits smaller, for depth
  const PLOT_SPOTS = [
    { x: 16, y: 56, s: 0.78 }, { x: 33, y: 55, s: 0.78 }, { x: 50, y: 56, s: 0.78 },
    { x: 67, y: 55, s: 0.78 }, { x: 84, y: 56, s: 0.78 },
    { x: 12, y: 80, s: 1 }, { x: 31, y: 82, s: 1 }, { x: 50, y: 81, s: 1 },
    { x: 69, y: 82, s: 1 }, { x: 88, y: 80, s: 1 },
  ];

  /* ================= hand-drawn art ================= */

  function sceneSVG() {
    const picket = (x) =>
      `<path d="M${x} 268 L${x} 232 L${x + 9} 224 L${x + 18} 232 L${x + 18} 268 Z" fill="#fdfaf2" stroke="#d8d2c2" stroke-width="2"/>`;
    const tuft = (x, y, s) =>
      `<g transform="translate(${x} ${y}) scale(${s})" stroke="#4e9c3e" stroke-width="4" stroke-linecap="round" fill="none">
        <path d="M0 0 C-2 -10 -6 -14 -10 -16"/><path d="M0 0 C0 -12 0 -16 1 -20"/><path d="M0 0 C2 -10 6 -14 10 -16"/>
      </g>`;
    const daisyDot = (x, y) =>
      `<g transform="translate(${x} ${y})">
        ${[0, 60, 120, 180, 240, 300].map((a) => `<ellipse cx="0" cy="-5" rx="2.6" ry="5" fill="#fff" transform="rotate(${a})"/>`).join('')}
        <circle r="2.8" fill="#ffd34d"/>
      </g>`;
    return `<svg viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gsky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#7cc4f2"/><stop offset="0.7" stop-color="#c8e9fb"/><stop offset="1" stop-color="#e8f6ff"/>
        </linearGradient>
        <linearGradient id="ggrass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#8fd270"/><stop offset="1" stop-color="#5cab48"/>
        </linearGradient>
        <linearGradient id="ghill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#aede93"/><stop offset="1" stop-color="#8cc873"/>
        </linearGradient>
      </defs>
      <rect width="1000" height="320" fill="url(#gsky)"/>
      <!-- far rolling hills -->
      <path d="M0 250 Q160 180 340 240 Q420 262 520 238 Q700 192 1000 248 L1000 320 L0 320 Z" fill="url(#ghill)"/>
      <path d="M0 280 Q240 230 480 272 Q720 308 1000 268 L1000 330 L0 330 Z" fill="#7fbd64"/>
      <!-- a friendly tree on the far hill -->
      <path d="M872 250 L878 200" stroke="#7a5230" stroke-width="9" stroke-linecap="round"/>
      <circle cx="860" cy="184" r="26" fill="#5fae4d"/>
      <circle cx="892" cy="178" r="30" fill="#6cbb59"/>
      <circle cx="878" cy="158" r="24" fill="#7bc968"/>
      <circle cx="868" cy="172" r="5" fill="#f06a7e"/>
      <circle cx="894" cy="190" r="5" fill="#f06a7e"/>
      <!-- white picket fence along the horizon -->
      <rect x="0" y="240" width="1000" height="7" fill="#f4efe2" stroke="#d8d2c2" stroke-width="1.5"/>
      <rect x="0" y="256" width="1000" height="7" fill="#f4efe2" stroke="#d8d2c2" stroke-width="1.5"/>
      ${Array.from({ length: 21 }, (_, i) => picket(8 + i * 48)).join('')}
      <!-- the garden lawn -->
      <path d="M0 268 Q500 244 1000 268 L1000 600 L0 600 Z" fill="url(#ggrass)"/>
      <!-- bushes hugging the fence -->
      <ellipse cx="60" cy="278" rx="56" ry="26" fill="#5fae4d"/>
      <ellipse cx="96" cy="270" rx="38" ry="20" fill="#6cbb59"/>
      <ellipse cx="948" cy="276" rx="58" ry="26" fill="#5fae4d"/>
      <ellipse cx="912" cy="270" rx="36" ry="18" fill="#6cbb59"/>
      <circle cx="56" cy="268" r="4.4" fill="#f7a8c4"/><circle cx="84" cy="262" r="4.4" fill="#fff"/>
      <circle cx="936" cy="266" r="4.4" fill="#f7a8c4"/><circle cx="962" cy="272" r="4.4" fill="#fff"/>
      <!-- grass tufts & lawn daisies -->
      ${tuft(150, 340, 1)}${tuft(420, 318, 0.8)}${tuft(700, 332, 1.1)}${tuft(900, 350, 0.9)}
      ${tuft(80, 420, 1.2)}${tuft(530, 380, 0.9)}${tuft(960, 430, 1.1)}${tuft(300, 360, 0.85)}
      ${daisyDot(230, 332)}${daisyDot(640, 348)}${daisyDot(830, 326)}${daisyDot(60, 360)}
    </svg>`;
  }

  const CLOUD_SVG = `<svg viewBox="0 0 140 60" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="45" cy="42" rx="34" ry="16" fill="#fff"/>
    <ellipse cx="78" cy="34" rx="30" ry="18" fill="#fff"/>
    <ellipse cx="106" cy="44" rx="26" ry="13" fill="#fff"/>
    <ellipse cx="70" cy="48" rx="48" ry="11" fill="#fff"/>
  </svg>`;

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

  const RAINBOW_SVG = `<svg viewBox="0 0 320 170" xmlns="http://www.w3.org/2000/svg">
    ${['#f4504c', '#ff9d3a', '#ffd34d', '#6cbb59', '#5fa8e0', '#a981dd'].map((c, i) =>
      `<path d="M${24 + i * 9} 168 A${136 - i * 9} ${136 - i * 9} 0 0 1 ${296 - i * 9} 168" fill="none" stroke="${c}" stroke-width="9.5"/>`).join('')}
    <ellipse cx="26" cy="160" rx="26" ry="14" fill="#fff"/>
    <ellipse cx="294" cy="160" rx="26" ry="14" fill="#fff"/>
  </svg>`;

  const SOIL_SVG = `<svg viewBox="0 0 120 56" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="60" cy="30" rx="50" ry="19" fill="#8a5a32"/>
    <ellipse cx="60" cy="27" rx="42" ry="14" fill="#a06b3c"/>
    <path d="M28 27 Q60 18 92 27 M32 34 Q60 26 88 34" stroke="#7a4b26" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.55"/>
    <circle cx="42" cy="24" r="2" fill="#7a4b26"/><circle cx="76" cy="31" r="2" fill="#7a4b26"/>
  </svg>`;

  const CAN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 90">
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

  /* ----- plants: every stage hand-drawn, anchored at (60,150) ----- */
  const wrap = (inner) => `<svg viewBox="0 0 120 160" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
  const mound = `<ellipse cx="60" cy="150" rx="22" ry="7" fill="#8a5a32"/><ellipse cx="60" cy="148" rx="16" ry="5" fill="#a06b3c"/>`;

  function stemSVG(h, leaves = 2) {
    const leaf = (yy, side) => `
      <path d="M60 ${yy} C${60 + side * 14} ${yy - 2} ${60 + side * 24} ${yy - 12} ${60 + side * 21} ${yy - 18}
               C${60 + side * 8} ${yy - 15} 60 ${yy - 8} 60 ${yy} Z" fill="#54ad42"/>
      <path d="M60 ${yy - 2} Q${60 + side * 12} ${yy - 8} ${60 + side * 18} ${yy - 15}" stroke="#3f8f33" stroke-width="1.6" fill="none"/>`;
    let leafBits = '';
    if (leaves >= 1) leafBits += leaf(150 - h * 0.45, -1);
    if (leaves >= 2) leafBits += leaf(150 - h * 0.62, 1);
    return `<path d="M60 150 C61 ${150 - h * 0.4} 59 ${150 - h * 0.72} 60 ${150 - h}"
      stroke="#3f8f33" stroke-width="5.5" fill="none" stroke-linecap="round"/>` + leafBits;
  }

  const sprout = wrap(`${mound}
    <g class="grow-in">
      <path d="M60 148 C60 140 59 136 60 128" stroke="#4f9e3f" stroke-width="4.5" fill="none" stroke-linecap="round"/>
      <path d="M60 136 C50 135 44 129 46 123 C53 125 59 130 60 136 Z" fill="#5fb44e"/>
      <path d="M60 131 C70 130 76 124 74 118 C67 120 61 125 60 131 Z" fill="#6fc75d"/>
    </g>`);

  const youngPlant = wrap(`${mound}<g class="grow-in">${stemSVG(64, 2)}</g>`);

  function budSVG(color) {
    return wrap(`${mound}<g class="grow-in">${stemSVG(86, 2)}
      <path d="M60 64 C49 60 49 42 60 36 C71 42 71 60 60 64 Z" fill="${color}"/>
      <path d="M60 64 C52 62 50 54 51 50 Q57 56 60 64 Z" fill="#54ad42"/>
      <path d="M60 64 C68 62 70 54 69 50 Q63 56 60 64 Z" fill="#54ad42"/>`);
  }

  function saplingSVG() {
    return wrap(`${mound}<g class="grow-in">${stemSVG(58, 1)}
      <circle cx="60" cy="84" r="15" fill="#5fae4d"/>
      <circle cx="49" cy="92" r="11" fill="#6cbb59"/>
      <circle cx="71" cy="92" r="11" fill="#6cbb59"/>`);
  }

  // the star of the garden 🌻
  function sunflowerSVG() {
    const cx = 60, cy = 36;
    const petals = Array.from({ length: 16 }, (_, i) =>
      `<ellipse cx="${cx}" cy="${cy - 23}" rx="6.5" ry="17" fill="${i % 2 ? '#f2ad17' : '#ffc93d'}"
        stroke="#d8930f" stroke-width="1" transform="rotate(${i * 22.5} ${cx} ${cy})"/>`).join('');
    const seeds = Array.from({ length: 12 }, (_, i) => {
      const a = i * 137.5 * Math.PI / 180, r = 3 + i * 0.95;
      return `<circle cx="${cx + Math.cos(a) * r}" cy="${cy + Math.sin(a) * r}" r="1.4" fill="#5d3a16"/>`;
    }).join('');
    return wrap(`${mound}${stemSVG(114, 2)}
      <g class="bloom-head" style="transform-origin:60px 150px">
        ${petals}
        <circle cx="${cx}" cy="${cy}" r="17" fill="#7a4b1e" stroke="#5d3a16" stroke-width="2"/>
        ${seeds}
        <circle cx="${cx - 6}" cy="${cy - 3}" r="2" fill="#fff"/>
        <circle cx="${cx + 6}" cy="${cy - 3}" r="2" fill="#fff"/>
        <circle cx="${cx - 6}" cy="${cy - 2.6}" r="1" fill="#2d1d0c"/>
        <circle cx="${cx + 6}" cy="${cy - 2.6}" r="1" fill="#2d1d0c"/>
        <path d="M${cx - 5} ${cy + 4} Q${cx} ${cy + 8} ${cx + 5} ${cy + 4}" stroke="#2d1d0c" stroke-width="1.6" fill="none" stroke-linecap="round"/>
      </g>`);
  }

  function tulipSVG() {
    return wrap(`${mound}${stemSVG(92, 2)}
      <g class="bloom-head" style="transform-origin:60px 150px">
        <path d="M45 56 C43 38 50 28 60 24 C70 28 77 38 75 56 C70 62 50 62 45 56 Z" fill="#e85d75"/>
        <path d="M45 54 L51 40 L57 54 L63 38 L69 54 L75 52" stroke="#c83a55" stroke-width="2.4" fill="none" stroke-linejoin="round"/>
        <path d="M48 36 C50 30 54 27 58 26" stroke="#ff9fb0" stroke-width="3" fill="none" stroke-linecap="round"/>
      </g>`);
  }

  function roseSVG() {
    return wrap(`${mound}${stemSVG(94, 2)}
      <g class="bloom-head" style="transform-origin:60px 150px">
        ${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="60" cy="29" rx="9" ry="14" fill="#d6365a" transform="rotate(${a} 60 42)"/>`).join('')}
        <circle cx="60" cy="42" r="13" fill="#e85d75"/>
        <path d="M60 32 C52 36 51 46 58 50 C52 45 55 37 60 35 C66 37 68 44 63 49 C70 46 68 35 60 32 Z" fill="#b22746"/>
        <circle cx="60" cy="42" r="3.4" fill="#8e1c36"/>
      </g>`);
  }

  function daisySVG() {
    return wrap(`${mound}${stemSVG(88, 2)}
      <g class="bloom-head" style="transform-origin:60px 150px">
        ${Array.from({ length: 12 }, (_, i) =>
          `<ellipse cx="60" cy="${44 - 17}" rx="5.5" ry="14" fill="#fff" stroke="#e8e2d2" stroke-width="1" transform="rotate(${i * 30} 60 44)"/>`).join('')}
        <circle cx="60" cy="44" r="10" fill="#ffd34d" stroke="#e8a92e" stroke-width="2"/>
        <circle cx="57" cy="42" r="1.4" fill="#e8a92e"/><circle cx="63" cy="45" r="1.4" fill="#e8a92e"/>
      </g>`);
  }

  function blossomSVG() {
    return wrap(`${mound}${stemSVG(84, 2)}
      <g class="bloom-head" style="transform-origin:60px 150px">
        ${[0, 72, 144, 216, 288].map((a) =>
          `<circle cx="60" cy="${48 - 13}" r="9.5" fill="#f7a8c4" stroke="#e87fa8" stroke-width="1.4" transform="rotate(${a} 60 48)"/>`).join('')}
        <circle cx="60" cy="48" r="7" fill="#ffe18a"/>
        ${[30, 102, 174, 246, 318].map((a) => `<circle cx="60" cy="${48 - 5}" r="1.3" fill="#e8a92e" transform="rotate(${a} 60 48)"/>`).join('')}
      </g>`);
  }

  function strawberrySVG() {
    const berry = (x, y, s) => `
      <path d="M${x} ${y + 9 * s} C${x - 7 * s} ${y + 3 * s} ${x - 6 * s} ${y - 5 * s} ${x} ${y - 5 * s}
               C${x + 6 * s} ${y - 5 * s} ${x + 7 * s} ${y + 3 * s} ${x} ${y + 9 * s} Z" fill="#e8344c"/>
      <circle cx="${x - 2.4 * s}" cy="${y}" r="0.9" fill="#ffe18a"/><circle cx="${x + 2.4 * s}" cy="${y + 2 * s}" r="0.9" fill="#ffe18a"/>
      <path d="M${x - 4 * s} ${y - 5 * s} L${x} ${y - 8 * s} L${x + 4 * s} ${y - 5 * s} Z" fill="#54ad42"/>`;
    return wrap(`${mound}
      <g class="bloom-head" style="transform-origin:60px 150px">
        <ellipse cx="60" cy="128" rx="30" ry="17" fill="#5fae4d"/>
        <ellipse cx="42" cy="134" rx="16" ry="11" fill="#6cbb59"/>
        <ellipse cx="78" cy="134" rx="16" ry="11" fill="#6cbb59"/>
        ${berry(46, 136, 1)}${berry(74, 138, 0.9)}${berry(60, 124, 1.1)}
        ${[0, 72, 144, 216, 288].map((a) => `<circle cx="84" cy="${118 - 4}" r="2.6" fill="#fff" transform="rotate(${a} 84 118)"/>`).join('')}
        <circle cx="84" cy="118" r="2" fill="#ffd34d"/>
      </g>`);
  }

  function watermelonSVG() {
    return wrap(`${mound}
      <g class="bloom-head" style="transform-origin:60px 150px">
        <path d="M30 140 Q44 120 68 124 Q88 112 96 122" stroke="#4f9e3f" stroke-width="4" fill="none" stroke-linecap="round"/>
        <path d="M92 118 C84 110 90 102 98 106 C100 112 98 117 92 118 Z" fill="#54ad42"/>
        <ellipse cx="58" cy="138" rx="28" ry="19" fill="#3d8f3a"/>
        <path d="M38 130 Q42 138 38 148 M50 124 Q54 136 50 152 M64 122 Q68 136 64 154 M78 128 Q80 138 78 150"
          stroke="#2c6e2a" stroke-width="4.5" fill="none" stroke-linecap="round"/>
        <ellipse cx="48" cy="130" rx="8" ry="4" fill="#fff" opacity="0.35"/>
      </g>`);
  }

  function treeSVG(fruitBits) {
    return wrap(`${mound}
      <g class="bloom-head" style="transform-origin:60px 150px">
        <path d="M60 150 C61 130 58 116 60 100" stroke="#7a5230" stroke-width="8" stroke-linecap="round" fill="none"/>
        <path d="M60 124 L48 112 M60 116 L72 106" stroke="#7a5230" stroke-width="5" stroke-linecap="round"/>
        <circle cx="44" cy="84" r="20" fill="#5fae4d"/>
        <circle cx="76" cy="84" r="20" fill="#5fae4d"/>
        <circle cx="60" cy="66" r="22" fill="#6cbb59"/>
        <circle cx="60" cy="86" r="18" fill="#7bc968"/>
        ${fruitBits}
      </g>`);
  }
  const appleSVG = () => treeSVG(`
    <circle cx="46" cy="78" r="6" fill="#e8344c"/><circle cx="74" cy="74" r="6" fill="#e8344c"/>
    <circle cx="60" cy="92" r="6" fill="#e8344c"/><circle cx="62" cy="58" r="6" fill="#e8344c"/>
    <circle cx="44.2" cy="76.2" r="1.6" fill="#ffd9e0"/><circle cx="72.2" cy="72.2" r="1.6" fill="#ffd9e0"/>`);
  const cherrySVG = () => treeSVG(`
    <path d="M48 70 L52 80 M52 70 L58 79 M72 66 L70 76 M76 66 L78 75" stroke="#54632c" stroke-width="1.8" fill="none"/>
    <circle cx="52" cy="83" r="4.4" fill="#c8243c"/><circle cx="59" cy="82" r="4.4" fill="#e8344c"/>
    <circle cx="70" cy="79" r="4.4" fill="#c8243c"/><circle cx="78" cy="78" r="4.4" fill="#e8344c"/>`);

  function grapesSVG() {
    const cluster = [[0, 0], [-6, 7], [6, 7], [-11, 14], [0, 14], [11, 14], [-6, 21], [6, 21], [0, 28]]
      .map(([dx, dy], i) => `<circle cx="${60 + dx}" cy="${78 + dy}" r="6" fill="${i % 2 ? '#8a5bb8' : '#a06ed4'}" stroke="#6e4099" stroke-width="1.2"/>`).join('');
    return wrap(`${mound}
      <g class="bloom-head" style="transform-origin:60px 150px">
        <path d="M40 150 L40 76 M80 150 L80 76" stroke="#9a7248" stroke-width="5" stroke-linecap="round"/>
        <path d="M34 78 L86 78" stroke="#9a7248" stroke-width="5" stroke-linecap="round"/>
        <path d="M40 120 Q60 104 80 116 M40 92 Q60 108 80 88" stroke="#4f9e3f" stroke-width="3.4" fill="none"/>
        <path d="M52 66 C44 58 50 50 58 54 C60 60 58 65 52 66 Z" fill="#54ad42"/>
        ${cluster}
      </g>`);
  }

  function carrotSVG() {
    return wrap(`${mound}
      <g class="bloom-head" style="transform-origin:60px 150px">
        ${[-14, 0, 14].map((dx) =>
          `<path d="M${60 + dx * 0.4} 132 C${56 + dx} 116 ${52 + dx} 104 ${58 + dx} 92 M${60 + dx * 0.4} 132 C${62 + dx} 114 ${66 + dx} 106 ${64 + dx} 94"
            stroke="#4f9e3f" stroke-width="3.4" fill="none" stroke-linecap="round"/>`).join('')}
        <path d="M48 134 Q60 128 72 134 L62 158 Q60 161 58 158 Z" fill="#f08124"/>
        <path d="M52 140 L68 138 M54 147 L66 145" stroke="#d4670f" stroke-width="2" fill="none" stroke-linecap="round"/>
      </g>`);
  }

  const BLOOMS = {
    sunflower: sunflowerSVG, tulip: tulipSVG, rose: roseSVG, daisy: daisySVG, blossom: blossomSVG,
    strawberry: strawberrySVG, watermelon: watermelonSVG, apple: appleSVG, grapes: grapesSVG,
    cherry: cherrySVG, carrot: carrotSVG,
  };
  const BUD_COLORS = {
    sunflower: '#ffc93d', tulip: '#e85d75', rose: '#d6365a', daisy: '#f4f0e2', blossom: '#f7a8c4',
  };

  /* ================= state & lifecycle ================= */
  let area, can, drawer, seedBtn;
  let plots = [];
  let critters = [];
  let flowerCount = 0;
  let butterflyCount = 0;
  let rafId = null, lastTime = 0, active = false;
  let timers = [];
  let tool = 'seed';

  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }

  function selectTool(t) {
    tool = t;
    can.classList.toggle('selected', t === 'water');
    seedBtn.classList.toggle('selected', t === 'seed');
    area.classList.toggle('seed-mode', t === 'seed');
    if (t === 'water') drawer.classList.remove('open');
  }

  function init() {
    area = document.getElementById('garden-area');
    can = document.getElementById('garden-can');
    drawer = document.getElementById('seed-drawer');
    seedBtn = document.getElementById('garden-seed-btn');
    can.innerHTML = CAN_SVG;
    document.getElementById('garden-sun').innerHTML = SUN_SVG;
    document.getElementById('garden-scene').innerHTML = sceneSVG();
    document.getElementById('garden-rainbow').innerHTML = RAINBOW_SVG;

    const clouds = document.getElementById('garden-clouds');
    for (let i = 0; i < 3; i++) {
      const c = document.createElement('div');
      c.className = 'gcloud';
      c.innerHTML = CLOUD_SVG;
      c.style.top = 2 + i * 7 + '%';
      c.style.width = 140 - i * 26 + 'px';
      c.style.animationDuration = 70 + i * 34 + 's';
      c.style.animationDelay = -i * 33 + 's';
      clouds.appendChild(c);
    }

    buildPlots();

    can.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      Sound.click();
      selectTool('water');
    });
    seedBtn.textContent = selectedSeed.icon;
    seedBtn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      Sound.click();
      if (tool === 'seed') drawer.classList.toggle('open');
      else selectTool('seed');
    });
    document.getElementById('garden-scene').addEventListener('pointerdown', () => {
      drawer.classList.remove('open');
      if (tool === 'water') Sound.splash();
    });
    document.getElementById('garden-reset').addEventListener('click', () => {
      Sound.pop();
      resetGarden();
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
    selectTool('seed');
  }

  function buildPlots() {
    const box = document.getElementById('garden-plots');
    box.innerHTML = '';
    plots = PLOT_SPOTS.map((spot, i) => {
      const el = document.createElement('div');
      el.className = 'plot';
      el.style.left = spot.x + '%';
      el.style.top = spot.y + '%';
      el.style.setProperty('--s', spot.s);
      el.style.zIndex = Math.round(spot.y);
      el.innerHTML = `<div class="plot-soil">${SOIL_SVG}</div><div class="plot-plant"></div>`;
      const plot = { el, plantEl: el.querySelector('.plot-plant'), seed: null, stage: -1, growing: false, bloomed: false, bar: null };
      el.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        drawer.classList.remove('open');
        tapPlot(plot);
      });
      box.appendChild(el);
      return plot;
    });
  }

  function toast(msg) {
    const t = document.getElementById('garden-toast');
    t.textContent = msg;
    t.classList.remove('hidden');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => t.classList.add('hidden'), 1900);
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
    timers.forEach(clearTimeout);
    timers = [];
    critters.forEach((c) => c.el.remove());
    critters = [];
    flowerCount = 0;
    butterflyCount = 0;
    updateHud();
    document.getElementById('garden-rainbow').classList.add('hidden');
    document.getElementById('garden-hint').style.display = '';
    buildPlots();
  }

  /* ================= gameplay ================= */
  function tapPlot(plot) {
    if (tool === 'water') return waterPlot(plot);
    // seed tool
    if (plot.stage >= 0) {
      if (plot.bloomed) { Sound.sparkle(); sparkleBurst(plot.el, 6); }
      else { Sound.click(); wiggle(plot.el); }
      return;
    }
    const unwatered = plots.filter((p) => p.stage === 0 && !p.growing).length;
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
    plot.seed = selectedSeed.id === 'mix'
      ? FLOWER_IDS[Math.floor(Math.random() * FLOWER_IDS.length)]
      : selectedSeed.id;
    plot.stage = 0;
    plot.el.classList.add('planted');
    plot.plantEl.innerHTML = sprout;
  }

  function waterPlot(plot) {
    if (plot.stage < 0) { Sound.splash(); return; } // nothing planted here yet
    if (can.classList.contains('flying')) return;   // one pour at a time
    if (plot.bloomed || plot.growing) {
      pourOver(plot);
      later(() => { Sound.splash(); rainDroplets(plot.el); }, 420);
      later(() => returnCan(), 1500);
      return;
    }
    plot.growing = true;
    pourOver(plot);
    later(() => { Sound.splash(); rainDroplets(plot.el); }, 420);
    later(() => returnCan(), 1500);

    // progress bar fills across the 20-second grow
    const bar = document.createElement('div');
    bar.className = 'grow-bar';
    bar.innerHTML = '<div class="grow-fill"></div>';
    bar.style.left = plot.el.style.left;
    bar.style.top = `calc(${plot.el.style.top} + 26px)`;
    area.appendChild(bar);
    plot.bar = bar;
    requestAnimationFrame(() => {
      bar.querySelector('.grow-fill').style.transition = `width ${GROW_SECONDS}s linear`;
      bar.querySelector('.grow-fill').style.width = '100%';
    });

    const third = (GROW_SECONDS * 1000) / 3;
    later(() => setStage(plot, 1), third);
    later(() => setStage(plot, 2), third * 2);
    later(() => bloom(plot), GROW_SECONDS * 1000);
  }

  function setStage(plot, stage) {
    plot.stage = stage;
    Sound.pop();
    rainDroplets(plot.el);
    const isFlower = !!BUD_COLORS[plot.seed];
    if (stage === 1) plot.plantEl.innerHTML = youngPlant;
    else plot.plantEl.innerHTML = isFlower ? budSVG(BUD_COLORS[plot.seed]) : saplingSVG();
  }

  function bloom(plot) {
    plot.bloomed = true;
    plot.growing = false;
    plot.stage = 3;
    if (plot.bar) { plot.bar.remove(); plot.bar = null; }
    plot.plantEl.innerHTML = BLOOMS[plot.seed]();
    plot.plantEl.classList.add('bloomed');
    sparkleBurst(plot.el, 10);
    flowerCount++;
    updateHud();

    if (plot.seed === 'sunflower') {
      // the star of the show!
      Sound.fanfare();
      sparkleBurst(plot.el, 16);
      toast('A beautiful SUNFLOWER! 🌻');
      const sun = document.getElementById('garden-sun');
      sun.classList.remove('happy');
      void sun.offsetWidth;
      sun.classList.add('happy');
    } else {
      Sound.fanfare();
    }

    if (flowerCount === 5) {
      document.getElementById('garden-rainbow').classList.remove('hidden');
      throwConfetti(120);
    }
    if (plots.every((p) => p.bloomed)) {
      later(() => {
        Sound.fanfare();
        throwConfetti(200);
        toast('Mae grew the WHOLE garden! 💐🌈');
      }, 600);
    }
    maybeSpawnButterfly();
  }

  function wiggle(el) {
    el.classList.remove('wiggle');
    void el.offsetWidth;
    el.classList.add('wiggle');
  }

  /* ----- the flying watering can ----- */
  function returnCan() {
    can.classList.add('returning');
    can.classList.remove('flying');
    can.style.left = '';
    can.style.top = '';
    setTimeout(() => can.classList.remove('returning'), 500);
  }

  function pourOver(plot) {
    can.classList.add('flying');
    can.style.left = `calc(${plot.el.style.left} - 56px)`;
    can.style.top = `calc(${plot.el.style.top} - 150px)`;
    later(() => can.classList.add('pouring'), 380);
    later(() => can.classList.remove('pouring'), 1400);
  }

  /* ----- little effects ----- */
  function rainDroplets(el) {
    for (let i = 0; i < 4; i++) {
      const d = document.createElement('span');
      d.className = 'droplet';
      d.textContent = '💧';
      d.style.left = `calc(${el.style.left} + ${(i - 1.5) * 16}px)`;
      d.style.top = `calc(${el.style.top} - 96px)`;
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
      s.style.setProperty('--dy', Math.sin(ang) * 70 - 40 + 'px');
      s.style.left = el.style.left;
      s.style.top = `calc(${el.style.top} - 70px)`;
      area.appendChild(s);
      setTimeout(() => s.remove(), 1000);
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
