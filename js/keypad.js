/* ============ Passcode keypad ============
 * Shared on-screen number pad for the grown-up gates — no system keyboard
 * needed, just tap the code. Shows four dots that fill as you type and
 * auto-submits on the fourth digit.
 */
const Keypad = (() => {
  function create(onComplete) {
    const el = document.createElement('div');
    el.className = 'keypad';

    const dots = document.createElement('div');
    dots.className = 'keypad-dots';
    const dotEls = [];
    for (let i = 0; i < 4; i++) {
      const d = document.createElement('span');
      d.className = 'keypad-dot';
      dots.appendChild(d);
      dotEls.push(d);
    }
    el.appendChild(dots);

    let value = '';
    const api = {
      el,
      reset() { value = ''; update(); },
      shake() {
        dots.classList.remove('shake');
        void dots.offsetWidth;
        dots.classList.add('shake');
      },
    };
    function update() {
      dotEls.forEach((d, i) => d.classList.toggle('filled', i < value.length));
    }

    const grid = document.createElement('div');
    grid.className = 'keypad-grid';
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].forEach((k) => {
      if (k === '') {
        grid.appendChild(document.createElement('span'));
        return;
      }
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'keypad-key' + (k === '⌫' ? ' keypad-back' : '');
      btn.textContent = k;
      btn.addEventListener('click', () => {
        Sound.click();
        if (k === '⌫') value = value.slice(0, -1);
        else if (value.length < 4) value += k;
        update();
        if (value.length === 4) onComplete(value, api);
      });
      grid.appendChild(btn);
    });
    el.appendChild(grid);
    return api;
  }

  return { create };
})();
