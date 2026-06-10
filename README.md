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

### 🧱 Block Builder
Tap blocks in the bottom palette to drop them into the play area, then drag
them to build. The **Draw!** crayon button opens a drawing pad — whatever Mae
draws is automatically cropped and turned into a brand-new block in her
palette that she can use to build. Drag blocks onto the trash can to remove
them.

### 🐔 Road Hopper
A gentle Crossy-Road-style game. Pick a character (chicken, bunny, duck or
kitty), then tap to hop forward across the traffic; tap the left/right edges
of the screen to sidestep. Arrow keys work too. Forgiving hitboxes, slow
starter cars, and a best-score counter.

### 🥚 Egg Surprise
Press Start and a sneaky wolf hides in one of ten eggs scattered around the
screen. Open eggs to find the baby chicks — find all nine chicks **without**
opening the wolf's egg to win confetti!

### 🌸 Magic Garden
A no-fail sandbox: tap the grass to plant magic seeds, tap a plant to water
it and watch it grow into a surprise flower. Flowers attract butterflies,
bees and ladybugs to catch for sparkles, and growing six flowers earns a
rainbow celebration.

### 📺 Mae's Videos
A curated YouTube grid. Kids only see approved videos; playback uses the
privacy-enhanced `youtube-nocookie.com` embed with related videos limited to
the same channel.

**Grown-Ups panel** (the 🔒 button, protected by a math question a
four-year-old can't answer):

- **Blocked words** — add words/phrases like `peppa pig`; any video whose
  title or channel matches is never shown in Mae's grid, even if someone
  adds it later.
- **Add videos** — paste any YouTube URL; the title and channel are fetched
  automatically.
- **Remove videos** — including the built-in starter ones.

Everything (video list, blocked words, high scores) is saved in the
browser's local storage on the device.

> ⚠️ The starter video list contains a few well-known kids' songs as
> placeholders. Please review them in the Grown-Ups panel on first run and
> swap in your own favorites — and note that YouTube's player UI itself
> (end-screen suggestions from the same channel) can't be filtered by the
> blocklist, only the in-app grid can.

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
