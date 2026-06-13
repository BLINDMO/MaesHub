/* ============ Mae's Hub — navigation ============ */
(() => {
  const modules = {
    'screen-blocks': Blocks,
    'screen-road': Road,
    'screen-eggs': Eggs,
    'screen-garden': Garden,
    'screen-bridge': Bridge,
    'screen-dressup': Dressup,
    'screen-camera': CameraStudio,
    'screen-videos': Videos,
    'screen-baby': Baby,
  };
  let current = 'screen-home';

  function show(id) {
    const old = modules[current];
    if (old && old.stop) old.stop();
    document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === id));
    current = id;
    const mod = modules[id];
    if (mod && mod.start) mod.start();
  }

  // navigation is silent — sounds are saved for the games themselves
  document.querySelectorAll('.menu-card[data-target]').forEach((card) => {
    card.addEventListener('click', () => show(card.dataset.target));
  });
  document.querySelectorAll('.btn-back').forEach((btn) => {
    btn.addEventListener('click', () => show('screen-home'));
  });

  // block iOS pinch-zoom so little fingers can't break the layout
  // (double-tap zoom is already disabled via touch-action: manipulation)
  document.addEventListener('gesturestart', (e) => e.preventDefault());

  Object.values(modules).forEach((m) => m.init && m.init());
  Night.init();
})();
