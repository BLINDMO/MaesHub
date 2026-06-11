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
    // PAW Patrol
    { id: 'hc4hH7JMV_g', title: 'Pups and the Pirate Treasure 🏴‍☠️ Full Episode', channel: 'PAW Patrol Official & Friends' },
    { id: 'w7G8cpBtFvQ', title: 'PAW Patrol Pups Meet a Baby Space Alien 👽 Full Episode', channel: 'Nick Jr.' },
    { id: 'z1vXJVI2L5M', title: 'PAW Patrol Pups Save the Penguins 🐧 Full Episode', channel: 'Nick Jr.' },
    { id: 'QqriVPsFnSo', title: 'Charger Joins the Rescue! PAW Patrol Compilation', channel: 'PAW Patrol Official & Friends' },
    // Max & Ruby
    { id: 'zM1HoTBzQDs', title: "Max and Ruby's Pirate Adventure — Full Episode", channel: 'Max & Ruby' },
    { id: 'tHs3Dgufy2A', title: "Max the Champion / Ruby's Restaurant — Full Episode", channel: 'Max & Ruby' },
    { id: 'pN0rSNkSUUI', title: "Max & Ruby's Museum Adventure — Full Episode", channel: 'Max & Ruby' },
    { id: 'Q8vIdUehDvw', title: 'Max & Ruby — Episode 79 Full Episode', channel: 'Treehouse Direct' },
    // Danny Go!
    { id: '21XegpLrRjM', title: '"I Got That Rhythm!" Dance Song 🦊', channel: 'Danny Go!' },
    { id: 'elk5PpYyF-M', title: '"Brand New Day!" ☀️ Wake Up Dance', channel: 'Danny Go!' },
    { id: 'DsUPVERZFlI', title: '"The Wiggle Dance!" 🪱 Brain Break', channel: 'Danny Go!' },
    { id: 'u-A3nCIvUGs', title: '"Bouncing Time!" Dance Song 🐰', channel: 'Danny Go!' },
    // Bluey
    { id: 'fWBJTdq_pdU', title: 'Cubby — Bluey Full Episode', channel: 'Disney Jr.' },
    { id: 'cc9oLWrzQTc', title: 'Butterflies — Bluey Full Episode', channel: 'Disney Jr.' },
    { id: 'MnzN6224I60', title: 'Bluey — Best of Season 1 Collection 🌟', channel: 'Bluey' },
    // Gabby's Dollhouse
    { id: 'HxkAWxAn76M', title: 'Gabby Takes Care of the Baby Kitties 🐱 Full Episode', channel: "Gabby's Dollhouse" },
    { id: '8E4H1-_oMIs', title: 'Gabby Becomes a Fairy ✨ Full Episode', channel: "Gabby's Dollhouse" },
    { id: 'A0lRuY3PA4s', title: 'Kitty Bear Tea Party 🎉 Full Episode', channel: "Gabby's Dollhouse" },
    // Songs
    { id: 'XqZsoesa55w', title: 'Baby Shark Dance', channel: 'Pinkfong' },
    { id: 'e_04ZrNroTo', title: 'Wheels on the Bus', channel: 'CoComelon' },
    { id: 'yCjJyiqpAuU', title: 'Twinkle Twinkle Little Star', channel: 'Super Simple Songs' },
  ];

  let state = { custom: [], blocked: [], removedDefaults: [], favorites: [] };
  const PASSCODE = '0617';
  let playlist = [];   // current visible order, used by the Next button
  let nowPlaying = null;

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
  function isFav(id) { return state.favorites.includes(id); }

  function toggleFav(id) {
    if (isFav(id)) state.favorites = state.favorites.filter((f) => f !== id);
    else state.favorites.push(id);
    save();
    renderGrid();
  }

  // deterministic per-day shuffle so "Today's Picks" feels fresh each morning
  function todaysPicks(vids, n) {
    const day = Math.floor(Date.now() / 86400000);
    const rand = (i) => {
      const s = Math.sin((day + 1) * 9301 + i * 49297) * 233280;
      return s - Math.floor(s);
    };
    return vids
      .map((v, i) => ({ v, k: rand(i) }))
      .sort((a, b) => a.k - b.k)
      .slice(0, n)
      .map((x) => x.v);
  }

  function makeCard(v) {
    const card = document.createElement('div');
    card.className = 'video-card';
    card.innerHTML = `
      <img src="https://i.ytimg.com/vi/${v.id}/hqdefault.jpg" alt="" loading="lazy">
      ${isFav(v.id) ? '<span class="fav-badge">💖</span>' : ''}
      <span class="v-title"></span>
      <span class="v-channel"></span>`;
    card.querySelector('.v-title').textContent = v.title;
    card.querySelector('.v-channel').textContent = v.channel;

    // tap plays; press-and-hold opens the manage menu
    let pressTimer = null;
    card.addEventListener('pointerdown', () => {
      pressTimer = setTimeout(() => {
        pressTimer = null;
        suppressClick = true;
        openVideoMenu(v);
      }, 550);
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) =>
      card.addEventListener(ev, () => clearTimeout(pressTimer)));
    card.addEventListener('click', () => {
      if (suppressClick) { suppressClick = false; return; }
      play(v.id);
    });
    return card;
  }

  /* ----- press-and-hold video menu ----- */
  let suppressClick = false;
  let menuVideo = null;

  function openVideoMenu(v) {
    menuVideo = v;
    document.getElementById('video-menu-title').textContent = v.title;
    document.getElementById('vm-fav').textContent = isFav(v.id) ? '💔 Un-favorite' : '💖 Favorite';
    document.getElementById('vm-block').textContent = `⛔ Block all “${v.channel}”`;
    document.getElementById('video-menu').classList.remove('hidden');
  }

  function closeVideoMenu() {
    document.getElementById('video-menu').classList.add('hidden');
  }

  function renderGrid() {
    const grid = document.getElementById('video-grid');
    grid.innerHTML = '';
    const vids = visibleVideos();
    document.getElementById('videos-empty').classList.toggle('hidden', vids.length > 0);

    const favs = vids.filter((v) => isFav(v.id));
    const rest = vids.filter((v) => !isFav(v.id));
    const picks = todaysPicks(rest, 6);

    const section = (title, list) => {
      if (!list.length) return;
      const h = document.createElement('h3');
      h.className = 'section-title';
      h.textContent = title;
      grid.appendChild(h);
      list.forEach((v) => grid.appendChild(makeCard(v)));
    };
    const others = rest.filter((v) => !picks.includes(v));
    section('💖 Mae’s Favorites', favs);
    section('✨ Today’s Picks', picks);
    section('🎬 More Videos', others);

    // the order she sees is the order the Next button walks through
    playlist = favs.concat(picks, others).map((v) => v.id);
  }

  /* Playback uses the YouTube IFrame API when it loads (so we can detect
   * "video ended" and auto-play the next one), with a plain embed as a
   * fallback. Standard youtube.com host: if the browser is signed in to
   * YouTube (e.g. a Premium account), the embeds can use that session. */
  let ytPlayer = null;

  function loadYTApi() {
    if (window.YT || document.getElementById('yt-api')) return;
    const tag = document.createElement('script');
    tag.id = 'yt-api';
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  }

  function play(id) {
    nowPlaying = id;
    document.getElementById('player-fav').textContent = isFav(id) ? '💖' : '🤍';
    document.getElementById('player-overlay').classList.remove('hidden');
    const frame = document.getElementById('player-frame');
    if (window.YT && window.YT.Player) {
      if (ytPlayer) {
        ytPlayer.loadVideoById(id);
        return;
      }
      frame.innerHTML = '<div id="yt-player"></div>';
      ytPlayer = new YT.Player('yt-player', {
        videoId: id,
        playerVars: { autoplay: 1, rel: 0, playsinline: 1 },
        events: {
          onStateChange: (e) => {
            if (e.data === YT.PlayerState.ENDED) playNext();
          },
        },
      });
    } else {
      frame.innerHTML = `<iframe
        src="https://www.youtube.com/embed/${id}?rel=0&autoplay=1&playsinline=1"
        title="video player" allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe>`;
    }
  }

  function playNext() {
    if (!playlist.length) return closePlayer();
    Sound.pop();
    const idx = playlist.indexOf(nowPlaying);
    play(playlist[(idx + 1) % playlist.length]);
  }

  function closePlayer() {
    if (ytPlayer) {
      try { ytPlayer.destroy(); } catch (e) { /* already gone */ }
      ytPlayer = null;
    }
    document.getElementById('player-frame').innerHTML = '';
    document.getElementById('player-overlay').classList.add('hidden');
  }

  /* ----- grown-ups gate ----- */
  let gatePad = null;

  function openGate() {
    if (gatePad) gatePad.reset();
    document.getElementById('gate-modal').classList.remove('hidden');
  }

  function onGateCode(code, pad) {
    if (code === PASSCODE) {
      pad.reset();
      document.getElementById('gate-modal').classList.add('hidden');
      openParentPanel();
    } else {
      Sound.bonk();
      pad.shake();
      pad.reset();
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
    loadYTApi();
    document.getElementById('player-close').addEventListener('click', closePlayer);
    document.getElementById('player-next').addEventListener('click', playNext);
    document.getElementById('player-fav').addEventListener('click', () => {
      Sound.sparkle();
      toggleFav(nowPlaying); // re-renders the grid behind the player
      document.getElementById('player-fav').textContent = isFav(nowPlaying) ? '💖' : '🤍';
    });

    // press-and-hold menu actions
    document.getElementById('vm-play').addEventListener('click', () => {
      closeVideoMenu();
      play(menuVideo.id);
    });
    document.getElementById('vm-fav').addEventListener('click', () => {
      Sound.sparkle();
      toggleFav(menuVideo.id);
      closeVideoMenu();
    });
    document.getElementById('vm-remove').addEventListener('click', () => {
      removeVideo(menuVideo.id);
      renderGrid();
      closeVideoMenu();
    });
    document.getElementById('vm-block').addEventListener('click', () => {
      const word = menuVideo.channel.toLowerCase();
      if (!state.blocked.includes(word)) state.blocked.push(word);
      save();
      renderGrid();
      closeVideoMenu();
    });
    document.getElementById('vm-cancel').addEventListener('click', closeVideoMenu);
    document.getElementById('videos-grownups-btn').addEventListener('click', openGate);
    gatePad = Keypad.create(onGateCode);
    document.getElementById('gate-pad').appendChild(gatePad.el);
    document.getElementById('gate-cancel').addEventListener('click', () => document.getElementById('gate-modal').classList.add('hidden'));
    document.getElementById('block-add').addEventListener('click', addBlockedWord);
    document.getElementById('block-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') addBlockedWord(); });
    document.getElementById('video-add').addEventListener('click', addVideo);
    document.getElementById('parent-done').addEventListener('click', () => {
      document.getElementById('parent-panel').classList.add('hidden');
      renderGrid();
    });
  }

  function start() { renderGrid(); }
  function stop() { closePlayer(); }

  return { init, start, stop };
})();
