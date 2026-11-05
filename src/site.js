// Upgrades the plain page to the match: a camera flying the map, with full scenes laid over it.
// Without this script, with reduced motion, or if a screen does not fit, the page stays plain.
(() => {
  const MAP = window.SITE_MAP;
  const root = document.documentElement;
  const svgNS = 'http://www.w3.org/2000/svg';
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
  const stage = $('.stage');
  const sections = $$('main > section');
  const ids = sections.map((s) => s.id);
  const TL = ids.indexOf('timeline'), POS = ids.indexOf('position');
  const timeline = sections[TL];
  const cards = $$('.card', timeline);
  const stopOf = (id) => MAP.stops.find((s) => s.id === id);
  const dated = cards.map((c) => stopOf(c.id)); // the ten timeline stops, oldest first, with `when`
  const dialog = $('.map-dialog');
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const MAX_TILT = 54; // degrees
  const WALL = 3.2; // wall height in grid units
  const FACE = 8; // wall faces are laid out at this many px per unit, so they rasterise sharply

  // Route geometry. `d` is distance along the route in grid units.
  const lengths = [0];
  MAP.points.forEach((p, i) => {
    if (i) lengths.push(lengths[i - 1] + Math.hypot(p[0] - MAP.points[i - 1][0], p[1] - MAP.points[i - 1][1]));
  });
  function pointAt(d) {
    let i = 1;
    while (i < lengths.length - 1 && lengths[i] < d) i++;
    const t = clamp((d - lengths[i - 1]) / (lengths[i] - lengths[i - 1]), 0, 1);
    const [ax, ay] = MAP.points[i - 1], [bx, by] = MAP.points[i];
    return { x: ax + (bx - ax) * t, y: ay + (by - ay) * t, i };
  }
  const line = (points) => points.map((p) => p.join(',')).join(' ');
  const walkedTo = (d) => { const p = pointAt(d); return line([...MAP.points.slice(0, p.i), [p.x, p.y]]); };
  const rooms = MAP.rooms.map((r) => `<path class="room ${r.kind}" d="${r.path}"/>`).join('');
  // The date at a place on the timeline corridor, for the year readout.
  function whenAt(d) {
    let k = 1;
    while (k < dated.length - 1 && dated[k].d < d) k++;
    const a = dated[k - 1], b = dated[k];
    return a.when + (b.when - a.when) * clamp((d - a.d) / (b.d - a.d), 0, 1);
  }

  function buildWorld() {
    // The only text on the map is the section headings and project names, each at its own stop.
    const labels = MAP.labels.map((l) => `<text x="${l.at[0]}" y="${l.at[1]}" data-d="${stopOf(l.stop).d}">${l.text}</text>`).join('');
    const layer = (cls, inner) =>
      `<svg class="layer ${cls}" xmlns="${svgNS}" aria-hidden="true"><g class="cam">${inner}</g></svg>`;
    // Wall faces are flat 3D-placed divs, so only their parent transform changes per frame.
    const faces = MAP.walls.map(([x1, y1, x2, y2]) => {
      const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
      return `<i style="width:${Math.hypot(x2 - x1, y2 - y1) * FACE}px;height:${WALL * FACE}px;transform:translate3d(${x1 * FACE}px,${y1 * FACE}px,0) rotateZ(${angle}deg) rotateX(90deg)" data-a="${Math.round(angle)}"></i>`;
    }).join('');
    // The apron is surround beyond the map edge, shown when zoomed in so no dark edge appears.
    stage.innerHTML = `<div class="plane">${
      layer('floor', `<rect class="apron" x="-100" y="-100" width="300" height="300"/><rect class="mass" width="100" height="100"/>${rooms}<polyline class="route-all" points="${line(MAP.points)}"/><polyline class="route-done"/><g class="marks">${dated.map(() => '<rect/>').join('')}</g><circle class="pos"/>`)
    }<div class="walls">${faces}</div>${layer('top', `<path class="mass" d="${MAP.mass}"/><g class="years"></g><g class="labels">${labels}</g><g class="ring"><circle class="pos-ring"/></g>`)}</div>`;

    // HUD minimap: the same plan, small, with the route walked so far and no labels.
    const hud = stopOf('why-riot');
    $('.mini').innerHTML = `<svg viewBox="0 0 100 100">${rooms}<polyline points="${walkedTo(hud.d)}"/><circle cx="${hud.at[0]}" cy="${hud.at[1]}" r="2.4"/></svg>`;

    // The four section headings as buttons on the map, in the buy phase, the Map overlay and the
    // close, where the three project names are buttons too (with no preview card).
    $$('.chips').forEach((nav) => {
      const tip = nav.parentElement.querySelector('.preview').id;
      const projects = nav.closest('#close') ? MAP.labels.filter((l) => l.stop.startsWith('p-')) : [];
      nav.innerHTML = MAP.callouts.map((c, n) =>
        `<a class="chip" href="#${c.id}" style="left:${c.at[0]}%;top:${c.at[1]}%;--n:${n}" data-line="${$(`.menu a[href="#${c.id}"]`).dataset.line}" aria-describedby="${tip}">${c.text}</a>`).join('') +
        projects.map((l, n) => `<a class="chip" href="#${l.stop}" style="left:${l.at[0]}%;top:${l.at[1]}%;--n:${n + 4}">${l.text}</a>`).join('');
    });
    $('.plan').innerHTML = `<rect class="mass" width="100" height="100"/>${rooms}<polyline class="route-all" points="${line(MAP.points)}"/><polyline class="done"/><circle r="1.6"/>`;
  }

  // Callout preview: one card per map, filled and placed next to the hovered or focused callout.
  function showPreview(el) {
    const frame = el.closest('section, dialog');
    const href = el.getAttribute('href');
    const chip = $(`.chip[href="${href}"]`, frame);
    const item = $(`.menu a[href="${href}"]`, frame);
    const preview = $('.preview', frame);
    $$('.chip, .menu a', frame).forEach((x) => x.classList.toggle('on', x === item || x === chip));
    if (!chip.dataset.line) return; // a project name on the close map: highlight only
    preview.querySelector('b').textContent = chip.textContent;
    preview.querySelector('span').textContent = chip.dataset.line;
    const view = preview.parentElement.getBoundingClientRect();
    const c = chip.getBoundingClientRect();
    const w = preview.offsetWidth, h = preview.offsetHeight;
    let x = c.right + 12 - view.left, y = c.top - view.top;
    if (x + w > view.width) x = c.left - 12 - w - view.left;
    if (x < 0) { // phone: below the chip, or above it if there is no room below
      x = clamp(c.left - view.left, 0, view.width - w);
      y = c.bottom + 8 + h > view.bottom ? c.top - 8 - h - view.top : c.bottom + 8 - view.top;
    }
    preview.style.left = `${x}px`;
    preview.style.top = `${clamp(y, 0, view.height - h)}px`;
    preview.classList.add('on');
  }
  const hidePreview = () => $$('.preview.on, .chip.on, .menu a.on').forEach((el) => el.classList.remove('on'));
  const callout = (e) => e.target.closest('.chip, .menu a');
  [sections[ids.indexOf('buy')], sections[ids.indexOf('close')], dialog].forEach((frame) => {
    frame.addEventListener('pointerover', (e) => { if (callout(e) && e.pointerType !== 'touch') showPreview(callout(e)); });
    frame.addEventListener('pointerout', (e) => { if (callout(e)) hidePreview(); });
    frame.addEventListener('focusin', (e) => { if (callout(e) && root.classList.contains('ready')) showPreview(callout(e)); });
    frame.addEventListener('focusout', hidePreview);
  });

  // Agent select: two blurbs, one at a time. A blurb types in by revealing its own text (no reflow).
  const posSec = sections[POS];
  const blurbs = $$('.blurb', posSec);
  let page = 1;
  let finishTyping = () => {};
  function typeIn(p, delay) {
    finishTyping();
    const text = p.textContent;
    const typed = document.createElement('span'), rest = document.createElement('span');
    rest.style.visibility = 'hidden';
    rest.textContent = text;
    p.replaceChildren(typed, rest);
    const t0 = performance.now() + delay * 1000;
    let frame = 0;
    const step = (now) => {
      const n = clamp(Math.round(((now - t0) / 900) * text.length), 0, text.length);
      typed.textContent = text.slice(0, n);
      rest.textContent = text.slice(n);
      frame = n < text.length ? requestAnimationFrame(step) : 0;
      if (!frame) p.textContent = text;
    };
    frame = requestAnimationFrame(step);
    finishTyping = () => { cancelAnimationFrame(frame); p.textContent = text; finishTyping = () => {}; };
  }
  function setPage(n, typeAfter) {
    page = n;
    finishTyping();
    posSec.classList.toggle('p2', n === 2);
    $('.page', posSec).textContent = `${n} / 2`;
    if (typeAfter !== undefined) typeIn(blurbs[n - 1], typeAfter);
  }

  // Glitch: the screen's title glitches on arrival, then again every 6 to 10 s until the screen is left.
  let glitchTimer = 0;
  function glitch(el) {
    clearTimeout(glitchTimer);
    if (!el) return;
    el.classList.remove('glitch');
    void el.offsetWidth; // a reflow, so adding the class again restarts the animation
    el.classList.add('glitch');
    window.sound?.glitch();
    glitchTimer = setTimeout(() => glitch(el), 6000 + Math.random() * 4000);
  }

  // HUD: the chat plays once per visit to the site, and the round timer runs down once.
  let hudStarted = false;
  function startHud() {
    if (hudStarted) return;
    hudStarted = true;
    const timer = $('.timer'), dots = $('.typing'), beats = $$('.beat');
    let left = 100;
    const tick = setInterval(() => {
      timer.textContent = `${Math.floor(--left / 60)}:${String(left % 60).padStart(2, '0')}`;
      if (!left) clearInterval(tick);
    }, 1000);
    // Each line follows 3 s of "juhdawn is typing...".
    let n = 0;
    const beat = () => {
      beats[n++].classList.add('shown');
      window.sound?.blip();
      if (n === beats.length) dots.classList.add('gone');
      else setTimeout(beat, 3000);
    };
    dots.classList.add('on');
    setTimeout(beat, 3000);
  }

  let ctx = null;
  let flight = null; // the glide tween while a button plays the camera
  let drawing = null; // the close screen's route drawing itself
  let cur = 0; // the screen being shown or flown to
  let go = () => {};
  let sync = null; // timeline scroll to camera, while the fly-through is up
  let state = { d: 0 }; // the camera
  let place = null; // the screen, or on the timeline the entry nearest the reading line

  function init() {
    teardown();
    root.classList.add('fly');
    // A screen that does not fit keeps the plain page. The timeline scrolls, so only its width counts.
    const vw = innerWidth, vh = innerHeight;
    const fits = vh >= 560 && vw >= 340 && $('.entries').getBoundingClientRect().right <= vw + 0.5 && sections.every((s) => {
      const p = s.querySelector('.panel'), r = p && p.getBoundingClientRect();
      return !p || r.top >= -0.5 && r.bottom <= vh + 0.5 && r.left >= -0.5 && r.right <= vw + 0.5 && p.scrollHeight <= p.clientHeight + 1;
    });
    if (!fits) { root.classList.remove('fly'); return; }

    const W = Math.ceil(Math.max(vw, vh) * 2.5); // big enough that a tilted view never shows the layer edge
    stage.querySelectorAll('.layer').forEach((l) => { l.setAttribute('width', W); l.setAttribute('height', W); l.style.left = l.style.top = `${-W / 2}px`; });
    const cams = $$('.cam', stage);
    const plane = $('.plane', stage), walls = $('.walls', stage), top = $('.top', stage);
    const texts = $$('.labels text', stage), marks = $$('.marks rect', stage), apron = $('.apron', stage);
    const done = $('.route-done', stage), pos = $('.pos', stage), ring = $('.pos-ring', stage);
    const onTimeline = [$('.marks', stage), $('.years', stage), $('.ring', stage)];
    const now = $('.bar .now'), bar = $('.bar'), yearBox = $('.year-now');
    const phone = matchMedia('(max-aspect-ratio: 1/1)').matches;
    const rem = parseFloat(getComputedStyle(root).fontSize);

    // Timeline: the reading line's box sits on the corridor and is one marker spacing tall.
    const reading = $('.reading', timeline).getBoundingClientRect();
    const d0 = dated[0].d, d9 = dated.at(-1).d;
    const tlScale = reading.height / (dated[1].at[1] - dated[0].at[1]); // px per map unit
    timeline.style.setProperty('--pt', `${Math.max(0, vh / 2 - cards[0].offsetHeight / 2)}px`);
    timeline.style.setProperty('--pb', `${Math.max(0, vh / 2 - cards.at(-1).offsetHeight / 2)}px`);
    const S = cards.map((c) => c.offsetTop + c.offsetHeight / 2 - vh / 2); // scroll at which card k is on the reading line
    const m = 0.625 * rem / tlScale;
    marks.forEach((r, k) => { r.setAttribute('x', dated[k].at[0] - m / 2); r.setAttribute('y', dated[k].at[1] - m / 2); r.setAttribute('width', m); r.setAttribute('height', m); });
    // Year marks: each Jan 1 placed by date; the first year is extrapolated above the first entry.
    const x0 = dated[0].at[0], u = rem / tlScale;
    const first = Math.floor(dated[0].when);
    const years = MAP.years.map((y) => [y.year, y.at[1]]);
    if (first < years[0][0]) years.unshift([first, dated[0].at[1] - (dated[0].when - first) * (dated[1].at[1] - dated[0].at[1]) / (dated[1].when - dated[0].when)]);
    $('.years', stage).innerHTML = years.map(([year, y]) =>
      `<line x1="${x0 - 0.5 * u}" x2="${x0 - 1.25 * u}" y1="${y}" y2="${y}"/><text x="${x0 - (phone ? 1.5 : 1.75) * u}" y="${y}" font-size="${(phone ? 0.8125 : 1) * u}">${year}</text>`).join('');
    const yearTexts = $$('.years text', stage);

    // Camera per screen, from the page layout: `.view` screens and the lobby fit the whole map,
    // the timeline puts the corridor at the reading line, others put their point beside their card.
    const mapScale = $('#buy .view').getBoundingClientRect().width / 100;
    $('.labels', stage).style.fontSize = `${15 / mapScale}px`;
    const fitIn = (r, stop) => {
      const sc = r.width / 100;
      const cx = 50 - (r.left + r.width / 2 - vw / 2) / sc, cy = 50 - (r.top + r.height / 2 - vh / 2) / sc;
      return { d: stop.d, ox: (cx - stop.at[0]) * sc, oy: (cy - stop.at[1]) * sc, ls: Math.log(sc), f: 0 };
    };
    const views = sections.map((s, i) => {
      if (i === TL) return { d: d0, ox: vw / 2 - reading.left, oy: 0, ls: Math.log(tlScale), f: 0 };
      const stop = stopOf(s.id);
      if (!i || s.dataset.cam === 'map') return fitIn((s.querySelector('.view') || $('#buy .view')).getBoundingClientRect(), stop);
      const card = s.querySelector('.intro, .project');
      const c = card && card.getBoundingClientRect();
      let sx = vw / 2, sy = vh / 2;
      if (c && c.left > vw - c.right) sx = c.left / 2; // card on the right: point in the middle of the space left of it
      else if (c && c.top > vh - c.bottom) sy = (48 + c.top) / 2; // card at the bottom: point above it
      else if (c) sy = (c.bottom + vh) / 2; // card at the top: point below it
      return { d: stop.d, ox: vw / 2 - sx, oy: vh / 2 - sy, ls: Math.log(mapScale * (+s.dataset.zoom || 1.7)), f: +(s.dataset.tilt || 0) };
    });

    state = { ...views[0], bank: 0 };
    const buyD = stopOf('buy').d;
    let shown = -1, shownYear = 0, tl = null, pendingFocus = null;
    const arrive = [0]; // timeline time at which each screen is reached
    let leave = 0; // time at which the camera reaches the last timeline entry
    const entryTime = (k) => arrive[TL] + (leave - arrive[TL]) * (dated[k].d - d0) / (d9 - d0);

    const render = () => {
      const p = pointAt(state.d);
      const s = Math.exp(state.ls);
      const cx = p.x + state.ox / s, cy = p.y + state.oy / s;
      const cam = `translate(${W / 2} ${W / 2}) scale(${s}) translate(${-cx} ${-cy})`;
      cams.forEach((c) => c.setAttribute('transform', cam));
      const moving = state.f > 0.001;
      plane.style.transform = moving ? `rotateX(${state.f * MAX_TILT}deg) rotateZ(${state.bank}deg)` : 'none';
      top.style.transform = moving ? `translateZ(${state.f * WALL * s}px)` : '';
      walls.style.visibility = moving ? 'visible' : 'hidden';
      // Walls stop just short of the raised top so the browser never has to sort coplanar faces.
      if (moving) walls.style.transform = `scale3d(${s / FACE},${s / FACE},${(s * state.f * 0.97) / FACE}) translate3d(${-cx * FACE}px,${-cy * FACE}px,0)`;
      // All labels read on the whole map and in long flights (not before the walk: the buy phase has
      // buttons there). Closer in, only the current stop's label shows, and never huge in a close-up.
      const along = clamp(Math.min(state.d - d0 + 3, d9 + 3 - state.d) / 3, 0, 1); // near the timeline corridor
      const far = clamp((state.d - buyD) / 4, 0, 1) * (1 - along) * clamp((1.3 * mapScale - s) / (0.3 * mapScale), 0, 1);
      const near = clamp((2.4 * mapScale - s) / (0.4 * mapScale), 0, 1);
      texts.forEach((l) => { l.style.opacity = Math.max(far, near * clamp(1 - Math.abs(state.d - l.dataset.d) / 4, 0, 1)); });
      done.setAttribute('points', walkedTo(state.d));
      [pos, ring].forEach((c) => { c.setAttribute('cx', p.x); c.setAttribute('cy', p.y); c.setAttribute('r', 7 / s); });

      // Timeline pieces show only near the corridor; markers turn red as the dot reaches them.
      onTimeline.forEach((el) => { el.style.opacity = along; });
      apron.style.opacity = Math.max(along, clamp((s / mapScale - 1.05) / 0.15, 0, 1)); // zoomed in, no dark map edge
      marks.forEach((r, k) => r.classList.toggle('on', dated[k].d <= state.d + 0.01));
      const year = Math.floor(whenAt(state.d) + 1e-6);
      if (year !== shownYear) { // the new year slides in from the direction of travel
        yearBox.innerHTML = `<span class="${!shownYear ? '' : year > shownYear ? 'up' : 'down'}">${year}</span>`;
        shownYear = year;
      }
      // A year mark gives way to the readout while it passes the reading line.
      yearTexts.forEach((t) => { t.style.opacity = Math.abs(t.getAttribute('y') - p.y) * s < 1.25 * rem ? 0 : 1; });

      const time = tl ? tl.time() : 0;
      const at = arrive.reduce((best, a, i) => (time >= a - 0.35 ? i : best), 0);
      if (at !== shown) { shown = at; now.textContent = sections[at].dataset.heading; bar.classList.toggle('home', !at); }
      if (pendingFocus && getComputedStyle(pendingFocus).visibility === 'visible') {
        pendingFocus.querySelector('[tabindex="-1"]').focus({ preventScroll: true });
        pendingFocus = null;
      }
    };

    ctx = gsap.context(() => {
      gsap.set(sections, { autoAlpha: 0 });
      gsap.set(sections[0], { autoAlpha: 1 });
      gsap.set(stage, { opacity: 0 });
      tl = gsap.timeline({ paused: true, defaults: { ease: 'none' }, onUpdate: render });
      const travelLs = Math.log(Math.max(vw, vh) / 52);
      const ZOOM = Math.log(2.4); // how far the camera zooms past a room before its scene takes over
      let t = 0;

      // The fly: position eases across, scale pulls out and in, the map tilts up and down (less on short hops).
      const travel = (a, b) => {
        const dist = Math.abs(b.d - a.d);
        const T = clamp(0.9 + dist / 45, 1, 2.2);
        tl.to(state, { d: b.d, ox: b.ox, oy: b.oy, ease: 'power2.inOut', duration: T }, t);
        if (dist < 1) { tl.to(state, { ls: b.ls, f: b.f, ease: 'power2.inOut', duration: T }, t); return T; }
        const pa = pointAt(a.d), pb = pointAt(b.d);
        const heading = Math.atan2(pb.x - pa.x, -(pb.y - pa.y)) * 180 / Math.PI;
        const short = dist < 12;
        tl.to(state, { ls: Math.min(a.ls, b.ls, travelLs) - (short ? Math.log(1.3) : 0), duration: T / 2, ease: 'power2.out' }, t);
        tl.to(state, { ls: b.ls, duration: T / 2, ease: 'power2.in' }, t + T / 2);
        tl.to(state, { f: short ? 0.35 : 1, bank: short ? 0 : clamp(-heading, -38, 38), duration: T / 2, ease: 'sine.inOut' }, t);
        tl.to(state, { f: b.f, bank: 0, duration: T / 2, ease: 'sine.inOut' }, t + T / 2);
        return T;
      };

      sections.forEach((to, i) => {
        if (!i) return;
        const from = sections[i - 1];
        tl.to(from, { autoAlpha: 0, duration: 0.3 }, t);
        if (from.dataset.scene === 'zoom') { // leave a full scene: pull back out of the room before flying on
          tl.to(state, { ls: views[i - 1].ls, duration: 0.5, ease: 'power2.out' }, t);
          t += 0.5;
        }
        const T = travel(i - 1 === TL ? { ...views[TL], d: d9 } : views[i - 1], views[i]);
        if (i === 1) tl.to(stage, { opacity: 1, duration: T / 2, ease: 'power1.inOut' }, t);
        t += T;
        if (to.dataset.scene === 'zoom') {
          // Zoom past the room floor, then the scene takes over.
          tl.to(state, { ls: views[i].ls + ZOOM, duration: 1, ease: 'power2.in' }, t);
          tl.fromTo(to, { autoAlpha: 0, scale: 1.04 }, { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'power2.out' }, t + 0.65);
          t += 1;
        } else {
          tl.to(to, { autoAlpha: 1, duration: Math.min(0.4, T * 0.35) }, t - Math.min(0.4, T * 0.35));
        }
        arrive.push(t);
        // The corridor itself: scrolling the cards sets the time inside this stretch.
        if (i === TL) {
          tl.to(state, { d: d9, duration: 1.5 }, t);
          leave = t += 1.5;
        }
      });
      // On a slow device, drop the wall faces rather than stutter; the raised plan still reads.
      let slow = 0;
      const watch = (time, delta) => {
        if (state.f < 0.2) return;
        slow = delta > 60 ? slow + Math.ceil(delta / 60) : Math.max(0, slow - 1); // a very slow frame counts as several
        if (slow > 12) { root.classList.add('no-faces'); gsap.ticker.remove(watch); }
      };
      gsap.ticker.add(watch);
      tl.time(0);
      render();
    });

    // Cards away from the reading line dim; the one on it is at full strength.
    const dim = () => cards.forEach((c) => {
      const r = c.getBoundingClientRect(), mid = vh / 2;
      const dist = r.top > mid ? r.top - mid : r.bottom < mid ? mid - r.bottom : 0;
      c.style.setProperty('--o', Math.max(0.35, 1 - dist / (0.45 * vh)).toFixed(2));
    });
    // Between two cards the camera moves linearly, so a marker is level with its card on the reading line.
    sync = () => {
      if (flight || cur !== TL) return;
      const y = timeline.scrollTop;
      let k = 0;
      while (k < cards.length - 2 && S[k + 1] <= y) k++;
      const f = clamp((y - S[k]) / (S[k + 1] - S[k]), 0, 1);
      tl.time(entryTime(k) + (entryTime(k + 1) - entryTime(k)) * f);
      if (y > 4) timeline.classList.add('scrolled');
      dim();
    };

    const arrived = (i) => {
      sections[i].classList.add('here');
      glitch($('.name, #projects h2, .project h3', sections[i]));
      if (ids[i] === 'why-riot') startHud();
      if (ids[i] === 'close') {
        const o = { v: 0 };
        drawing = gsap.to(o, { v: lengths.at(-1), duration: 2.4, ease: 'power1.inOut', onUpdate: () => done.setAttribute('points', walkedTo(o.v)) });
      }
    };

    // Next buttons glide (Back glides in reverse); the Map overlay and deep links cut.
    go = (id, glide) => {
      let i = ids.indexOf(id), k = cards.findIndex((c) => c.id === id);
      if (k >= 0) i = TL;
      if (i < 0) return;
      flight?.kill();
      drawing?.kill();
      flight = drawing = null;
      glitch(null);
      const from = cur;
      cur = i;
      sections.forEach((s) => s.classList.remove('here'));
      timeline.classList.remove('leaving');
      let time = arrive[i];
      if (i === TL) {
        if (k < 0) k = glide && from > TL ? cards.length - 1 : 0;
        time = entryTime(k);
        timeline.classList.toggle('scrolled', k > 0); // the Scroll hint shows only at the start
        timeline.scrollTop = S[k];
        dim();
      }
      const seconds = glide ? clamp(Math.abs(time - tl.time()) * 0.7, 0.6, 2.4) : 0;
      if (i === POS) { if (glide && from > POS) setPage(2); else setPage(1, seconds); }
      pendingFocus = sections[i];
      history.replaceState(null, '', `#${id}`);
      const end = () => { flight = null; timeline.classList.remove('leaving'); arrived(i); };
      if (!glide) { tl.time(time); render(); end(); return; }
      // Leaving the timeline backwards: the cards fade first, then the camera runs back up.
      const out = from === TL && i < TL;
      if (out) timeline.classList.add('leaving');
      flight = gsap.to(tl, { time, duration: seconds, delay: out ? 0.2 : 0, ease: 'power1.inOut', onComplete: end });
    };
    place = () => {
      let k = 0;
      while (k < cards.length - 1 && (S[k] + S[k + 1]) / 2 <= timeline.scrollTop) k++;
      return cur === TL ? cards[k].id : ids[cur];
    };
    window.fly = { tl, arrive, leave, go }; // for the screenshot and acceptance scripts
    root.classList.add('ready');
  }

  function back() {
    if (cur === POS && page === 2) { setPage(1); blurbs[0].focus({ preventScroll: true }); return; }
    if (cur > 0) go(ids[cur - 1], true);
  }

  function teardown() {
    flight?.kill();
    drawing?.kill();
    flight = drawing = sync = null;
    glitch(null);
    finishTyping();
    dialog.close();
    if (ctx) ctx.revert();
    ctx = null;
    sections.forEach((s) => s.classList.remove('here'));
    root.classList.remove('fly', 'ready');
  }

  function start() {
    try {
      buildWorld();
      init();
      const hash = location.hash.slice(1);
      if (!root.classList.contains('ready')) return;
      if (hash && document.getElementById(hash) && hash !== 'lobby') go(hash, false);
      else sections[0].classList.add('here');
    } catch (err) {
      teardown();
      console.warn('Staying on the plain page:', err);
    }
  }

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || !root.classList.contains('ready')) return;
    e.preventDefault();
    hidePreview();
    dialog.close();
    go(a.getAttribute('href').slice(1), a.classList.contains('next'));
  });
  $('.back').addEventListener('click', back);
  $('.page-next').addEventListener('click', () => { setPage(2, 0); blurbs[1].focus({ preventScroll: true }); });
  $('.map-btn').addEventListener('click', () => {
    const p = pointAt(state.d), dot = $('.plan circle');
    $('.plan .done').setAttribute('points', walkedTo(state.d));
    dot.setAttribute('cx', p.x);
    dot.setAttribute('cy', p.y);
    dialog.showModal();
  });
  $('.shut').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (e) => { // a click on the dimmed page outside the panel closes it
    const r = dialog.getBoundingClientRect();
    if (e.target === dialog && (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)) dialog.close();
  });
  timeline.addEventListener('scroll', () => sync?.(), { passive: true });

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || !window.gsap) { root.classList.remove('fly'); return; }

  let lastW = innerWidth, lastH = innerHeight;
  addEventListener('resize', () => {
    if (innerWidth === lastW && Math.abs(innerHeight - lastH) < 120) return; // a phone's address bar
    [lastW, lastH] = [innerWidth, innerHeight];
    const was = root.classList.contains('ready') ? place() : null;
    init();
    if (root.classList.contains('ready')) go(was || 'lobby', false);
    else if (was) document.getElementById(was).scrollIntoView(); // plain page: keep the reader's place
  });

  gsap.ticker.lagSmoothing(0); // a slow frame skips ahead rather than stalling a glide
  // Measure after load (fonts in), so the browser's own jump to a #fragment cannot land after ours.
  if (document.readyState === 'complete') start(); else addEventListener('load', start);
})();
