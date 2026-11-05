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
  // Holographic panel sounds: high, glassy pings that sweep in pitch, kept very short.
  const play = {
    hover: () => tone(2400, 3200, 0.018, 0.02, 'sine'),
    click: () => { tone(1800, 2600, 0.025, 0.02, 'square'); tone(3200, 3200, 0.06, 0.03, 'sine', 0.01); },
    next: () => { tone(1200, 2400, 0.04, 0.05, 'sine'); tone(2400, 3600, 0.07, 0.045, 'sine', 0.045); },
    back: () => { tone(2400, 1200, 0.04, 0.05, 'sine'); tone(1800, 900, 0.07, 0.045, 'sine', 0.045); },
    // A rising charge, then a chord that shimmers as each note drifts slightly sharp.
    lock: () => { tone(300, 2400, 0.18, 0.05); [1568, 2093, 2637].forEach((f, i) => tone(f, f * 1.003, 0.6, 0.03, 'sine', 0.17 + i * 0.03)); },
    blip: () => { tone(2600, 2600, 0.03, 0.02, 'sine'); tone(3400, 3400, 0.03, 0.02, 'sine', 0.045); }, // a two-pip readout
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
