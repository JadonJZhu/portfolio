// Interface sounds from four short files: a tick on hover, clicks, a blip per HUD chat line, a glitch.
// On by default; the speaker button mutes them, and the choice is remembered.
(() => {
  const btn = document.querySelector('.sound');
  let on = true;
  try { on = localStorage.getItem('sound') !== 'off'; } catch (e) { /* storage blocked: stay on */ }
  let ac = null; // made on the first click or key press, since browsers block audio before that

  // Each sound: its file, its volume, where the sound starts in the file (skipping silence at the
  // front) and a delay in seconds (the glitch waits for its 0.15 s animation delay).
  const sounds = {
    hover: ['ui-hover.mp3', 0.3, 0.02, 0],
    click: ['small-click.mp3', 0.18, 0.24, 0],
    lock: ['big-click.mp3', 0.2, 0, 0],
    blip: ['ui-hover.mp3', 0.15, 0.02, 0],
    glitch: ['glitch-effect.m4a', 0.1, 0.05, 0.15],
  };
  // Decoded at page load, so the first click has its sound ready; an offline context needs no click.
  const buffers = {};
  try {
    const decoder = new OfflineAudioContext(2, 1, 48000);
    new Set(Object.values(sounds).map((s) => s[0])).forEach((file) =>
      fetch(`assets/sounds/${file}`).then((r) => r.arrayBuffer()).then((b) => decoder.decodeAudioData(b))
        .then((buf) => { buffers[file] = buf; }, () => { /* that sound stays silent */ }));
  } catch (e) { /* no Web Audio: no sound */ }

  function play(name) {
    const [file, vol, offset, delay] = sounds[name];
    if (!on || !ac || !buffers[file]) return;
    const src = ac.createBufferSource(), g = ac.createGain();
    src.buffer = buffers[file];
    g.gain.value = vol;
    src.connect(g).connect(ac.destination);
    src.start(ac.currentTime + delay, offset);
  }
  window.sound = Object.fromEntries(Object.keys(sounds).map((k) => [k, () => play(k)]));

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
    play('hover');
  });
  document.addEventListener('click', (e) => {
    const el = target(e);
    if (!el) return;
    play(el.matches('.lock .next') ? 'lock' : 'click'); // the speaker button runs first, so turning sound on clicks and turning it off is silent
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
