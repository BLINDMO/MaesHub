# 🌈 Mae's Hub

A colorful, touch-friendly web app made for Mae (age 4): four games plus a
parent-controlled YouTube viewer. No build step, no dependencies — just open
`index.html` in any modern browser.

## Running it

```bash
# any static server works, e.g.:
python3 -m http.server 8000
# then open http://localhost:8000
```

Or host the folder on GitHub Pages / Netlify and open it on a tablet —
in Safari/Chrome use **Share → Add to Home Screen** so it launches
full-screen like a real app.

> The games work fully offline. The video section needs internet (it's
> YouTube), and the title font loads from Google Fonts with a friendly
> fallback if offline.

## What's inside

### 🧱 Block Builder (real physics!)
Powered by the Matter.js physics engine (vendored, works offline). Tap a
palette block and it drops from the sky, lands, and stacks — build a tower!
Drag blocks around with a finger and they stay physical. The **Draw!**
crayon button opens a drawing pad — whatever Mae draws becomes a real
physics block that drops in too. Drag blocks onto the trash can to remove
them.

### 🐔 Road Hopper
A structured lane-crossing course: hop from the **START** line at the
bottom to the checkered **FINISH** line at the top — the whole course fits
on one screen. Lanes alternate direction with evenly spaced cars, and each
finished crossing unlocks a slightly busier level. Pick a character
(chicken, bunny, duck or kitty); tap to hop forward, tap the screen edges
to sidestep.

### 🥚 Egg Surprise
Press Start: 25 colorful eggs pile up in the middle, the wolf trots in,
**dives into the pile**, and the eggs scatter all over the screen. Open
eggs to find all 24 baby chicks — without opening the wolf's egg!

### 🌸 Magic Garden
Two tools: seeds 🌱 and the water pail 🪣. Plant seeds in the grass, then
switch to the pail and water them — each plant grows on its own over 20
seconds (sprout → leaves → bud) until it blooms into a big, glowing,
swaying flower. Blooms attract butterflies to catch, and five flowers earn
a rainbow. No way to lose.

### 📺 Mae's Videos
A curated YouTube grid. Kids only see approved videos; playback uses the
privacy-enhanced `youtube-nocookie.com` embed with related videos limited to
the same channel.

Comes preloaded with PAW Patrol, Max & Ruby, Danny Go!, Bluey and Gabby's
Dollhouse episodes plus a few songs.

**Grown-Ups panel** (the 🔒 button, protected by a 4-digit parent
passcode — change it via `PASSCODE` at the top of `js/videos.js`):

- **Blocked words** — add words/phrases like `peppa pig`; any video whose
  title or channel matches is never shown in Mae's grid, even if someone
  adds it later.
- **Add videos** — paste any YouTube URL; the title and channel are fetched
  automatically.
- **Remove videos** — including the built-in starter ones.

Everything (video list, blocked words, high scores) is saved in the
browser's local storage on the device.

> ⚠️ Review the starter videos in the Grown-Ups panel on first run — if
> one ever shows a gray thumbnail or won't play (videos do get taken down),
> just remove it and paste a fresh link. Note that YouTube's player UI
> itself (end-screen suggestions from the same channel) can't be filtered
> by the blocklist, only the in-app grid can.

## Project layout

```
index.html        all screens & overlays
css/style.css     theme, layout, animations
js/app.js         screen navigation
js/audio.js       synthesized sound effects (no audio files)
js/confetti.js    celebration confetti
js/blocks.js      Block Builder
js/road.js        Road Hopper
js/eggs.js        Egg Surprise
js/garden.js      Magic Garden
js/videos.js      video grid, parent gate, blocklist
```
