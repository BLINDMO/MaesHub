/* ============ Game 1: Block Builder ============
 * Tap a block in the palette to drop it into the build area, then drag it
 * around. The crayon button opens a drawing pad — whatever Mae draws gets
 * turned into a brand new block she can build with.
 */
const Blocks = (() => {
  const PREBUILT = [
    { name: 'square',   svg: shape(80, 80, '<rect x="3" y="3" width="74" height="74" rx="10" fill="#ff6b6b" stroke="#d24545" stroke-width="5"/>') },
    { name: 'plank',    svg: shape(150, 50, '<rect x="3" y="3" width="144" height="44" rx="10" fill="#4dabf7" stroke="#2b7fc4" stroke-width="5"/>') },
    { name: 'tall',     svg: shape(50, 130, '<rect x="3" y="3" width="44" height="124" rx="10" fill="#9775fa" stroke="#6d4fc4" stroke-width="5"/>') },
    { name: 'roof',     svg: shape(110, 70, '<polygon points="55,4 106,66 4,66" fill="#ffa94d" stroke="#d67f25" stroke-width="5" stroke-linejoin="round"/>') },
    { name: 'circle',   svg: shape(76, 76, '<circle cx="38" cy="38" r="34" fill="#69db7c" stroke="#3fa552" stroke-width="5"/>') },
    { name: 'arch',     svg: shape(110, 70, '<path d="M5 66 V40 A50 50 0 0 1 105 40 V66 H75 V45 A20 20 0 0 0 35 45 V66 Z" fill="#f783ac" stroke="#cc5587" stroke-width="5" stroke-linejoin="round"/>') },
    { name: 'star',     svg: shape(86, 84, '<polygon points="43,4 53,32 82,32 59,50 67,79 43,61 19,79 27,50 4,32 33,32" fill="#ffd43b" stroke="#dba512" stroke-width="4" stroke-linejoin="round"/>') },
    { name: 'heart',    svg: shape(86, 78, '<path d="M43 74 C8 48 2 26 14 13 C26 1 43 12 43 24 C43 12 60 1 72 13 C84 26 78 48 43 74 Z" fill="#ff8787" stroke="#d24f4f" stroke-width="4"/>') },
    { name: 'rainbow',  svg: shape(110, 60, '<path d="M8 56 A47 47 0 0 1 102 56" fill="none" stroke="#ff6b6b" stroke-width="9"/><path d="M19 56 A36 36 0 0 1 91 56" fill="none" stroke="#ffd43b" stroke-width="9"/><path d="M30 56 A25 25 0 0 1 80 56" fill="none" stroke="#69db7c" stroke-width="9"/><path d="M41 56 A14 14 0 0 1 69 56" fill="none" stroke="#4dabf7" stroke-width="9"/>') },
  ];
  const CRAYON_COLORS = ['#ff5fa2', '#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c', '#4dabf7', '#9775fa', '#5b3a70'];

  let buildArea, palette, trash, drawModal, drawCanvas, drawCtx;
  let drawColor = CRAYON_COLORS[0];
  let drawing = false;
  let drewSomething = false;
  let zCounter = 1;

  function shape(w, h, inner) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${inner}</svg>`;
  }

  function init() {
    buildArea = document.getElementById('build-area');
    palette = document.getElementById('palette');
    trash = document.getElementById('trash-zone');
    drawModal = document.getElementById('draw-modal');
    drawCanvas = document.getElementById('draw-canvas');
    drawCtx = drawCanvas.getContext('2d');

    for (const b of PREBUILT) addPaletteItem(b.svg, null);

    document.getElementById('blocks-clear').addEventListener('click', () => {
      Sound.pop();
      buildArea.querySelectorAll('.block').forEach((el) => el.remove());
    });

    // Drawing pad
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
      drawCtx.lineTo(...padPoint(e)); // dot on tap
      strokePad();
    });
    drawCanvas.addEventListener('pointermove', (e) => {
      if (!drawing) return;
      drawCtx.lineTo(...padPoint(e));
      strokePad();
    });
    drawCanvas.addEventListener('pointerup', () => { drawing = false; });
  }

  /* ----- palette & spawning ----- */
  function addPaletteItem(svgMarkup, imgDataUrl) {
    const item = document.createElement('button');
    item.className = 'palette-item';
    if (svgMarkup) item.innerHTML = svgMarkup;
    else {
      const img = document.createElement('img');
      img.src = imgDataUrl;
      item.appendChild(img);
    }
    item.addEventListener('click', () => {
      Sound.pop();
      spawnBlock(svgMarkup, imgDataUrl);
    });
    palette.appendChild(item);
    return item;
  }

  function spawnBlock(svgMarkup, imgDataUrl) {
    const block = document.createElement('div');
    block.className = 'block';
    if (svgMarkup) block.innerHTML = svgMarkup;
    else {
      const img = document.createElement('img');
      img.src = imgDataUrl;
      block.appendChild(img);
    }
    const r = buildArea.getBoundingClientRect();
    block.style.left = r.width * (0.35 + Math.random() * 0.3) + 'px';
    block.style.top = r.height * (0.3 + Math.random() * 0.3) + 'px';
    block.style.zIndex = ++zCounter;
    makeDraggable(block);
    buildArea.appendChild(block);
  }

  function makeDraggable(block) {
    let offX = 0, offY = 0;
    block.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      block.setPointerCapture(e.pointerId);
      block.classList.add('dragging');
      block.style.zIndex = ++zCounter;
      const r = block.getBoundingClientRect();
      offX = e.clientX - r.left;
      offY = e.clientY - r.top;
    });
    block.addEventListener('pointermove', (e) => {
      if (!block.classList.contains('dragging')) return;
      const area = buildArea.getBoundingClientRect();
      block.style.left = e.clientX - area.left - offX + 'px';
      block.style.top = e.clientY - area.top - offY + 'px';
      trash.classList.toggle('hot', overTrash(e));
    });
    block.addEventListener('pointerup', (e) => {
      block.classList.remove('dragging');
      if (overTrash(e)) {
        Sound.splash();
        block.remove();
      }
      trash.classList.remove('hot');
    });
  }

  function overTrash(e) {
    const t = trash.getBoundingClientRect();
    return e.clientX > t.left - 12 && e.clientX < t.right + 12 &&
           e.clientY > t.top - 12 && e.clientY < t.bottom + 12;
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
    // Crop to what was actually drawn so the block isn't mostly empty space.
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
    const scale = Math.min(1, 150 / Math.max(w, h));
    const out = document.createElement('canvas');
    out.width = Math.round(w * scale);
    out.height = Math.round(h * scale);
    out.getContext('2d').drawImage(drawCanvas, minX, minY, w, h, 0, 0, out.width, out.height);
    const dataUrl = out.toDataURL('image/png');

    addPaletteItem(null, dataUrl);
    spawnBlock(null, dataUrl);
    Sound.fanfare();
    throwConfetti(50);
    drawModal.classList.add('hidden');
  }

  return { init };
})();
