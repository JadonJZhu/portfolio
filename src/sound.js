// Interface sounds, made in code: a tick on hover, tones on clicks, a blip per HUD chat line.
// On by default; the speaker button mutes them, and the choice is remembered.
(() => {
  const btn = document.querySelector('.sound');
  let on = true;
  try { on = localStorage.getItem('sound') !== 'off'; } catch (e) { /* storage blocked: stay on */ }
  let ac = null; // made on the first click or key press, since browsers block audio before that

  // One note: the pitch glides from f0 to f1 while the volume decays over `dur` seconds.
  function tone(f0, f1, dur, vol, type = 'triangle', delay = 0) {
    if (!on || !ac) return;
    const t = ac.currentTime + delay, o = ac.createOscillator(), g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(ac.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  }
  const play = {
    hover: () => tone(1800, 1600, 0.03, 0.025, 'sine'),
    click: () => tone(1100, 900, 0.05, 0.05),
    next: () => { tone(660, 660, 0.06, 0.06); tone(990, 990, 0.09, 0.06, 'triangle', 0.05); },
    back: () => { tone(660, 660, 0.06, 0.05); tone(440, 440, 0.09, 0.05, 'triangle', 0.05); },
    lock: () => { tone(160, 50, 0.25, 0.12, 'sine'); [523, 659, 784].forEach((f) => tone(f, f, 0.45, 0.04, 'triangle', 0.03)); },
    blip: () => tone(1250, 1500, 0.06, 0.03, 'sine'),
  };
  window.sound = play;

  const wake = () => {
    if (!ac) { try { ac = new AudioContext(); } catch (e) { return; } }
    if (ac.state === 'suspended') ac.resume();
  };
  addEventListener('pointerdown', wake, true);
  addEventListener('keydown', wake, true);

  const target = (e) => e.target.closest && e.target.closest('a[href], button');
  let lastHover = 0;
  document.addEventListener('pointerover', (e) => {
    const el = target(e);
    if (e.pointerType !== 'mouse' || !el || el.contains(e.relatedTarget) || performance.now() - lastHover < 100) return;
    lastHover = performance.now();
    play.hover();
  });
  document.addEventListener('click', (e) => {
    const el = target(e);
    if (!el) return;
    if (el.matches('.lock .next')) play.lock();
    else if (el.matches('.next, .page-next')) play.next();
    else if (el.matches('.back')) play.back();
    else play.click(); // the speaker button runs first, so turning sound on clicks and turning it off is silent
  });

  if (!btn) return;
  btn.hidden = false;
  btn.setAttribute('aria-pressed', on);
  btn.addEventListener('click', () => {
    on = !on;
    btn.setAttribute('aria-pressed', on);
    try { localStorage.setItem('sound', on ? 'on' : 'off'); } catch (e) { /* not remembered */ }
  });
})();
