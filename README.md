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

### 🐶 Road Hopper
Classic frogger-style course: START line, **10 lanes of traffic, a flowery
rest meadow, 10 more lanes**, then the checkered FINISH line — never
infinite. Play as one of five hand-drawn cartoon pups (blue heeler, police
pup, fire pup and friends). Tap to hop forward, tap the screen edges to
sidestep; each crossing unlocks a slightly busier level.

### 🥚 Egg Surprise
Press Start: 25 colorful eggs pile up in the middle, a proper four-legged
SVG wolf trots in (friendly, not scary), **leaps and dives into the pile**
with a dust-puff landing, and the eggs scatter everywhere. Find all 24
baby chicks without opening the wolf's egg!

### 🌸 Magic Garden
Tap the grass to plant seeds, then **pick up the watering can and carry it
to a plant**. Watering starts a 20-second magic grow with a little progress
bar — sprout, leaves, bud — until it blooms into a big glowing flower.
Blooms attract butterflies; five flowers earn a rainbow. No way to lose.

### 👗 Dress-Up Studio
A princess mannequin with a real boutique: **40 hairstyles, 32 dresses,
32 pairs of shoes and 34 accessories** (all original SVG art). With
nothing selected she wears her plain onesie. Surprise-shuffle button,
multi-select accessories, and the outfit is saved on the device.

### 📸 Camera Studio
Take photos with the device camera (front or back), then decorate them:
chunky crayon drawing in 9 colors plus 16 stamp stickers. Save downloads
the masterpiece as a PNG. If the camera isn't allowed, a pastel canvas
appears so drawing still works.

### 🌙 Nighttime Countdown
Parent-locked bedtime timer (passcode-protected tile). A parent picks the
playtime (5–60 min); a small persistent countdown sits at the top while
Mae plays anything. At 5 minutes a popup warns her, at 60 seconds the
timer blinks and the screen slowly fades to black, and at zero the sleepy
goodnight pup takes over. The lock survives app reloads and only opens
after **10 quick taps + the passcode**.

### 📺 Mae's Videos
A curated YouTube grid. Kids only see approved videos; playback uses the
privacy-enhanced `youtube-nocookie.com` embed with related videos limited to
the same channel.

Comes preloaded with PAW Patrol, Max & Ruby, Danny Go!, Bluey and Gabby's
Dollhouse episodes plus a few songs. The grid is arranged like a streaming
home screen: **Mae's Favorites** (tap the heart on any card), **Today's
Picks** (rotates daily so it feels fresh), and More Videos. While a video
plays, a big red ✖ button skips to the next one.

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
