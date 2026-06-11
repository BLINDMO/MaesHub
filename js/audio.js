/* Tiny synthesized sound effects — no audio files needed. */
const Sound = (() => {
  let ctx = null;

  function ac() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur, { type = 'sine', vol = 0.25, slideTo = null, when = 0 } = {}) {
    try {
      const c = ac();
      const t0 = c.currentTime + when;
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
      gain.gain.setValueAtTime(vol, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      osc.connect(gain).connect(c.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.05);
    } catch (e) { /* audio is never worth crashing a game over */ }
  }

  return {
    click()   { tone(600, 0.08, { type: 'triangle', vol: 0.15 }); },
    pop()     { tone(300, 0.12, { type: 'square', vol: 0.12, slideTo: 700 }); },
    hop()     { tone(420, 0.1, { type: 'triangle', vol: 0.2, slideTo: 740 }); },
    chirp()   { tone(900, 0.09, { vol: 0.2, slideTo: 1400 }); tone(1100, 0.1, { vol: 0.18, slideTo: 1600, when: 0.1 }); },
    growl()   { tone(160, 0.5, { type: 'sawtooth', vol: 0.22, slideTo: 70 }); },
    splash()  { tone(500, 0.2, { type: 'triangle', vol: 0.14, slideTo: 200 }); },
    sparkle() { [1200, 1500, 1900].forEach((f, i) => tone(f, 0.12, { vol: 0.12, when: i * 0.06 })); },
    bonk()    { tone(220, 0.25, { type: 'square', vol: 0.2, slideTo: 110 }); },
    fanfare() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, { type: 'triangle', vol: 0.22, when: i * 0.13 })); },
    shutter() { tone(1900, 0.03, { type: 'square', vol: 0.2 }); tone(800, 0.05, { type: 'square', vol: 0.16, when: 0.06 }); },
  };
})();
