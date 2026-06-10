/* Full-screen confetti burst used by every game's "you did it!" moment. */
function throwConfetti(count = 120) {
  let canvas = document.getElementById('confetti-canvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'confetti-canvas';
    document.body.appendChild(canvas);
  }
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  const g = canvas.getContext('2d');
  const colors = ['#ff5fa2', '#ffd54f', '#4dd0e1', '#81c784', '#b388ff', '#ffab66'];
  const bits = [];
  for (let i = 0; i < count; i++) {
    bits.push({
      x: innerWidth / 2 + (Math.random() - 0.5) * innerWidth * 0.5,
      y: innerHeight * 0.35,
      vx: (Math.random() - 0.5) * 700,
      vy: -Math.random() * 650 - 150,
      w: 6 + Math.random() * 8,
      h: 8 + Math.random() * 10,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 12,
      color: colors[i % colors.length],
    });
  }
  let last = performance.now();
  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.04);
    last = now;
    g.clearRect(0, 0, canvas.width, canvas.height);
    let alive = 0;
    for (const b of bits) {
      b.vy += 1400 * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.rot += b.vr * dt;
      if (b.y < canvas.height + 30) {
        alive++;
        g.save();
        g.translate(b.x, b.y);
        g.rotate(b.rot);
        g.fillStyle = b.color;
        g.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
        g.restore();
      }
    }
    if (alive > 0) requestAnimationFrame(frame);
    else g.clearRect(0, 0, canvas.width, canvas.height);
  }
  requestAnimationFrame(frame);
}
