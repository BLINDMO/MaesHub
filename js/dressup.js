/* ============ Dress-Up Studio ============
 * A princess mannequin (drawn in SVG) with a big boutique wardrobe:
 * 40 hairstyles, 32 dresses, 32 pairs of shoes and 34 accessories, all
 * generated from shape × color combinations. With nothing selected she
 * wears her plain onesie. Outfits are saved on the device.
 */
const Dressup = (() => {
  const STORE_KEY = 'maeshub.outfit.v1';
  const SKIN = '#f7d9c0', SKIN_D = '#eac3a5';

  /* ---------- art helpers: gradients give fabric, hair and skin depth ---- */
  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const f = (v) => Math.max(0, Math.min(255, v + amt));
    const r = f(n >> 16), g = f((n >> 8) & 255), b = f(n & 255);
    return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
  }
  // gradients map to each element's own bounding box, so every garment
  // piece gets its own light-to-dark satin falloff
  function grad(id, c1, c2, x2 = 0, y2 = 1) {
    return `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">
      <stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/>
    </linearGradient>`;
  }
  const GOLD = `<defs>${grad('m-gold', '#ffeebb', '#d8a232')}</defs>`;
  const SILVER = `<defs>${grad('m-silver', '#f4f8fc', '#aebccc')}</defs>`;

  /* ---------- the mannequin ---------- */
  function bodySVG() {
    return `
      <defs>
        ${grad('skin-g', '#fbe6cf', '#efc6a2')}
        <radialGradient id="iris-g"><stop offset="0.25" stop-color="#8fd2f2"/><stop offset="1" stop-color="#3a85bd"/></radialGradient>
        <radialGradient id="blush-g"><stop offset="0" stop-color="#f7a8a0" stop-opacity="0.55"/><stop offset="1" stop-color="#f7a8a0" stop-opacity="0"/></radialGradient>
      </defs>
      <!-- legs -->
      <path d="M140 260 L137 450" stroke="url(#skin-g)" stroke-width="17" stroke-linecap="round"/>
      <path d="M160 260 L163 450" stroke="url(#skin-g)" stroke-width="17" stroke-linecap="round"/>
      <ellipse cx="134" cy="462" rx="13" ry="8" fill="url(#skin-g)"/>
      <ellipse cx="166" cy="462" rx="13" ry="8" fill="url(#skin-g)"/>
      <!-- arms -->
      <path d="M122 158 C102 195 100 245 105 288" stroke="url(#skin-g)" stroke-width="13" stroke-linecap="round" fill="none"/>
      <path d="M178 158 C198 195 200 245 195 288" stroke="url(#skin-g)" stroke-width="13" stroke-linecap="round" fill="none"/>
      <circle cx="105" cy="293" r="8" fill="url(#skin-g)"/>
      <circle cx="195" cy="293" r="8" fill="url(#skin-g)"/>
      <!-- torso with soft side shading -->
      <path d="M120 150 Q150 140 180 150 C184 195 174 230 168 264 L132 264 C126 230 116 195 120 150 Z" fill="url(#skin-g)"/>
      <path d="M120 150 C118 192 126 228 132 262 L138 262 C130 226 124 192 126 152 Z" fill="${SKIN_D}" opacity="0.35"/>
      <!-- neck & head -->
      <path d="M142 118 h16 v22 q-8 6 -16 0 Z" fill="${SKIN_D}"/>
      <ellipse cx="150" cy="86" rx="39" ry="44" fill="url(#skin-g)"/>
      <!-- brows -->
      <path d="M124 71 Q133 66 142 71" stroke="#b8854f" stroke-width="2.6" fill="none" stroke-linecap="round"/>
      <path d="M158 71 Q167 66 176 71" stroke="#b8854f" stroke-width="2.6" fill="none" stroke-linecap="round"/>
      <!-- eyes: sclera, iris, pupil, catchlights, lid + lashes -->
      <ellipse cx="133" cy="87" rx="8.2" ry="10" fill="#fff"/>
      <ellipse cx="167" cy="87" rx="8.2" ry="10" fill="#fff"/>
      <circle cx="133" cy="88.5" r="5.6" fill="url(#iris-g)"/>
      <circle cx="167" cy="88.5" r="5.6" fill="url(#iris-g)"/>
      <circle cx="133" cy="88.5" r="2.6" fill="#23232c"/>
      <circle cx="167" cy="88.5" r="2.6" fill="#23232c"/>
      <circle cx="135" cy="86" r="1.5" fill="#fff"/>
      <circle cx="169" cy="86" r="1.5" fill="#fff"/>
      <circle cx="131" cy="91" r="0.9" fill="#fff" opacity="0.8"/>
      <circle cx="165" cy="91" r="0.9" fill="#fff" opacity="0.8"/>
      <path d="M124.5 82 Q133 75 141.5 82" stroke="#3a2e26" stroke-width="2.6" fill="none" stroke-linecap="round"/>
      <path d="M158.5 82 Q167 75 175.5 82" stroke="#3a2e26" stroke-width="2.6" fill="none" stroke-linecap="round"/>
      <path d="M124 82 l-3.5 -2.5 M127 79.4 l-2.8 -3.2 M176 82 l3.5 -2.5 M173 79.4 l2.8 -3.2"
        stroke="#3a2e26" stroke-width="1.8" stroke-linecap="round"/>
      <!-- nose & lips -->
      <path d="M148 98 Q150 101 152 98" stroke="${SKIN_D}" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M141 109 Q145.5 105.5 150 108.5 Q154.5 105.5 159 109 Q150 117.5 141 109 Z" fill="#e0685f"/>
      <path d="M144 108.4 Q150 111 156 108.4" stroke="#c24f48" stroke-width="1.2" fill="none" opacity="0.6"/>
      <!-- blush -->
      <circle cx="123" cy="100" r="7.5" fill="url(#blush-g)"/>
      <circle cx="177" cy="100" r="7.5" fill="url(#blush-g)"/>`;
  }

  function onesieSVG() {
    return `<g id="onesie-layer">
      <defs>${grad('onesie-g', '#f6f1fc', '#ddd1ee')}</defs>
      <path d="M118 150 Q150 138 182 150 C187 210 180 255 178 295 Q178 318 162 318 L160 280 L140 280 L138 318 Q122 318 122 295 C120 255 113 210 118 150 Z"
        fill="url(#onesie-g)" stroke="#cfc2e2" stroke-width="3"/>
      <path d="M124 156 C122 200 128 240 130 270 L136 270 C132 238 128 200 130 158 Z" fill="#fff" opacity="0.5"/>
      <circle cx="150" cy="175" r="3.6" fill="#fff" stroke="#c4b5da" stroke-width="1.4"/>
      <circle cx="150" cy="197" r="3.6" fill="#fff" stroke="#c4b5da" stroke-width="1.4"/>
      <circle cx="150" cy="219" r="3.6" fill="#fff" stroke="#c4b5da" stroke-width="1.4"/>
      <path d="M134 151 Q138 158 144 153 Q150 160 156 153 Q162 158 166 151" stroke="#cfc2e2" stroke-width="2.4" fill="none"/>
      <path d="M126 286 q6 5 12 0 M162 286 q6 5 12 0" stroke="#cfc2e2" stroke-width="2" fill="none" stroke-dasharray="3 3"/>
    </g>`;
  }

  /* ---------- wardrobe generation ---------- */
  const HAIR_COLORS = [
    ['Platinum', '#f6e7bb', '#dcc488'], ['Golden', '#f3c64e', '#d3a32e'],
    ['Brown', '#9a6a44', '#7b5130'], ['Midnight', '#403848', '#2a2433'],
    ['Ginger', '#e07a3a', '#bf5c24'], ['Pink', '#f3a6c8', '#df7fae'],
    ['Purple', '#b294e8', '#9573cc'], ['Sky', '#8fc3ec', '#6da3cf'],
  ];
  const cap = (c) => `<path d="M109 82 Q107 34 150 31 Q193 34 191 82 Q173 50 150 52 Q127 50 109 82 Z" fill="${c}"/>`;

  const HAIR_SHAPES = [
    ['Side Braid', (c, d) => ({
      back: [0, 1, 2, 3, 4].map((i) =>
        `<circle cx="${118 - i * 5}" cy="${122 + i * 32}" r="${17 - i * 1.6}" fill="${i % 2 ? d : c}"/>`).join('') +
        `<path d="M96 268 l-6 14 M98 270 l6 14" stroke="${d}" stroke-width="3"/>`,
      front: cap(c) + `<path d="M109 80 Q120 96 118 112 L106 100 Z" fill="${c}"/>`,
    })],
    ['Long & Straight', (c, d) => ({
      back: `<path d="M105 60 Q150 24 195 60 L202 250 Q176 270 150 270 Q124 270 98 250 Z" fill="${c}"/>
             <path d="M150 56 L150 250" stroke="${d}" stroke-width="3" opacity="0.4"/>`,
      front: cap(c),
    })],
    ['Mermaid Waves', (c, d) => ({
      back: `<path d="M104 60 Q150 22 196 60 Q210 150 198 210 Q212 250 196 282 Q150 300 104 282 Q88 250 102 210 Q90 150 104 60 Z" fill="${c}"/>
             <path d="M120 100 Q130 140 118 180 Q132 220 120 260 M180 100 Q170 140 182 180 Q168 220 180 260" stroke="${d}" stroke-width="3.4" fill="none" opacity="0.5"/>`,
      front: cap(c),
    })],
    ['Pigtails', (c, d) => ({
      back: `<ellipse cx="94" cy="150" rx="20" ry="48" fill="${c}"/>
             <ellipse cx="206" cy="150" rx="20" ry="48" fill="${c}"/>
             <circle cx="100" cy="100" r="9" fill="${d}"/>
             <circle cx="200" cy="100" r="9" fill="${d}"/>`,
      front: cap(c),
    })],
    ['Ballet Bun', (c, d) => ({
      back: `<circle cx="150" cy="32" r="21" fill="${c}"/>
             <path d="M132 32 Q150 22 168 32" stroke="${d}" stroke-width="4" fill="none"/>`,
      front: cap(c),
    })],
    ['High Ponytail', (c, d) => ({
      back: `<path d="M178 42 Q226 90 210 190 Q200 226 188 244 Q196 170 178 100 Z" fill="${c}"/>
             <circle cx="180" cy="46" r="8" fill="${d}"/>`,
      front: cap(c),
    })],
    ['Sweet Bob', (c, d) => ({
      back: `<path d="M103 60 Q150 22 197 60 L200 138 Q150 170 100 138 Z" fill="${c}"/>
             <path d="M150 54 L150 130" stroke="${d}" stroke-width="3" opacity="0.4"/>`,
      front: cap(c),
    })],
    ['Curly Cloud', (c, d) => ({
      back: [[110, 60, 22], [150, 42, 25], [190, 60, 22], [98, 105, 20], [202, 105, 20],
             [96, 150, 18], [204, 150, 18], [104, 190, 16], [196, 190, 16]]
        .map(([x, y, r], i) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${i % 3 === 1 ? d : c}"/>`).join(''),
      front: cap(c),
    })],
    ['Space Buns', (c, d) => ({
      back: `<circle cx="110" cy="34" r="17" fill="${c}"/>
             <circle cx="190" cy="34" r="17" fill="${c}"/>
             <path d="M98 34 Q110 24 122 34 M178 34 Q190 24 202 34" stroke="${d}" stroke-width="3.4" fill="none"/>`,
      front: cap(c),
    })],
    ['Princess Curls', (c, d) => ({
      back: `<path d="M104 60 Q150 24 196 60 L200 170 Q150 188 100 170 Z" fill="${c}"/>` +
        [0, 1, 2].map((i) =>
          `<circle cx="${104 + i * 2}" cy="${190 + i * 36}" r="${15 - i * 2}" fill="${i % 2 ? d : c}"/>
           <circle cx="${196 - i * 2}" cy="${190 + i * 36}" r="${15 - i * 2}" fill="${i % 2 ? d : c}"/>`).join(''),
      front: cap(c),
    })],
  ];

  const DRESS_PALETTES = [
    ['Ice Crystal', '#bfe9fb', '#8fd2f0', '#ffffff'], ['Rose Petal', '#f9b8d4', '#ef8fbc', '#ffffff'],
    ['Lilac Dream', '#d8c4f4', '#b89ae6', '#ffffff'], ['Sunshine', '#f7d774', '#e3b13e', '#ffffff'],
    ['Minty Fresh', '#b8ecd2', '#8cd9b4', '#ffffff'], ['Coral Reef', '#ffb39b', '#f58a6e', '#ffffff'],
    ['Royal Blue', '#7fa8e8', '#5d83cc', '#ffd54f'], ['Ruby Sparkle', '#f06a7e', '#d44a60', '#ffd9e0'],
    ['Sea Glass', '#83d8d4', '#5bb8b4', '#ffffff'], ['Berry Swirl', '#c982d6', '#a861b8', '#ffe9f7'],
  ];
  const sparkles = (a, n, y0, y1) => Array.from({ length: n }, (_, i) =>
    `<circle cx="${100 + ((i * 53) % 100)}" cy="${y0 + ((i * 37) % (y1 - y0))}" r="2.6" fill="${a}" opacity="0.9"/>`).join('');
  const bodice = (m, d) =>
    `<path d="M121 150 Q150 140 179 150 L173 240 Q150 250 127 240 Z" fill="${m}" stroke="${d}" stroke-width="2.5"/>
     <path d="M125 156 Q133 151 139 153 L135 234 Q129 232 128 226 Z" fill="#ffffff" opacity="0.28"/>
     <path d="M124 151 Q150 142 176 151" stroke="#ffffff" stroke-width="2.4" fill="none" opacity="0.5"/>`;

  const DRESS_SHAPES = [
    ['Ballgown', ([, m, d, a]) => bodice(m, d) +
      `<path d="M127 238 Q150 250 173 238 Q208 320 218 442 Q150 468 82 442 Q92 320 127 238 Z" fill="${m}" stroke="${d}" stroke-width="3"/>
       <path d="M86 430 Q150 452 214 430" stroke="${d}" stroke-width="5" fill="none"/>` + sparkles(a, 9, 280, 420)],
    ['Twirly A-Line', ([, m, d, a]) => bodice(m, d) +
      `<path d="M127 238 Q150 250 173 238 Q192 300 198 358 Q150 376 102 358 Q108 300 127 238 Z" fill="${m}" stroke="${d}" stroke-width="3"/>` +
      sparkles(a, 6, 270, 350)],
    ['Ice Queen Gown', ([, m, d, a]) => `
      <path d="M122 160 L74 430 Q150 404 226 430 L178 160 Z" fill="${a}" opacity="0.55"/>` +
      bodice(m, d) +
      `<path d="M127 238 Q150 250 173 238 Q186 330 184 448 Q150 460 116 448 Q114 330 127 238 Z" fill="${m}" stroke="${d}" stroke-width="3"/>
       <path d="M150 258 l4 7 -4 7 -4 -7 Z M138 320 l4 7 -4 7 -4 -7 Z M162 360 l4 7 -4 7 -4 -7 Z" fill="${a}"/>`],
    ['Sparkle Tutu', ([, m, d, a]) => bodice(m, d) +
      [0, 1, 2].map((i) =>
        `<path d="M${124 - i * 6} ${250 + i * 22} ${Array.from({ length: 6 }, (_, k) =>
          `L${(124 - i * 6) + (k + 0.5) * ((52 + i * 12) / 3)} ${272 + i * 22} L${(124 - i * 6) + (k + 1) * ((52 + i * 12) / 3)} ${250 + i * 22}`).join(' ')} Z"
          fill="${i % 2 ? d : m}" opacity="${1 - i * 0.18}"/>`).join('') + sparkles(a, 5, 250, 300)],
    ['Mermaid Gown', ([, m, d, a]) => bodice(m, d) +
      `<path d="M127 238 Q150 250 173 238 Q180 310 170 372 Q198 400 206 452 Q150 470 94 452 Q102 400 130 372 Q120 310 127 238 Z" fill="${m}" stroke="${d}" stroke-width="3"/>
       <path d="M118 380 Q150 396 182 380" stroke="${d}" stroke-width="4" fill="none"/>` + sparkles(a, 6, 260, 360)],
    ['Sunny Sundress', ([, m, d, a]) => `
      <path d="M130 150 L136 170 M170 150 L164 170" stroke="${d}" stroke-width="5" stroke-linecap="round"/>` +
      bodice(m, d) +
      `<path d="M127 238 Q150 250 173 238 Q186 290 190 330 Q150 346 110 330 Q114 290 127 238 Z" fill="${m}" stroke="${d}" stroke-width="3"/>` +
      Array.from({ length: 6 }, (_, i) => `<circle cx="${118 + (i % 3) * 32}" cy="${276 + Math.floor(i / 3) * 36}" r="4" fill="${a}"/>`).join('')],
    ['Royal Puff Gown', ([, m, d, a]) => `
      <circle cx="122" cy="158" r="13" fill="${m}" stroke="${d}" stroke-width="2.5"/>
      <circle cx="178" cy="158" r="13" fill="${m}" stroke="${d}" stroke-width="2.5"/>` +
      bodice(m, d) +
      `<path d="M127 238 Q150 250 173 238 Q200 320 206 412 Q150 432 94 412 Q100 320 127 238 Z" fill="${m}" stroke="${d}" stroke-width="3"/>
       <path d="M150 252 L150 420 M122 270 L112 405 M178 270 L188 405" stroke="${d}" stroke-width="3" opacity="0.55"/>` +
      sparkles(a, 5, 280, 400)],
    ['Starlight Twirl', ([, m, d, a]) => bodice(m, d) +
      `<path d="M127 238 Q150 250 173 238 Q190 285 196 322 Q150 340 104 322 Q110 285 127 238 Z" fill="${m}" stroke="${d}" stroke-width="3"/>` +
      Array.from({ length: 5 }, (_, i) => {
        const x = 116 + i * 17, y = 290 + (i % 2) * 18;
        return `<path d="M${x} ${y - 6} l1.8 4 4.2 0.4 -3.2 2.8 1 4.2 -3.8 -2.3 -3.8 2.3 1 -4.2 -3.2 -2.8 4.2 -0.4 Z" fill="${a}"/>`;
      }).join('')],
  ];

  const SHOE_COLORS = [
    ['Pink', '#ef8fbc', '#d46aa0'], ['Blue', '#6da3e0', '#4c7fc0'],
    ['Gold', '#e8bb4a', '#c69a2e'], ['Purple', '#a981dd', '#8a62c0'],
    ['Red', '#e85f6e', '#c84252'], ['Mint', '#7fcfa8', '#5fae88'],
    ['White', '#f6f4f0', '#d8d4cc'], ['Rainbow', '#f59ac0', '#7fb8e8'],
  ];
  const foot = (x, fn) => `<g transform="translate(${x} 0)">${fn}</g>`;
  const SHOE_SHAPES = [
    ['Ballet Flats', (c, d) => both((x) =>
      `<ellipse cx="${x}" cy="462" rx="14" ry="9" fill="${c}" stroke="${d}" stroke-width="2"/>
       <path d="M${x - 8} 456 Q${x} 462 ${x + 8} 456" stroke="${d}" stroke-width="2" fill="none"/>`)],
    ['Party Heels', (c, d) => both((x) =>
      `<path d="M${x - 13} 458 Q${x} 448 ${x + 13} 458 L${x + 11} 468 L${x - 11} 468 Z" fill="${c}" stroke="${d}" stroke-width="2"/>
       <rect x="${x - 2}" y="468" width="4" height="9" fill="${d}"/>`)],
    ['Sparkle Sneakers', (c, d) => both((x) =>
      `<rect x="${x - 14}" y="450" width="28" height="17" rx="8" fill="${c}" stroke="${d}" stroke-width="2"/>
       <rect x="${x - 14}" y="462" width="28" height="6" rx="3" fill="#fff"/>
       <path d="M${x - 6} 454 L${x + 6} 458 M${x - 6} 458 L${x + 6} 454" stroke="#fff" stroke-width="2"/>`)],
    ['Tall Boots', (c, d) => both((x) =>
      `<path d="M${x - 10} 415 L${x - 11} 462 Q${x} 470 ${x + 11} 462 L${x + 10} 415 Z" fill="${c}" stroke="${d}" stroke-width="2"/>
       <rect x="${x - 11}" y="412" width="22" height="7" rx="3" fill="${d}"/>`)],
    ['Sunny Sandals', (c, d) => both((x) =>
      `<ellipse cx="${x}" cy="465" rx="14" ry="6" fill="${d}"/>
       <path d="M${x - 10} 460 L${x} 452 L${x + 10} 460" stroke="${c}" stroke-width="3.4" fill="none"/>
       <circle cx="${x}" cy="452" r="3" fill="${c}"/>`)],
    ['Bow Slippers', (c, d) => both((x) =>
      `<ellipse cx="${x}" cy="462" rx="14" ry="9" fill="${c}" stroke="${d}" stroke-width="2"/>
       <path d="M${x - 6} 452 L${x} 456 L${x - 6} 460 Z M${x + 6} 452 L${x} 456 L${x + 6} 460 Z" fill="${d}"/>`)],
    ['Rain Boots', (c, d) => both((x) =>
      `<path d="M${x - 11} 425 L${x - 12} 463 Q${x} 471 ${x + 12} 463 L${x + 11} 425 Z" fill="${c}" stroke="${d}" stroke-width="2"/>
       <rect x="${x - 12}" y="448" width="24" height="5" fill="#fff" opacity="0.7"/>`)],
    ['Ice Skates', (c, d) => both((x) =>
      `<path d="M${x - 12} 444 L${x - 12} 462 Q${x} 469 ${x + 13} 461 L${x + 12} 444 Z" fill="${c}" stroke="${d}" stroke-width="2"/>
       <path d="M${x - 12} 473 L${x + 12} 473" stroke="#9fb6c6" stroke-width="3" stroke-linecap="round"/>
       <path d="M${x} 469 L${x} 473" stroke="#9fb6c6" stroke-width="2"/>`)],
  ];
  function both(fn) { return fn(134) + fn(166); }

  const ACCESSORIES = [
    acc('Golden Crown', 'head', '90 14 120 60', `${GOLD}<path d="M118 56 L126 30 L138 48 L150 24 L162 48 L174 30 L182 56 Z" fill="url(#m-gold)" stroke="#b9871f" stroke-width="2.5"/><circle cx="150" cy="20" r="4.4" fill="#f06a7e"/><circle cx="149" cy="18.6" r="1.4" fill="#ffd9e0"/><circle cx="130" cy="50" r="2.2" fill="#fff" opacity="0.85"/><circle cx="170" cy="50" r="2.2" fill="#fff" opacity="0.85"/>`),
    acc('Silver Tiara', 'head', '100 20 100 50', `${SILVER}<path d="M124 54 Q150 26 176 54" fill="none" stroke="url(#m-silver)" stroke-width="6" stroke-linecap="round"/><circle cx="150" cy="32" r="5.5" fill="#9fd4f2"/><circle cx="148.4" cy="30.4" r="1.8" fill="#fff"/><circle cx="134" cy="42" r="3" fill="#e8eef4"/><circle cx="166" cy="42" r="3" fill="#e8eef4"/>`),
    acc('Rose-Gold Crown', 'head', '95 14 110 55', `<path d="M122 54 L130 32 L142 46 L150 26 L158 46 L170 32 L178 54 Z" fill="#eeb8a8" stroke="#d8957f" stroke-width="2.5"/><circle cx="150" cy="22" r="3.6" fill="#fff"/>`),
    acc('Pearl Tiara', 'head', '100 24 100 45', `<path d="M126 54 Q150 32 174 54" fill="none" stroke="#f3eee4" stroke-width="5"/><circle cx="138" cy="42" r="4" fill="#fff"/><circle cx="150" cy="37" r="5" fill="#fff"/><circle cx="162" cy="42" r="4" fill="#fff"/>`),
    acc('Flower Crown', 'head', '95 24 110 45', [0, 1, 2, 3, 4].map((i) => `<circle cx="${122 + i * 14}" cy="${44 - Math.sin(i / 4 * Math.PI) * 10}" r="6" fill="${i % 2 ? '#f9b8d4' : '#fff'}"/><circle cx="${122 + i * 14}" cy="${44 - Math.sin(i / 4 * Math.PI) * 10}" r="2.4" fill="#f3c64e"/>`).join('')),
    acc('Daisy Halo', 'head', '95 24 110 45', [0, 1, 2, 3, 4].map((i) => `<circle cx="${122 + i * 14}" cy="${44 - Math.sin(i / 4 * Math.PI) * 10}" r="5.5" fill="#fff"/><circle cx="${122 + i * 14}" cy="${44 - Math.sin(i / 4 * Math.PI) * 10}" r="2.2" fill="#f7d774"/>`).join('')),
    acc('Red Hair Bow', 'head', '90 28 70 50', bow(116, 50, '#e85f6e', '#c84252')),
    acc('Pink Hair Bow', 'head', '90 28 70 50', bow(116, 50, '#f49ac1', '#df7fae')),
    acc('Blue Hair Bow', 'head', '90 28 70 50', bow(116, 50, '#6da3e0', '#4c7fc0')),
    acc('Sunny Hair Bow', 'head', '90 28 70 50', bow(116, 50, '#f3c64e', '#d3a32e')),
    acc('Kitty Ears', 'head', '95 14 110 50', `<path d="M116 52 L122 24 L140 42 Z M184 52 L178 24 L160 42 Z" fill="#3a3340"/><path d="M122 44 L125 32 L134 41 Z M178 44 L175 32 L166 41 Z" fill="#f49ac1"/>`),
    acc('Bunny Ears', 'head', '95 0 110 60', `<ellipse cx="130" cy="24" rx="9" ry="26" fill="#fff" stroke="#e8dcd2" stroke-width="2"/><ellipse cx="170" cy="24" rx="9" ry="26" fill="#fff" stroke="#e8dcd2" stroke-width="2"/><ellipse cx="130" cy="26" rx="4" ry="18" fill="#f9c9d8"/><ellipse cx="170" cy="26" rx="4" ry="18" fill="#f9c9d8"/>`),
    acc('Round Glasses', 'head', '110 70 80 35', `<circle cx="134" cy="87" r="11" fill="none" stroke="#9573cc" stroke-width="3"/><circle cx="166" cy="87" r="11" fill="none" stroke="#9573cc" stroke-width="3"/><path d="M145 87 L155 87" stroke="#9573cc" stroke-width="3"/>`),
    acc('Heart Sunnies', 'head', '108 70 84 35', `<path d="M134 96 C122 86 120 78 127 75 C131 73 134 77 134 80 C134 77 137 73 141 75 C148 78 146 86 134 96 Z" fill="#f06a9e"/><path d="M166 96 C154 86 152 78 159 75 C163 73 166 77 166 80 C166 77 169 73 173 75 C180 78 178 86 166 96 Z" fill="#f06a9e"/><path d="M145 84 L155 84" stroke="#f06a9e" stroke-width="3"/>`),
    acc('Star Sunnies', 'head', '108 70 84 35', `<path d="M134 76 l3.5 7 8 1 -6 5.5 1.6 8 -7.1 -4.2 -7.1 4.2 1.6 -8 -6 -5.5 8 -1 Z" fill="#f3c64e"/><path d="M166 76 l3.5 7 8 1 -6 5.5 1.6 8 -7.1 -4.2 -7.1 4.2 1.6 -8 -6 -5.5 8 -1 Z" fill="#f3c64e"/><path d="M145 86 L155 86" stroke="#f3c64e" stroke-width="3"/>`),
    acc('Pearl Studs', 'head', '115 100 70 25', `<circle cx="124" cy="112" r="4.4" fill="#fff" stroke="#ddd4c4" stroke-width="1.5"/><circle cx="176" cy="112" r="4.4" fill="#fff" stroke="#ddd4c4" stroke-width="1.5"/>`),
    acc('Star Dangles', 'head', '112 100 76 35', dangle('M0 0 l2.6 5.2 6 0.8 -4.4 4 1.2 6 -5.4 -3.2 -5.4 3.2 1.2 -6 -4.4 -4 6 -0.8 Z', '#f3c64e')),
    acc('Heart Dangles', 'head', '112 100 76 35', dangle('M0 8 C-7 2 -8 -3 -4 -5 C-1.5 -6 0 -3.5 0 -2 C0 -3.5 1.5 -6 4 -5 C8 -3 7 2 0 8 Z', '#f06a7e')),
    acc('Pearl Necklace', 'body', '115 140 70 35', [0, 1, 2, 3, 4, 5, 6].map((i) => `<circle cx="${129 + i * 7}" cy="${152 + Math.sin(i / 6 * Math.PI) * 9}" r="3.6" fill="#fff" stroke="#ddd4c4" stroke-width="1.2"/>`).join('')),
    acc('Heart Pendant', 'body', '120 140 60 40', `<path d="M132 148 Q150 162 168 148" fill="none" stroke="#e8bb4a" stroke-width="2.5"/><path d="M150 172 C141 165 140 159 145 157 C148 156 150 159 150 161 C150 159 152 156 155 157 C160 159 159 165 150 172 Z" fill="#f06a7e"/>`),
    acc('Star Pendant', 'body', '120 140 60 40', `<path d="M132 148 Q150 162 168 148" fill="none" stroke="#cdd6e0" stroke-width="2.5"/><path d="M150 158 l2.8 5.6 6.2 0.9 -4.5 4.4 1 6.2 -5.5 -3 -5.5 3 1 -6.2 -4.5 -4.4 6.2 -0.9 Z" fill="#9fd4f2"/>`),
    acc('Gem Choker', 'body', '120 138 60 25', `<path d="M133 146 Q150 154 167 146" fill="none" stroke="#a861b8" stroke-width="5"/><circle cx="150" cy="151" r="4" fill="#ffe9f7"/>`),
    acc('Star Wand', 'body', '185 215 70 95', `${GOLD}<path d="M196 290 L214 236" stroke="url(#m-gold)" stroke-width="5" stroke-linecap="round"/><path d="M216 230 l3.4 6.8 7.5 1.1 -5.4 5.3 1.3 7.5 -6.8 -3.6 -6.8 3.6 1.3 -7.5 -5.4 -5.3 7.5 -1.1 Z" fill="url(#m-gold)" stroke="#b9871f" stroke-width="1.2"/><path d="M206 252 l4 2 M222 258 l-3 4" stroke="#f7e9b0" stroke-width="2.4" stroke-linecap="round"/>`),
    acc('Heart Wand', 'body', '185 215 70 95', `<path d="M196 290 L214 238" stroke="#df7fae" stroke-width="5" stroke-linecap="round"/><path d="M216 244 C207 236 206 229 211 227 C214 226 216 229 216 231 C216 229 218 226 221 227 C226 229 225 236 216 244 Z" fill="#f06a9e"/>`),
    acc('Snow Wand', 'body', '185 215 70 95', `<path d="M196 290 L214 238" stroke="#8fc3ec" stroke-width="5" stroke-linecap="round"/><g stroke="#bfe9fb" stroke-width="3.4" stroke-linecap="round"><path d="M216 222 L216 244 M205 233 L227 233 M208 225 L224 241 M224 225 L208 241"/></g>`),
    acc('Heart Purse', 'body', '70 280 70 70', `<path d="M105 295 Q88 308 92 326 Q94 338 105 338 Q116 338 118 326 Q122 308 105 295" fill="#f49ac1" stroke="#df7fae" stroke-width="2.5"/><path d="M99 318 C95 314 95 311 97 310 C99 309 100 311 100 312 C100 311 101 309 103 310 C105 311 105 314 101 318 Z" fill="#fff" transform="translate(4 0)"/>`),
    acc('Blueberry Bag', 'body', '70 280 70 70', `<rect x="90" y="304" width="30" height="26" rx="9" fill="#6da3e0" stroke="#4c7fc0" stroke-width="2.5"/><path d="M96 304 Q105 290 114 304" fill="none" stroke="#4c7fc0" stroke-width="3"/><circle cx="105" cy="317" r="4" fill="#fff"/>`),
    acc('Rainbow Tote', 'body', '70 280 70 70', `<path d="M89 306 H121 L118 334 H92 Z" fill="#fff" stroke="#d8d4cc" stroke-width="2"/><path d="M93 312 H117 M94 318 H116 M95 324 H115" stroke-width="3.4" stroke="#f59ac0" fill="none"/><path d="M94 318 H116" stroke="#f3c64e" stroke-width="3.4"/><path d="M95 324 H115" stroke="#7fb8e8" stroke-width="3.4"/><path d="M96 306 Q105 294 114 306" fill="none" stroke="#d8d4cc" stroke-width="3"/>`),
    acc('Fairy Wings', 'back', '40 130 220 160', wings('#e8f4fb', '#bcd9ec')),
    acc('Butterfly Wings', 'back', '40 130 220 160', wings('#f9d4e8', '#ef8fbc') + `<circle cx="92" cy="180" r="7" fill="#fff" opacity="0.8"/><circle cx="208" cy="180" r="7" fill="#fff" opacity="0.8"/>`),
    acc('Cozy Scarf', 'body', '115 130 70 60', `<path d="M130 146 Q150 158 170 146 L170 156 Q150 168 130 156 Z" fill="#e85f6e"/><rect x="158" y="152" width="12" height="34" rx="5" fill="#e85f6e"/><path d="M158 180 L162 188 M166 180 L170 188" stroke="#c84252" stroke-width="3"/>`),
    acc('Golden Bangle', 'body', '180 265 40 30', `${GOLD}<circle cx="196" cy="280" r="8" fill="none" stroke="url(#m-gold)" stroke-width="4"/>`),
    acc('Friendship Band', 'body', '85 265 40 30', `<circle cx="104" cy="280" r="8" fill="none" stroke="#f59ac0" stroke-width="4"/><circle cx="104" cy="272" r="2.4" fill="#7fb8e8"/>`),
    acc('Sparkle Belt', 'body', '110 230 80 30', `<path d="M128 242 Q150 250 172 242 L172 250 Q150 258 128 250 Z" fill="#f3c64e"/><circle cx="150" cy="248" r="4.4" fill="#fff"/>`),
  ];
  function acc(name, layer, thumbBox, svg) { return { name, layer, thumbBox, svg }; }
  function bow(x, y, c, d) {
    return `<path d="M${x} ${y} L${x - 16} ${y - 10} Q${x - 22} ${y} ${x - 16} ${y + 10} Z M${x} ${y} L${x + 16} ${y - 10} Q${x + 22} ${y} ${x + 16} ${y + 10} Z" fill="${c}" stroke="${d}" stroke-width="2"/><circle cx="${x}" cy="${y}" r="5" fill="${d}"/>`;
  }
  function dangle(path, fill) {
    return `<circle cx="124" cy="110" r="2" fill="#caa64c"/><circle cx="176" cy="110" r="2" fill="#caa64c"/>
      <g transform="translate(124 124)"><path d="${path}" fill="${fill}"/></g>
      <g transform="translate(176 124)"><path d="${path}" fill="${fill}"/></g>`;
  }
  function wings(c, d) {
    return `<path d="M118 165 Q60 130 52 175 Q48 215 112 210 Z" fill="${c}" stroke="${d}" stroke-width="3"/>
      <path d="M118 200 Q70 225 84 258 Q96 280 120 230 Z" fill="${c}" stroke="${d}" stroke-width="3"/>
      <path d="M182 165 Q240 130 248 175 Q252 215 188 210 Z" fill="${c}" stroke="${d}" stroke-width="3"/>
      <path d="M182 200 Q230 225 216 258 Q204 280 180 230 Z" fill="${c}" stroke="${d}" stroke-width="3"/>`;
  }

  /* ---------- build the catalog ---------- */
  function buildItems() {
    const items = { hair: [], dress: [], shoes: [], extras: [] };
    HAIR_SHAPES.forEach(([name, fn], si) => {
      for (let k = 0; k < 4; k++) {
        const [cn, c, d] = HAIR_COLORS[(si + k * 3) % HAIR_COLORS.length];
        const gid = `hg${si}-${k}`;
        const parts = fn(`url(#${gid})`, d);
        // glossy highlight swept across the crown
        const shine = `<path d="M119 64 Q135 45 152 45" stroke="rgba(255,255,255,0.4)" stroke-width="7" fill="none" stroke-linecap="round"/>`;
        items.hair.push({
          id: `h${si}-${k}`, name: `${cn} ${name}`,
          back: `<defs>${grad(gid, shade(c, 24), shade(c, -16))}</defs>` + parts.back,
          front: parts.front + shine,
          thumbBox: '70 0 160 290',
        });
      }
    });
    DRESS_SHAPES.forEach(([name, fn], si) => {
      for (let k = 0; k < 4; k++) {
        const p = DRESS_PALETTES[(si + k * 3) % DRESS_PALETTES.length];
        const gid = `dg${si}-${k}`;
        const satin = [p[0], `url(#${gid})`, p[2], p[3]];
        items.dress.push({
          id: `d${si}-${k}`, name: `${p[0]} ${name}`,
          svg: `<defs>${grad(gid, shade(p[1], 22), shade(p[1], -20))}</defs>` + fn(satin),
          thumbBox: '60 130 180 350',
        });
      }
    });
    SHOE_SHAPES.forEach(([name, fn], si) => {
      for (let k = 0; k < 4; k++) {
        const [cn, c, d] = SHOE_COLORS[(si + k * 2) % SHOE_COLORS.length];
        const gid = `sg${si}-${k}`;
        items.shoes.push({
          id: `s${si}-${k}`, name: `${cn} ${name}`,
          svg: `<defs>${grad(gid, shade(c, 26), shade(c, -18))}</defs>` + fn(`url(#${gid})`, d),
          thumbBox: '105 400 90 85',
        });
      }
    });
    ACCESSORIES.forEach((a, i) => {
      items.extras.push({ id: `a${i}`, ...a });
    });
    return items;
  }

  const ITEMS = buildItems();
  const CATS = [
    ['hair', '💇‍♀️ Hair'], ['dress', '👗 Dresses'], ['shoes', '👠 Shoes'], ['extras', '👑 Extras'],
  ];

  let outfit = { hair: null, dress: null, shoes: null, extras: [] };
  let currentCat = 'hair';
  let stage, dollWrap, caption, itemsBox, tabsBox;

  function find(cat, id) { return ITEMS[cat].find((i) => i.id === id); }

  /* ---------- rendering ---------- */
  function dollSVG() {
    const hair = outfit.hair && find('hair', outfit.hair);
    const dress = outfit.dress && find('dress', outfit.dress);
    const shoes = outfit.shoes && find('shoes', outfit.shoes);
    const extras = outfit.extras.map((id) => find('extras', id)).filter(Boolean);
    const layer = (l) => extras.filter((a) => a.layer === l).map((a) => a.svg).join('');
    return `<svg viewBox="0 0 300 560" xmlns="http://www.w3.org/2000/svg">
      ${layer('back')}
      ${hair ? hair.back : ''}
      ${bodySVG()}
      ${shoes ? shoes.svg : ''}
      ${dress ? dress.svg : onesieSVG()}
      ${layer('body')}
      ${hair ? hair.front : ''}
      ${layer('head')}
    </svg>`;
  }

  function renderDoll() {
    dollWrap.innerHTML = dollSVG();
    const dress = outfit.dress && find('dress', outfit.dress);
    caption.textContent = dress ? `✨ ${dress.name} ✨` : '🍼 Cozy Onesie';
  }

  function renderTabs() {
    tabsBox.innerHTML = '';
    for (const [cat, label] of CATS) {
      const btn = document.createElement('button');
      btn.className = 'dress-tab' + (cat === currentCat ? ' selected' : '');
      btn.textContent = label;
      btn.addEventListener('click', () => {
        Sound.click();
        currentCat = cat;
        renderTabs();
        renderItems();
      });
      tabsBox.appendChild(btn);
    }
  }

  function thumbSVG(item) {
    const inner = currentCat === 'hair' ? item.back + item.front : item.svg;
    return `<svg viewBox="${item.thumbBox}" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
  }

  function renderItems() {
    itemsBox.innerHTML = '';
    const cat = currentCat;
    if (cat !== 'extras') {
      const none = document.createElement('button');
      none.className = 'item-card none-card' + (outfit[cat] === null ? ' selected' : '');
      none.innerHTML = '<span>🚫</span><small>None</small>';
      none.addEventListener('click', () => {
        Sound.pop();
        outfit[cat] = null;
        saveOutfit();
        renderDoll();
        renderItems();
      });
      itemsBox.appendChild(none);
    }
    for (const item of ITEMS[cat]) {
      const selected = cat === 'extras' ? outfit.extras.includes(item.id) : outfit[cat] === item.id;
      const card = document.createElement('button');
      card.className = 'item-card' + (selected ? ' selected' : '');
      card.innerHTML = thumbSVG(item) + `<small>${item.name}</small>`;
      card.addEventListener('click', () => {
        Sound.pop();
        if (cat === 'extras') {
          if (outfit.extras.includes(item.id)) outfit.extras = outfit.extras.filter((x) => x !== item.id);
          else outfit.extras.push(item.id);
        } else {
          outfit[cat] = outfit[cat] === item.id ? null : item.id;
        }
        saveOutfit();
        renderDoll();
        renderItems();
      });
      itemsBox.appendChild(card);
    }
  }

  function shuffle() {
    Sound.fanfare();
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)].id;
    outfit.hair = pick(ITEMS.hair);
    outfit.dress = pick(ITEMS.dress);
    outfit.shoes = pick(ITEMS.shoes);
    outfit.extras = [];
    const n = 1 + Math.floor(Math.random() * 3);
    while (outfit.extras.length < n) {
      const id = pick(ITEMS.extras);
      if (!outfit.extras.includes(id)) outfit.extras.push(id);
    }
    saveOutfit();
    renderDoll();
    renderItems();
    throwConfetti(60);
  }

  function saveOutfit() { localStorage.setItem(STORE_KEY, JSON.stringify(outfit)); }

  function init() {
    stage = document.getElementById('dressup-stage');
    tabsBox = document.getElementById('dressup-tabs');
    itemsBox = document.getElementById('dressup-items');

    // boutique stage: doll platform, outfit caption, twinkling sparkles
    stage.innerHTML = '<div id="doll-wrap"></div><div id="dressup-caption"></div>';
    dollWrap = document.getElementById('doll-wrap');
    caption = document.getElementById('dressup-caption');
    for (let i = 0; i < 7; i++) {
      const s = document.createElement('span');
      s.className = 'stage-sparkle';
      s.textContent = i % 2 ? '✦' : '✧';
      s.style.left = 5 + Math.random() * 90 + '%';
      s.style.top = 4 + Math.random() * 86 + '%';
      s.style.fontSize = 0.7 + Math.random() * 0.9 + 'rem';
      s.style.animationDelay = Math.random() * 2.6 + 's';
      stage.appendChild(s);
    }
    try {
      const saved = JSON.parse(localStorage.getItem(STORE_KEY));
      if (saved) outfit = { hair: null, dress: null, shoes: null, extras: [], ...saved };
    } catch (e) { /* fresh doll */ }

    document.getElementById('dressup-shuffle').addEventListener('click', shuffle);
    document.getElementById('dressup-reset').addEventListener('click', () => {
      Sound.pop();
      outfit = { hair: null, dress: null, shoes: null, extras: [] };
      saveOutfit();
      renderDoll();
      renderItems();
    });
    renderTabs();
  }

  function start() {
    renderDoll();
    renderItems();
  }

  return { init, start };
})();
