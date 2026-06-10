/* ============ Game 1: Block Builder (physics!) ============
 * Real 2D physics via Matter.js: tap a palette block and it drops from the
 * sky, lands, and stacks — build a tower! Drag blocks around with a finger
 * (they keep their physics), and drop them on the trash can to remove them.
 * The crayon button opens a drawing pad; whatever Mae draws becomes a real
 * physics block that drops in too.
 */
const Blocks = (() => {
  const { Engine, Composite, Bodies, Mouse, MouseConstraint, Events } = Matter;

  const CRAYON_COLORS = ['#ff5fa2', '#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c', '#4dabf7', '#9775fa', '#5b3a70'];
  const MAX_BODIES = 60;
  const GROUND_H = 26;

  // physical blocks: each palette entry knows its icon and how to build its body
  const PREBUILT = [
    { icon: iconSvg(80, 80, '<rect x="3" y="3" width="74" height="74" rx="10" fill="#ff6b6b" stroke="#d24545" stroke-width="5"/>'),
      make: (x, y) => box(x, y, 78, 78, '#ff6b6b', '#d24545') },
    { icon: iconSvg(150, 50, '<rect x="3" y="3" width="144" height="44" rx="10" fill="#4dabf7" stroke="#2b7fc4" stroke-width="5"/>'),
      make: (x, y) => box(x, y, 150, 42, '#4dabf7', '#2b7fc4') },
    { icon: iconSvg(50, 130, '<rect x="3" y="3" width="44" height="124" rx="10" fill="#9775fa" stroke="#6d4fc4" stroke-width="5"/>'),
      make: (x, y) => box(x, y, 46, 122, '#9775fa', '#6d4fc4') },
    { icon: iconSvg(56, 56, '<rect x="3" y="3" width="50" height="50" rx="8" fill="#ffd43b" stroke="#dba512" stroke-width="5"/>'),
      make: (x, y) => box(x, y, 52, 52, '#ffd43b', '#dba512') },
    { icon: iconSvg(110, 70, '<polygon points="55,4 106,66 4,66" fill="#ffa94d" stroke="#d67f25" stroke-width="5" stroke-linejoin="round"/>'),
      make: (x, y) => triangle(x, y, 106, 62, '#ffa94d', '#d67f25') },
    { icon: iconSvg(76, 76, '<circle cx="38" cy="38" r="34" fill="#69db7c" stroke="#3fa552" stroke-width="5"/>'),
      make: (x, y) => ball(x, y, 35, '#69db7c', '#3fa552') },
    { icon: iconSvg(86, 84, '<polygon points="43,4 53,32 82,32 59,50 67,79 43,61 19,79 27,50 4,32 33,32" fill="#ffd43b" stroke="#dba512" stroke-width="4" stroke-linejoin="round"/>'),
      make: (x, y) => star(x, y, 40, '#ffd43b', '#dba512') },
    { icon: iconSvg(86, 78, '<path d="M43 74 C8 48 2 26 14 13 C26 1 43 12 43 24 C43 12 60 1 72 13 C84 26 78 48 43 74 Z" fill="#ff8787" stroke="#d24f4f" stroke-width="4"/>'),
      make: (x, y) => heart(x, y, 0.95, '#ff8787', '#d24f4f') },
  ];

  let stage, canvas, ctx, trash, palette;
  let engine = null, world = null, mouseConstraint = null;
  let statics = [];
  let rafId = null, lastTime = 0, active = false;
  let drawModal, drawCanvas, drawCtx;
  let drawColor = CRAYON_COLORS[0];
  let drawing = false, drewSomething = false;

  function iconSvg(w, h, inner) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${inner}</svg>`;
  }

  const PHYS = { friction: 0.9, frictionStatic: 1.2, restitution: 0.05, density: 0.002 };

  function box(x, y, w, h, color, stroke) {
    const b = Bodies.rectangle(x, y, w, h, { ...PHYS, chamfer: { radius: Math.min(10, w / 4, h / 4) } });
    b.plugin.draw = { kind: 'rect', w, h, color, stroke };
    return b;
  }
  function ball(x, y, r, color, stroke) {
    const b = Bodies.circle(x, y, r, { ...PHYS, restitution: 0.3, friction: 0.4 });
    b.plugin.draw = { kind: 'circle', r, color, stroke };
    return b;
  }
  function triangle(x, y, w, h, color, stroke) {
    const verts = [{ x: 0, y: -h / 2 }, { x: w / 2, y: h / 2 }, { x: -w / 2, y: h / 2 }];
    const b = Bodies.fromVertices(x, y, [verts], { ...PHYS });
    // fromVertices centers the body on its centroid, not the bounding box
    b.plugin.draw = { kind: 'tri', w, h, color, stroke, cy: h / 6 };
    return b;
  }
  function star(x, y, r, color, stroke) {
    // a chunky pentagon body wearing a star costume — close enough for toddler physics
    const b = Bodies.polygon(x, y, 5, r * 0.72, { ...PHYS });
    b.plugin.draw = { kind: 'star', r, color, stroke };
    return b;
  }
  function heart(x, y, scale, color, stroke) {
    // convex hull of the heart shape (the top notch is ignored by physics)
    const pts = [
      { x: 0, y: 36 }, { x: -34, y: 4 }, { x: -36, y: -16 }, { x: -20, y: -32 },
      { x: 20, y: -32 }, { x: 36, y: -16 }, { x: 34, y: 4 },
    ].map((p) => ({ x: p.x * scale, y: p.y * scale }));
    const c = polyCentroid(pts);
    const b = Bodies.fromVertices(x, y, [pts], { ...PHYS });
    b.plugin.draw = { kind: 'heart', scale, color, stroke, cx: c.x, cy: c.y };
    return b;
  }
  function polyCentroid(pts) {
    let a = 0, cx = 0, cy = 0;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i], q = pts[(i + 1) % pts.length];
      const cross = p.x * q.y - q.x * p.y;
      a += cross;
      cx += (p.x + q.x) * cross;
      cy += (p.y + q.y) * cross;
    }
    a *= 0.5;
    return { x: cx / (6 * a), y: cy / (6 * a) };
  }
  function imageBlock(x, y, img, w, h) {
    const b = Bodies.rectangle(x, y, w, h, { ...PHYS, chamfer: { radius: 6 } });
    b.plugin.draw = { kind: 'img', img, w, h };
    return b;
  }

  /* ----- lifecycle ----- */
  function init() {
    stage = document.getElementById('blocks-stage');
    canvas = document.getElementById('blocks-canvas');
    ctx = canvas.getContext('2d');
    trash = document.getElementById('trash-zone');
    palette = document.getElementById('palette');
    drawModal = document.getElementById('draw-modal');
    drawCanvas = document.getElementById('draw-canvas');
    drawCtx = drawCanvas.getContext('2d');

    for (const p of PREBUILT) addPaletteItem(p.icon, () => spawn(p.make));

    document.getElementById('blocks-clear').addEventListener('click', () => {
      Sound.pop();
      if (world) Composite.allBodies(world).filter((b) => !b.isStatic).forEach((b) => Composite.remove(world, b));
    });

    document.getElementById('blocks-draw-btn').addEventListener('click', openDrawPad);
    document.getElementById('draw-cancel').addEventListener('click', () => { Sound.click(); drawModal.classList.add('hidden'); });
    document.getElementById('draw-clear').addEventListener('click', () => { Sound.click(); clearPad(); });
    document.getElementById('draw-done').addEventListener('click', finishDrawing);

    const colorRow = document.getElementById('draw-colors');
    CRAYON_COLORS.forEach((c, i) => {
      const dot = document.createElement('button');
      dot.className = 'color-dot' + (i === 0 ? ' selected' : '');
      dot.style.background = c;
      dot.setAttribute('aria-label', 'color');
      dot.addEventListener('click', () => {
        Sound.click();
        drawColor = c;
        colorRow.querySelectorAll('.color-dot').forEach((d) => d.classList.remove('selected'));
        dot.classList.add('selected');
      });
      colorRow.appendChild(dot);
    });

    drawCanvas.addEventListener('pointerdown', (e) => {
      drawing = true;
      drewSomething = true;
      drawCanvas.setPointerCapture(e.pointerId);
      drawCtx.beginPath();
      drawCtx.moveTo(...padPoint(e));
      drawCtx.lineTo(...padPoint(e));
      strokePad();
    });
    drawCanvas.addEventListener('pointermove', (e) => {
      if (!drawing) return;
      drawCtx.lineTo(...padPoint(e));
      strokePad();
    });
    drawCanvas.addEventListener('pointerup', () => { drawing = false; });

    window.addEventListener('resize', () => { if (active) resize(); });
  }

  function start() {
    active = true;
    if (!engine) buildWorld();
    resize();
    lastTime = performance.now();
    rafId = requestAnimationFrame(loop);
  }

  function stop() {
    active = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  }

  function buildWorld() {
    engine = Engine.create({ enableSleeping: true });
    world = engine.world;
    engine.gravity.y = 1;

    const mouse = Mouse.create(canvas);
    mouseConstraint = MouseConstraint.create(engine, {
      mouse,
      constraint: { stiffness: 0.2, damping: 0.12 },
    });
    Composite.add(world, mouseConstraint);

    Events.on(mouseConstraint, 'startdrag', () => Sound.click());
    Events.on(mouseConstraint, 'enddrag', (e) => {
      const t = trash.getBoundingClientRect();
      const c = canvas.getBoundingClientRect();
      const mx = mouseConstraint.mouse.position.x + c.left;
      const my = mouseConstraint.mouse.position.y + c.top;
      if (mx > t.left - 10 && mx < t.right + 10 && my > t.top - 10 && my < t.bottom + 10) {
        Sound.splash();
        Composite.remove(world, e.body);
      }
      trash.classList.remove('hot');
    });
  }

  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    canvas.width = w;
    canvas.height = h;
    statics.forEach((s) => Composite.remove(world, s));
    statics = [
      Bodies.rectangle(w / 2, h - GROUND_H / 2, w * 3, GROUND_H, { isStatic: true }), // ground
      Bodies.rectangle(-30, h / 2, 60, h * 4, { isStatic: true }),                    // walls
      Bodies.rectangle(w + 30, h / 2, 60, h * 4, { isStatic: true }),
    ];
    Composite.add(world, statics);
  }

  function spawn(make) {
    Sound.pop();
    const bodies = Composite.allBodies(world).filter((b) => !b.isStatic);
    if (bodies.length >= MAX_BODIES) Composite.remove(world, bodies[0]);
    const x = canvas.width / 2 + (Math.random() - 0.5) * canvas.width * 0.3;
    Composite.add(world, make(x, -70));
  }

  function addPaletteItem(iconMarkup, onTap, imgUrl) {
    const item = document.createElement('button');
    item.className = 'palette-item';
    if (imgUrl) {
      const img = document.createElement('img');
      img.src = imgUrl;
      item.appendChild(img);
    } else {
      item.innerHTML = iconMarkup;
    }
    item.addEventListener('click', onTap);
    palette.appendChild(item);
  }

  /* ----- loop & rendering ----- */
  function loop(now) {
    if (!active) return;
    const dt = Math.min(now - lastTime, 33);
    lastTime = now;
    Matter.Engine.update(engine, dt);

    // highlight the trash can while a dragged block hovers near it
    if (mouseConstraint.body) {
      const t = trash.getBoundingClientRect();
      const c = canvas.getBoundingClientRect();
      const mx = mouseConstraint.mouse.position.x + c.left;
      const my = mouseConstraint.mouse.position.y + c.top;
      trash.classList.toggle('hot', mx > t.left - 10 && mx < t.right + 10 && my > t.top - 10 && my < t.bottom + 10);
    }

    // rescue anything that escaped the world
    for (const b of Composite.allBodies(world)) {
      if (!b.isStatic && b.position.y > canvas.height + 400) Composite.remove(world, b);
    }

    draw();
    rafId = requestAnimationFrame(loop);
  }

  function draw() {
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // grassy ground
    ctx.fillStyle = '#7ccb67';
    ctx.fillRect(0, h - GROUND_H, w, GROUND_H);
    ctx.fillStyle = '#8fd97a';
    ctx.fillRect(0, h - GROUND_H, w, 6);

    for (const b of Composite.allBodies(world)) {
      const d = b.plugin && b.plugin.draw;
      if (!d) continue;
      ctx.save();
      ctx.translate(b.position.x, b.position.y);
      ctx.rotate(b.angle);
      ctx.lineWidth = 5;
      ctx.lineJoin = 'round';
      ctx.fillStyle = d.color || '#fff';
      ctx.strokeStyle = d.stroke || '#999';
      switch (d.kind) {
        case 'rect':
          roundRect(-d.w / 2, -d.h / 2, d.w, d.h, 9);
          ctx.fill(); ctx.stroke();
          break;
        case 'circle':
          ctx.beginPath();
          ctx.arc(0, 0, d.r, 0, Math.PI * 2);
          ctx.fill(); ctx.stroke();
          ctx.fillStyle = 'rgba(255,255,255,0.45)';
          ctx.beginPath();
          ctx.arc(-d.r * 0.35, -d.r * 0.35, d.r * 0.22, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'tri':
          ctx.translate(0, -d.cy);
          ctx.beginPath();
          ctx.moveTo(0, -d.h / 2);
          ctx.lineTo(d.w / 2, d.h / 2);
          ctx.lineTo(-d.w / 2, d.h / 2);
          ctx.closePath();
          ctx.fill(); ctx.stroke();
          break;
        case 'star':
          starPath(d.r);
          ctx.fill(); ctx.stroke();
          break;
        case 'heart':
          ctx.translate(-d.cx, -d.cy);
          heartPath(d.scale);
          ctx.fill(); ctx.stroke();
          break;
        case 'img':
          ctx.drawImage(d.img, -d.w / 2, -d.h / 2, d.w, d.h);
          break;
      }
      ctx.restore();
    }
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function starPath(r) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const rad = i % 2 === 0 ? r : r * 0.42;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const x = Math.cos(a) * rad, y = Math.sin(a) * rad;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  function heartPath(s) {
    ctx.beginPath();
    ctx.moveTo(0, 34 * s);
    ctx.bezierCurveTo(-38 * s, 8 * s, -42 * s, -18 * s, -22 * s, -30 * s);
    ctx.bezierCurveTo(-8 * s, -38 * s, 0, -22 * s, 0, -14 * s);
    ctx.bezierCurveTo(0, -22 * s, 8 * s, -38 * s, 22 * s, -30 * s);
    ctx.bezierCurveTo(42 * s, -18 * s, 38 * s, 8 * s, 0, 34 * s);
    ctx.closePath();
  }

  /* ----- drawing pad ----- */
  function openDrawPad() {
    Sound.click();
    clearPad();
    drawModal.classList.remove('hidden');
  }

  function clearPad() {
    drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    drewSomething = false;
  }

  function padPoint(e) {
    const r = drawCanvas.getBoundingClientRect();
    return [
      ((e.clientX - r.left) / r.width) * drawCanvas.width,
      ((e.clientY - r.top) / r.height) * drawCanvas.height,
    ];
  }

  function strokePad() {
    drawCtx.strokeStyle = drawColor;
    drawCtx.lineWidth = 22;
    drawCtx.lineCap = 'round';
    drawCtx.lineJoin = 'round';
    drawCtx.stroke();
  }

  function finishDrawing() {
    if (!drewSomething) { drawModal.classList.add('hidden'); return; }
    const { width, height } = drawCanvas;
    const data = drawCtx.getImageData(0, 0, width, height).data;
    let minX = width, minY = height, maxX = 0, maxY = 0;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (data[(y * width + x) * 4 + 3] > 10) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX <= minX || maxY <= minY) { drawModal.classList.add('hidden'); return; }

    const pad = 6;
    minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad);
    maxX = Math.min(width, maxX + pad); maxY = Math.min(height, maxY + pad);
    const w = maxX - minX, h = maxY - minY;
    const scale = Math.min(1, 140 / Math.max(w, h));
    const out = document.createElement('canvas');
    out.width = Math.round(w * scale);
    out.height = Math.round(h * scale);
    out.getContext('2d').drawImage(drawCanvas, minX, minY, w, h, 0, 0, out.width, out.height);
    const dataUrl = out.toDataURL('image/png');

    const img = new Image();
    img.onload = () => {
      const make = (x, y) => imageBlock(x, y, img, out.width, out.height);
      addPaletteItem(null, () => spawn(make), dataUrl);
      spawn(make);
      throwConfetti(50);
    };
    img.src = dataUrl;
    Sound.fanfare();
    drawModal.classList.add('hidden');
  }

  return { init, start, stop };
})();
