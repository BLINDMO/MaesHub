/* ============ Character art ============
 * Hand-drawn SVG characters shared by the games: cute cartoon puppies for
 * Road Hopper, a proper four-legged wolf for Egg Surprise, and the sleepy
 * goodnight pup for the Nighttime screen. All original art, drawn in code.
 */
const Chars = (() => {

  /* A front-facing cartoon puppy. Options pick fur colors, spots and hats. */
  function pupSVG(o) {
    const fur = o.fur, belly = o.belly || '#fdf3df', inner = o.earInner || '#f4a9c0';
    const dark = o.dark || shade(fur, -28);
    const eyes = o.sleeping
      ? `<path d="M36 40 q5 5 10 0" stroke="#3a2c20" stroke-width="2.5" fill="none" stroke-linecap="round"/>
         <path d="M54 40 q5 5 10 0" stroke="#3a2c20" stroke-width="2.5" fill="none" stroke-linecap="round"/>`
      : `<circle cx="41" cy="40" r="6.5" fill="#fff"/><circle cx="59" cy="40" r="6.5" fill="#fff"/>
         <circle cx="42" cy="41" r="3.6" fill="#2d2419"/><circle cx="58" cy="41" r="3.6" fill="#2d2419"/>
         <circle cx="43.4" cy="39.6" r="1.3" fill="#fff"/><circle cx="59.4" cy="39.6" r="1.3" fill="#fff"/>`;
    const eyePatch = o.eyePatch ? `<ellipse cx="59" cy="40" rx="9.5" ry="11" fill="${dark}" opacity="0.85"/>` : '';
    const spots = o.spots
      ? `<circle cx="30" cy="74" r="4" fill="#3a3a3a"/><circle cx="66" cy="80" r="3.4" fill="#3a3a3a"/>
         <circle cx="50" cy="86" r="2.8" fill="#3a3a3a"/>`
      : '';
    let hat = '';
    if (o.hat === 'police') {
      hat = `<path d="M26 22 Q50 6 74 22 L72 28 Q50 18 28 28 Z" fill="#2f5fa8"/>
             <rect x="40" y="10" width="20" height="9" rx="4" fill="#2f5fa8"/>
             <circle cx="50" cy="19" r="3.4" fill="#ffd54f"/>`;
    } else if (o.hat === 'fire') {
      hat = `<path d="M28 24 Q50 2 72 24 L74 28 L26 28 Z" fill="#d83a34"/>
             <rect x="46" y="6" width="8" height="12" rx="3" fill="#d83a34"/>
             <ellipse cx="50" cy="27" rx="25" ry="4" fill="#b02824"/>
             <circle cx="50" cy="16" r="3.2" fill="#ffd54f"/>`;
    } else if (o.hat === 'aviator') {
      hat = `<path d="M28 26 Q50 8 72 26 L70 30 Q50 22 30 30 Z" fill="#e8638c"/>
             <rect x="30" y="26" width="40" height="6" rx="3" fill="#f9f1f5" opacity="0.85"/>
             <circle cx="40" cy="29" r="5" fill="none" stroke="#caa64c" stroke-width="2.4"/>
             <circle cx="60" cy="29" r="5" fill="none" stroke="#caa64c" stroke-width="2.4"/>`;
    } else if (o.hat === 'nightcap') {
      hat = `<path d="M27 26 Q42 0 76 8 Q66 14 70 24 Q50 16 29 30 Z" fill="#7e6bd4"/>
             <circle cx="77" cy="8" r="5" fill="#fff"/>
             <path d="M27 27 Q50 16 71 25" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/>`;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 110">
      <ellipse cx="50" cy="105" rx="26" ry="4" fill="rgba(0,0,0,0.14)"/>
      <!-- tail -->
      <path d="M76 84 Q90 78 88 66" stroke="${fur}" stroke-width="8" fill="none" stroke-linecap="round"/>
      <!-- body -->
      <rect x="28" y="62" width="44" height="42" rx="18" fill="${fur}"/>
      <ellipse cx="50" cy="86" rx="14" ry="15" fill="${belly}"/>
      ${spots}
      <!-- paws -->
      <ellipse cx="38" cy="102" rx="8" ry="6" fill="${dark}"/>
      <ellipse cx="62" cy="102" rx="8" ry="6" fill="${dark}"/>
      <!-- ears -->
      <path d="M22 34 Q18 8 36 16 Q42 20 38 32 Z" fill="${dark}"/>
      <path d="M78 34 Q82 8 64 16 Q58 20 62 32 Z" fill="${dark}"/>
      <path d="M26 30 Q25 16 34 20 Q37 23 35 30 Z" fill="${inner}"/>
      <path d="M74 30 Q75 16 66 20 Q63 23 65 30 Z" fill="${inner}"/>
      <!-- head -->
      <ellipse cx="50" cy="42" rx="29" ry="26" fill="${fur}"/>
      <ellipse cx="50" cy="52" rx="16" ry="12" fill="${belly}"/>
      ${eyePatch}
      ${eyes}
      <path d="M45 52 Q50 56 55 52" stroke="#3a2c20" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <path d="M46 49 a4 3 0 0 1 8 0 a4 4 0 0 1 -8 0" fill="#3a2c20"/>
      ${hat}
    </svg>`;
  }

  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const f = (v) => Math.max(0, Math.min(255, v + amt));
    const r = f(n >> 16), g = f((n >> 8) & 255), b = f(n & 255);
    return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
  }

  // playable pups for Road Hopper (original art, familiar vibes)
  const PUPS = [
    { id: 'blue',   name: 'Blue Puppy',   svg: pupSVG({ fur: '#6db3e8', belly: '#fdf3df', dark: '#3f7fb5', eyePatch: true }) },
    { id: 'peach',  name: 'Peach Puppy',  svg: pupSVG({ fur: '#f0b285', belly: '#fdf3df', dark: '#c98a5a', eyePatch: true }) },
    { id: 'police', name: 'Police Pup',   svg: pupSVG({ fur: '#a8794f', belly: '#f3e3c8', dark: '#7d5634', hat: 'police' }) },
    { id: 'fire',   name: 'Fire Pup',     svg: pupSVG({ fur: '#f5f0e8', belly: '#fff', dark: '#d8cfc2', spots: true, hat: 'fire' }) },
    { id: 'sky',    name: 'Flying Pup',   svg: pupSVG({ fur: '#e8c9a4', belly: '#fdf3df', dark: '#c4a073', hat: 'aviator' }) },
  ];

  const SLEEPY_PUP = pupSVG({ fur: '#6db3e8', belly: '#fdf3df', dark: '#3f7fb5', eyePatch: true, sleeping: true, hat: 'nightcap' });

  /* A proper side-view wolf: body, head, snout, four legs and a bushy tail.
   * Friendly face — cheeky, not scary. Legs carry classes so CSS can swing
   * them while he walks. */
  function wolfSVG() {
    const fur = '#8d9aa8', dark = '#6b7886', light = '#c6cfd8';
    const leg = (x, cls) =>
      `<g class="wolf-leg ${cls}" style="transform-origin:${x}px 62px">
         <rect x="${x - 5}" y="60" width="10" height="30" rx="5" fill="${dark}"/>
         <ellipse cx="${x}" cy="90" rx="7" ry="5" fill="${fur}"/>
       </g>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 170 100">
      <ellipse cx="85" cy="95" rx="55" ry="5" fill="rgba(0,0,0,0.14)"/>
      <!-- bushy tail -->
      <path d="M28 56 Q2 48 8 30 Q14 44 30 44 Z" fill="${fur}"/>
      ${leg(48, 'back1')}${leg(66, 'front1')}${leg(100, 'back2')}${leg(118, 'front2')}
      <!-- body -->
      <ellipse cx="83" cy="52" rx="48" ry="22" fill="${fur}"/>
      <path d="M40 48 Q83 30 126 48 L126 56 Q83 40 40 56 Z" fill="${dark}" opacity="0.5"/>
      <ellipse cx="88" cy="62" rx="34" ry="11" fill="${light}"/>
      <!-- head -->
      <g>
        <path d="M122 18 L130 2 L138 20 Z" fill="${dark}"/>
        <path d="M146 16 L156 2 L160 22 Z" fill="${dark}"/>
        <ellipse cx="142" cy="30" rx="24" ry="19" fill="${fur}"/>
        <path d="M158 30 Q174 32 168 40 Q160 44 152 40 Z" fill="${light}"/>
        <circle cx="168" cy="36" r="4" fill="#33302c"/>
        <circle cx="140" cy="26" r="5" fill="#fff"/>
        <circle cx="141.5" cy="27" r="2.8" fill="#33302c"/>
        <path d="M150 42 Q156 46 162 42" stroke="#33302c" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      </g>
    </svg>`;
  }

  /* Just the wolf's face — revealed inside the unlucky egg. */
  function wolfHeadSVG() {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 70">
      <path d="M16 22 L22 2 L34 20 Z" fill="#6b7886"/>
      <path d="M46 20 L58 2 L64 22 Z" fill="#6b7886"/>
      <ellipse cx="40" cy="40" rx="28" ry="24" fill="#8d9aa8"/>
      <ellipse cx="40" cy="52" rx="14" ry="11" fill="#c6cfd8"/>
      <circle cx="29" cy="35" r="6" fill="#fff"/><circle cx="51" cy="35" r="6" fill="#fff"/>
      <circle cx="30.5" cy="36" r="3.2" fill="#33302c"/><circle cx="49.5" cy="36" r="3.2" fill="#33302c"/>
      <ellipse cx="40" cy="49" rx="5" ry="3.6" fill="#33302c"/>
      <path d="M33 57 Q40 62 47 57" stroke="#33302c" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    </svg>`;
  }

  function toImage(svg) {
    const img = new Image();
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    return img;
  }

  return { PUPS, SLEEPY_PUP, wolfSVG, wolfHeadSVG, toImage, pupSVG };
})();
