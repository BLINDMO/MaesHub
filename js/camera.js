/* ============ Camera Studio ============
 * Take a photo of your favorite things, then decorate it: draw on it with
 * chunky crayons and stamp stickers all over it. If the camera isn't
 * allowed, a pastel canvas appears so drawing and stickers still work.
 */
const CameraStudio = (() => {
  const COLORS = ['#ff5fa2', '#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c', '#4dabf7', '#9775fa', '#ffffff', '#3a3340'];
  const STICKERS = ['💖', '⭐', '🌈', '🦋', '👑', '🌸', '🐶', '🐱', '🦄', '🍦', '🎀', '✨', '🐰', '🌟', '🍓', '🐥'];
  const GALLERY_KEY = 'maeshub.photos.v1';
  const GALLERY_MAX = 12;

  /* ----- the shared photo gallery (Dress-Up saves here too) ----- */
  function loadGallery() {
    try { return JSON.parse(localStorage.getItem(GALLERY_KEY)) || []; }
    catch (e) { return []; }
  }
  function persistGallery(list) {
    // photos are big; if storage is full, drop the oldest until it fits
    while (true) {
      try { localStorage.setItem(GALLERY_KEY, JSON.stringify(list)); return; }
      catch (e) { if (!list.length) return; list.pop(); }
    }
  }
  function addPhoto(dataUrl) {
    const list = loadGallery();
    list.unshift(dataUrl);
    if (list.length > GALLERY_MAX) list.length = GALLERY_MAX;
    persistGallery(list);
  }
  function removePhoto(index) {
    const list = loadGallery();
    list.splice(index, 1);
    persistGallery(list);
  }

  let video, canvas, ctx, message;
  let stream = null;
  let facing = 'user';
  let mode = 'preview';        // preview | edit
  let tool = { type: 'draw', value: COLORS[0] };
  let drawing = false;

  function init() {
    video = document.getElementById('camera-video');
    canvas = document.getElementById('camera-canvas');
    ctx = canvas.getContext('2d');
    message = document.getElementById('camera-message');

    document.getElementById('camera-snap').addEventListener('click', snap);
    document.getElementById('camera-flip').addEventListener('click', () => {
      Sound.click();
      facing = facing === 'user' ? 'environment' : 'user';
      openCamera();
    });
    document.getElementById('camera-retake').addEventListener('click', () => {
      Sound.click();
      setMode('preview');
      openCamera();
    });
    document.getElementById('camera-save').addEventListener('click', savePhoto);
    document.getElementById('camera-gallery-btn').addEventListener('click', openGallery);
    document.getElementById('gallery-close').addEventListener('click', () => {
      Sound.click();
      document.getElementById('gallery-overlay').classList.add('hidden');
    });
    document.getElementById('photo-view-close').addEventListener('click', () => {
      Sound.click();
      document.getElementById('photo-view').classList.add('hidden');
    });
    document.getElementById('photo-view-delete').addEventListener('click', () => {
      Sound.splash();
      removePhoto(Number(document.getElementById('photo-view').dataset.index));
      document.getElementById('photo-view').classList.add('hidden');
      renderGallery();
    });

    const colorRow = document.getElementById('camera-colors');
    COLORS.forEach((c, i) => {
      const dot = document.createElement('button');
      dot.className = 'color-dot' + (i === 0 ? ' selected' : '');
      dot.style.background = c;
      dot.setAttribute('aria-label', 'color');
      dot.addEventListener('click', () => {
        Sound.click();
        tool = { type: 'draw', value: c };
        select(dot);
      });
      colorRow.appendChild(dot);
    });
    const stickerRow = document.getElementById('camera-stickers');
    STICKERS.forEach((s) => {
      const btn = document.createElement('button');
      btn.className = 'sticker-btn';
      btn.textContent = s;
      btn.addEventListener('click', () => {
        Sound.click();
        tool = { type: 'sticker', value: s };
        select(btn);
      });
      stickerRow.appendChild(btn);
    });

    canvas.addEventListener('pointerdown', (e) => {
      if (mode !== 'edit') return;
      const [x, y] = point(e);
      if (tool.type === 'sticker') {
        Sound.pop();
        ctx.font = `${canvas.width * 0.12}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(tool.value, x, y);
      } else {
        drawing = true;
        canvas.setPointerCapture(e.pointerId);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y);
        stroke();
      }
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!drawing) return;
      ctx.lineTo(...point(e));
      stroke();
    });
    canvas.addEventListener('pointerup', () => { drawing = false; });
  }

  function select(el) {
    document.querySelectorAll('#camera-colors .color-dot, .sticker-btn')
      .forEach((b) => b.classList.toggle('selected', b === el));
  }

  function point(e) {
    const r = canvas.getBoundingClientRect();
    return [
      ((e.clientX - r.left) / r.width) * canvas.width,
      ((e.clientY - r.top) / r.height) * canvas.height,
    ];
  }

  function stroke() {
    ctx.strokeStyle = tool.value;
    ctx.lineWidth = canvas.width * 0.018;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }

  function setMode(m) {
    mode = m;
    const edit = m === 'edit';
    video.classList.toggle('hidden', edit);
    canvas.classList.toggle('hidden', !edit);
    document.getElementById('camera-snap').classList.toggle('hidden', edit);
    document.getElementById('camera-flip').classList.toggle('hidden', edit);
    document.getElementById('camera-retake').classList.toggle('hidden', !edit);
    document.getElementById('camera-save').classList.toggle('hidden', !edit);
    document.getElementById('camera-toolbar').classList.toggle('hidden', !edit);
  }

  async function openCamera() {
    closeCamera();
    message.classList.add('hidden');
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing }, audio: false,
      });
      video.srcObject = stream;
      video.classList.toggle('mirror', facing === 'user');
    } catch (err) {
      message.textContent = '📷 No camera here — but you can still draw! Tap the big button!';
      message.classList.remove('hidden');
    }
  }

  function closeCamera() {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      stream = null;
      video.srcObject = null;
    }
  }

  function snap() {
    Sound.pop();
    const stage = document.getElementById('camera-stage');
    if (stream && video.videoWidth) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.save();
      if (facing === 'user') { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
      ctx.drawImage(video, 0, 0);
      ctx.restore();
    } else {
      // no camera: a pretty pastel page to decorate instead
      canvas.width = stage.clientWidth * 2;
      canvas.height = stage.clientHeight * 2;
      const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
      g.addColorStop(0, '#ffe3f1');
      g.addColorStop(1, '#e3f0ff');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    closeCamera();
    setMode('edit');
    throwConfetti(40);
  }

  function savePhoto() {
    Sound.fanfare();
    // downscale to keep the gallery light on storage
    const maxW = 800;
    const scale = Math.min(1, maxW / (canvas.width || maxW));
    const out = document.createElement('canvas');
    out.width = Math.max(1, Math.round(canvas.width * scale));
    out.height = Math.max(1, Math.round(canvas.height * scale));
    out.getContext('2d').drawImage(canvas, 0, 0, out.width, out.height);
    addPhoto(out.toDataURL('image/jpeg', 0.75));
    throwConfetti(80);
    const btn = document.getElementById('camera-save');
    btn.textContent = 'Saved! ✅';
    setTimeout(() => { btn.textContent = 'Save 💾'; }, 1500);
  }

  /* ----- gallery UI ----- */
  function openGallery() {
    Sound.click();
    renderGallery();
    document.getElementById('gallery-overlay').classList.remove('hidden');
  }

  function renderGallery() {
    const grid = document.getElementById('gallery-grid');
    grid.innerHTML = '';
    const list = loadGallery();
    document.getElementById('gallery-empty').classList.toggle('hidden', list.length > 0);
    list.forEach((src, i) => {
      const btn = document.createElement('button');
      btn.className = 'gallery-thumb';
      const img = document.createElement('img');
      img.src = src;
      btn.appendChild(img);
      btn.addEventListener('click', () => viewPhoto(i));
      grid.appendChild(btn);
    });
  }

  function viewPhoto(index) {
    Sound.pop();
    const list = loadGallery();
    if (!list[index]) return;
    document.getElementById('photo-view-img').src = list[index];
    document.getElementById('photo-view').dataset.index = index;
    document.getElementById('photo-view').classList.remove('hidden');
  }

  function start() {
    setMode('preview');
    openCamera();
  }

  function stop() {
    closeCamera();
    document.getElementById('gallery-overlay').classList.add('hidden');
    document.getElementById('photo-view').classList.add('hidden');
  }

  return { init, start, stop, addPhoto, openGallery };
})();
