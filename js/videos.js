/* ============ Mae's Videos ============
 * A curated YouTube viewer. Kids only ever see the approved grid; videos
 * play in a privacy-enhanced (youtube-nocookie) embed with related videos
 * limited to the same channel.
 *
 * The Grown-Ups panel (behind a math gate a 4-year-old can't pass) lets a
 * parent add videos by URL, remove videos, and maintain a blocked-word
 * list — any video whose title or channel matches a blocked word (e.g.
 * "peppa pig") is never shown, even if it's still in the list.
 */
const Videos = (() => {
  const STORE_KEY = 'maeshub.videos.v1';

  // Starter videos — review & customize these in the Grown-Ups panel!
  const DEFAULT_VIDEOS = [
    { id: 'XqZsoesa55w', title: 'Baby Shark Dance', channel: 'Pinkfong' },
    { id: 'e_04ZrNroTo', title: 'Wheels on the Bus', channel: 'CoComelon' },
    { id: 'yCjJyiqpAuU', title: 'Twinkle Twinkle Little Star', channel: 'Super Simple Songs' },
    { id: '_6HzoUcx3eo', title: 'Old MacDonald Had A Farm', channel: 'Super Simple Songs' },
    { id: 'l4WNrvVjiTw', title: "If You're Happy", channel: 'Super Simple Songs' },
    { id: 'frN3nvhIHUk', title: 'Five Little Ducks', channel: 'Super Simple Songs' },
  ];

  let state = { custom: [], blocked: [], removedDefaults: [] };
  let gateAnswer = null;

  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) state = Object.assign(state, JSON.parse(raw));
    } catch (e) { /* fresh start beats a crash */ }
  }
  function save() { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }

  function allVideos() {
    return DEFAULT_VIDEOS.filter((v) => !state.removedDefaults.includes(v.id)).concat(state.custom);
  }

  function isBlocked(video) {
    const hay = (video.title + ' ' + video.channel).toLowerCase();
    return state.blocked.some((w) => hay.includes(w.toLowerCase()));
  }

  function visibleVideos() { return allVideos().filter((v) => !isBlocked(v)); }

  /* ----- kid-facing grid & player ----- */
  function renderGrid() {
    const grid = document.getElementById('video-grid');
    grid.innerHTML = '';
    const vids = visibleVideos();
    document.getElementById('videos-empty').classList.toggle('hidden', vids.length > 0);
    for (const v of vids) {
      const card = document.createElement('button');
      card.className = 'video-card';
      card.innerHTML = `
        <img src="https://i.ytimg.com/vi/${v.id}/hqdefault.jpg" alt="" loading="lazy">
        <span class="v-title"></span>
        <span class="v-channel"></span>`;
      card.querySelector('.v-title').textContent = v.title;
      card.querySelector('.v-channel').textContent = v.channel;
      card.addEventListener('click', () => play(v.id));
      grid.appendChild(card);
    }
  }

  function play(id) {
    Sound.click();
    const frame = document.getElementById('player-frame');
    frame.innerHTML = `<iframe
      src="https://www.youtube-nocookie.com/embed/${id}?rel=0&autoplay=1&playsinline=1"
      title="video player" allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe>`;
    document.getElementById('player-overlay').classList.remove('hidden');
  }

  function closePlayer() {
    document.getElementById('player-frame').innerHTML = '';
    document.getElementById('player-overlay').classList.add('hidden');
  }

  /* ----- grown-ups gate ----- */
  function openGate() {
    Sound.click();
    const a = 11 + Math.floor(Math.random() * 9);
    const b = 12 + Math.floor(Math.random() * 9);
    gateAnswer = a + b;
    document.getElementById('gate-question').textContent = `To prove you're a grown-up: what is ${a} + ${b}?`;
    document.getElementById('gate-input').value = '';
    document.getElementById('gate-modal').classList.remove('hidden');
    setTimeout(() => document.getElementById('gate-input').focus(), 100);
  }

  function tryGate() {
    if (Number(document.getElementById('gate-input').value) === gateAnswer) {
      document.getElementById('gate-modal').classList.add('hidden');
      openParentPanel();
    } else {
      Sound.bonk();
      openGate(); // new question on a wrong answer
    }
  }

  /* ----- parent panel ----- */
  function openParentPanel() {
    renderChips();
    renderParentList();
    document.getElementById('add-status').textContent = '';
    document.getElementById('parent-panel').classList.remove('hidden');
  }

  function renderChips() {
    const box = document.getElementById('block-chips');
    box.innerHTML = '';
    for (const word of state.blocked) {
      const chip = document.createElement('span');
      chip.className = 'chip';
      const label = document.createElement('span');
      label.textContent = word;
      const x = document.createElement('button');
      x.textContent = '✖️';
      x.setAttribute('aria-label', `unblock ${word}`);
      x.addEventListener('click', () => {
        state.blocked = state.blocked.filter((w) => w !== word);
        save();
        renderChips();
        renderParentList();
      });
      chip.append(label, x);
      box.appendChild(chip);
    }
  }

  function addBlockedWord() {
    const input = document.getElementById('block-input');
    const word = input.value.trim().toLowerCase();
    if (!word || state.blocked.includes(word)) return;
    state.blocked.push(word);
    input.value = '';
    save();
    renderChips();
    renderParentList();
  }

  function parseYouTubeId(url) {
    const m = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/)
      || url.match(/^([\w-]{11})$/);
    return m ? m[1] : null;
  }

  async function addVideo() {
    const input = document.getElementById('url-input');
    const status = document.getElementById('add-status');
    const id = parseYouTubeId(input.value.trim());
    if (!id) { status.textContent = "Hmm, that doesn't look like a YouTube link."; return; }
    if (allVideos().some((v) => v.id === id)) { status.textContent = 'That video is already in the list.'; return; }

    status.textContent = 'Fetching video info…';
    let title = '', channel = '';
    try {
      const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`);
      if (res.ok) {
        const data = await res.json();
        title = data.title || '';
        channel = data.author_name || '';
      }
    } catch (e) { /* offline or blocked — fall back to asking */ }
    if (!title) title = prompt('Could not fetch the title automatically. What should this video be called?') || 'My video';

    state.custom.push({ id, title, channel });
    // un-remove a default if the parent re-adds it
    state.removedDefaults = state.removedDefaults.filter((d) => d !== id);
    save();
    input.value = '';
    status.textContent = `Added “${title}” ✅`;
    renderParentList();
  }

  function removeVideo(id) {
    if (DEFAULT_VIDEOS.some((v) => v.id === id) && !state.removedDefaults.includes(id)) {
      state.removedDefaults.push(id);
    }
    state.custom = state.custom.filter((v) => v.id !== id);
    save();
    renderParentList();
  }

  function renderParentList() {
    const list = document.getElementById('parent-video-list');
    list.innerHTML = '';
    for (const v of allVideos()) {
      const row = document.createElement('div');
      row.className = 'parent-video-row';
      row.innerHTML = `
        <img src="https://i.ytimg.com/vi/${v.id}/default.jpg" alt="">
        <div class="pv-info">
          <div class="pv-title"></div>
          <div class="pv-channel"></div>
          ${isBlocked(v) ? '<div class="pv-blocked">hidden by a blocked word</div>' : ''}
        </div>`;
      row.querySelector('.pv-title').textContent = v.title;
      row.querySelector('.pv-channel').textContent = v.channel;
      const del = document.createElement('button');
      del.className = 'btn-pill btn-soft';
      del.textContent = 'Remove';
      del.addEventListener('click', () => removeVideo(v.id));
      row.appendChild(del);
      list.appendChild(row);
    }
  }

  /* ----- wiring ----- */
  function init() {
    load();
    document.getElementById('player-close').addEventListener('click', closePlayer);
    document.getElementById('videos-grownups-btn').addEventListener('click', openGate);
    document.getElementById('gate-go').addEventListener('click', tryGate);
    document.getElementById('gate-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') tryGate(); });
    document.getElementById('gate-cancel').addEventListener('click', () => document.getElementById('gate-modal').classList.add('hidden'));
    document.getElementById('block-add').addEventListener('click', addBlockedWord);
    document.getElementById('block-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') addBlockedWord(); });
    document.getElementById('video-add').addEventListener('click', addVideo);
    document.getElementById('parent-done').addEventListener('click', () => {
      Sound.click();
      document.getElementById('parent-panel').classList.add('hidden');
      renderGrid();
    });
  }

  function start() { renderGrid(); }
  function stop() { closePlayer(); }

  return { init, start, stop };
})();
