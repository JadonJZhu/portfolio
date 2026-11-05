// Final acceptance: node test/acceptance.mjs [port]. Needs Playwright 1.61.0 and its Chromium.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';

const PORT = process.argv[2] || 38127, URL_ = `http://localhost:${PORT}/`;
const server = spawn('node', ['scripts/serve.mjs'], { env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 400));
const browser = await chromium.launch({ executablePath: `${homedir()}/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome` });
let failed = 0;
const check = (name, ok, detail = '') => { if (!ok) failed++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? `: ${detail}` : ''}`); };
const sizes = { desktop: { width: 1440, height: 900 }, phone: { width: 390, height: 844 } };
const html = readFileSync('index.html', 'utf8');
const spec = readFileSync('../../docs/SPEC.md', 'utf8');
const route = JSON.parse(readFileSync('data/route.json', 'utf8'));
const map = JSON.parse(readFileSync('data/tannery-row.json', 'utf8'));
const screens = ['lobby', 'position', 'buy', 'why-riot', 'timeline', 'projects', 'p-readability-grid', 'p-playtest-triage', 'p-callout-drill', 'close'];
const entries = route.stops.filter((s) => s.when).map((s) => s.id);
const roomNames = map.rooms.map((r) => r.name);
const norm = (s) => s.replace(/<[^>]+>/g, ' ').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const section = (id) => html.match(new RegExp(`<section id="${id}"[\\s\\S]*?</section>`))[0];

// Structure and copy
const order = [...html.matchAll(/<section id="([^"]+)"/g)].map((m) => m[1]);
check('screens in the new order', order.join() === screens.join(), order.join());
const cardIds = [...section('timeline').matchAll(/<article class="card" id="([^"]+)"/g)].map((m) => m[1]);
check('timeline holds the ten entries in order', cardIds.join() === entries.join(), cardIds.join());
check('removed: title, blurb screen, abilities, health, rail, or scroll, ScrollTrigger', !/id="title"|id="blurb"|abilities|class="health|class="rail|or scroll|class="or"|ScrollTrigger/.test(html));
const dash = new RegExp('[\\u2013\\u2014]|&[mn]dash;'); // written as escapes so this file passes its own check
const sources = ['README.md', 'index.html', 'src/sound.js', 'src/style.css', 'src/site.js', 'data/route.json', 'docs/design-plan.md', 'scripts/build-map.mjs', 'test/acceptance.mjs', 'test/shots.mjs'];
check('no em or en dashes', sources.every((f) => !dash.test(readFileSync(f, 'utf8'))), sources.filter((f) => dash.test(readFileSync(f, 'utf8'))).join());
const text = norm(html.replace(/<script[\s\S]*?<\/script>/g, ''));
const banned = /claude|salary|12-week|holden|\$\d+\s*(\/|an?\s)hr/i;
check('no banned words in copy', !banned.test(text), (text.match(banned) || [''])[0]);
check('title avoids Riot and game names', !/riot|valorant|tft|arcane|league/i.test(html.match(/<title>(.*?)<\/title>/)[1]));
check('noindex', html.includes('name="robots" content="noindex"'));
const chatLines = readFileSync('../../docs/player-section.md', 'utf8').split('\n').filter((l) => l.startsWith('juhdawn:'));
const chat = [...html.match(/<div class="chat">([\s\S]*?)<p class="typing"/)[1].matchAll(/<p class="beat">([\s\S]*?)<\/p>/g)].map((m) => norm(m[1]));
check('HUD chat is the four lines of docs/player-section.md verbatim', chatLines.length === 4 && chat.length === 4 && chat.every((c, i) => c === norm(chatLines[i])), chat.map((c, i) => c === norm(chatLines[i])).join());
const specBlurbs = [1, 2].map((n) => norm(spec.slice(spec.indexOf('\n## 5.')).match(new RegExp(`\\n  ${n}\\. ([\\s\\S]*?)(?=\\n  \\d\\.|\\n- )`))[1]));
const blurbs = [...html.matchAll(/<p class="blurb"[^>]*>([\s\S]*?)<\/p>/g)].map((m) => norm(m[1]));
check('agent-select blurbs are SPEC verbatim', blurbs.length === 2 && blurbs.every((b, i) => b === specBlurbs[i]), blurbs.map((b, i) => b === specBlurbs[i]).join());
for (const name of ['Readability Grid', 'Playtest Triage', 'Callout Drill']) {
  const want = norm(spec.match(new RegExp(`- ${name}: (Proof-of-concept:[\\s\\S]*?\\.)(?= \\(|\\n)`))[1]);
  check(`${name} summary is SPEC verbatim`, text.includes(want), want.slice(0, 50));
}
check('Position Overview preview quotes blurb 1', html.includes(`data-line="I'd love to join Riot Games."`));
check('lobby says Visual Portfolio, with no flicker', /class="brand">Visual Portfolio</.test(html) && !/flicker/.test(readFileSync('src/style.css', 'utf8')));
check('Yang Lab line has no "programmatic"; research cards have one date, no write-up line', html.includes('Developed image processing scripts') && !/programmatic|write-up/.test(html));
const nexts = screens.map((id) => (section(id).match(/class="next/g) || []).length).join('');
check('next buttons per screen (agent select has Next and LOCK IN, close none)', nexts === '1211111110', nexts);
check('timeline Next only on the last entry', (section('timeline').match(/class="next/g) || []).length === 1 && /id="t-ucla"[\s\S]*class="next"/.test(section('timeline')));
check('resume PDF present and linked', existsSync('assets/JadonZhu-Resume-RiotPortfolio.pdf') && statSync('assets/JadonZhu-Resume-RiotPortfolio.pdf').size > 1000 && html.includes('href="assets/JadonZhu-Resume-RiotPortfolio.pdf"'));
const imageBytes = ['assets/me', 'assets/games', 'assets/icons', 'assets/map', 'assets/projects'].flatMap((d) => readdirSync(d).map((f) => statSync(`${d}/${f}`).size)).reduce((a, b) => a + b, 0);
check('images under 3 MB', imageBytes < 3e6, `${(imageBytes / 1e6).toFixed(2)} MB`);
const roomRe = new RegExp(`\\b(${roomNames.join('|')})\\b`);
const alts = [...html.matchAll(/alt="([^"]*)"/g)].map((m) => m[1]);
check('no room names in alt text, page copy or the shipped map data', !alts.some((a) => roomRe.test(a)) && !roomRe.test(text) && !roomRe.test(readFileSync('src/map-data.js', 'utf8')) && !readdirSync('assets/map').some((f) => roomRe.test(readFileSync(`assets/map/${f}`, 'utf8'))));
check('map labels are section headings and project names only', route.labels.every((l) => !roomNames.includes(l.text)) && route.callouts.map((c) => c.text).join() === 'Position Overview,Why I love Riot,Past experiences,Riot-inspired Projects');
const onFloor = (x, y) => map.rooms.some((r) => r.rects.some(([a, b, w, h]) => x >= a && x <= a + w && y >= b && y <= b + h));
check('route stays on floors', route.points.every((p, i) => !i || [...Array(101).keys()].every((t) => { const q = route.points[i - 1]; return onFloor(q[0] + (p[0] - q[0]) * t / 100, q[1] + (p[1] - q[1]) * t / 100); })));
const external = [...html.matchAll(/<a [^>]*href="(https?:[^"]+|assets[^"]+)"[^>]*>/g)];
check('external links and resume open in a new tab', external.every((m) => m[0].includes('target="_blank"')), `${external.length} links`);
for (const name of ['readability-grid', 'playtest-triage', 'callout-drill'])
  check(`${name} has demo and repo links`, html.includes(`https://jadonjzhu.github.io/${name}/`) && html.includes(`https://github.com/JadonJZhu/${name}`));
for (const [, src] of html.matchAll(/(?:src|href)="((?:assets|src|vendor)[^"]+)"/g)) if (!existsSync(src)) check(`file exists ${src}`, false);
const lines = readFileSync('src/site.js', 'utf8').split('\n').length;
console.log(`INFO site script is ${lines} lines (SPEC estimate: under 450)`);

// Browser helpers
const ready = (page) => page.waitForFunction(() => document.documentElement.classList.contains('ready'), null, { timeout: 8000 });
const settle = async (page) => { // the glide has finished and the screen has caught up
  await page.waitForFunction(() => !gsap.getTweensOf(window.fly.tl).length, null, { polling: 200, timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(400);
};
const front = (page) => page.evaluate(() => [...document.querySelectorAll('main > section')].filter((s) => getComputedStyle(s).visibility === 'visible' && +getComputedStyle(s).opacity > 0.9).at(-1)?.id);
const cut = (page, id) => page.evaluate((id) => window.fly.go(id, false), id);
const scrollTo = (page, k) => page.evaluate((k) => { const t = document.getElementById('timeline'), c = t.querySelectorAll('.card')[k]; t.scrollTop = c.offsetTop + c.offsetHeight / 2 - innerHeight / 2; }, k);
// Next buttons that glow: visible, on screen, pulsing.
const glowing = (page) => page.evaluate(() => [...document.querySelectorAll('.next')].filter((b) => {
  const r = b.getBoundingClientRect();
  return getComputedStyle(b).visibility === 'visible' && r.bottom > 0 && r.top < innerHeight && getComputedStyle(b, '::after').animationName === 'pulse';
}).map((b) => b.textContent));
// Anything else glowing or red at rest (callouts and menu items stay plain until hovered).
const plainRest = (page) => page.evaluate(() => [...document.querySelectorAll('.chip, .menu a, .back, .map-btn')].every((el) => getComputedStyle(el).boxShadow === 'none' && getComputedStyle(el).color !== 'rgb(255, 70, 85)'));
const fitsScreen = (page, id) => page.evaluate((id) => {
  const s = document.getElementById(id), vw = innerWidth, vh = innerHeight, bad = [];
  const tl = id === 'timeline';
  const hit = (a, b) => a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1;
  const go = [...s.querySelectorAll('.next')].find((b) => getComputedStyle(b).visibility === 'visible')?.getBoundingClientRect();
  const bar = document.querySelector('.bar').getBoundingClientRect();
  s.querySelectorAll('h1,h2,h3,p,li,a,img,.chat,.agent').forEach((el) => {
    if (el.closest('.thumb, .fly-vh, .preview, .reading') || el.classList.contains('thumb') || el.classList.contains('figure') || getComputedStyle(el).visibility !== 'visible') return;
    const b = el.getBoundingClientRect();
    if (b.width <= 1) return;
    if (b.left < -0.5 || b.right > vw + 0.5 || (!tl && (b.top < -0.5 || b.bottom > vh + 0.5))) bad.push('off ' + el.tagName + ':' + el.textContent.slice(0, 20));
    const cs = getComputedStyle(el);
    if (cs.display !== 'inline' && !el.closest('[aria-hidden="true"], .go') && el.scrollWidth > el.clientWidth + 1) bad.push('wide ' + el.tagName + ':' + el.textContent.slice(0, 20));
    if (cs.overflow !== 'visible' && el.tagName !== 'IMG' && el.scrollHeight > el.clientHeight + 1) bad.push('clipped ' + el.tagName + ':' + el.textContent.slice(0, 20));
    if (go && !el.closest('.go') && !el.contains(s.querySelector('.go')) && hit(b, go)) bad.push('under next ' + el.tagName + ':' + el.textContent.slice(0, 20));
    if (!tl && b.top < bar.bottom - 1) bad.push('under bar ' + el.tagName);
  });
  return { bad, overflowX: document.documentElement.scrollWidth > vw };
}, id);
// The SPEC's animation for each screen, checked right after arriving (some run once).
const anim = { lobby: '.slot', position: '.figure', buy: '#buy .chip', 'why-riot': '.mini circle', timeline: '.pos-ring', projects: '#projects h2', 'p-readability-grid': '#p-readability-grid .shot', 'p-playtest-triage': '#p-playtest-triage .shot', 'p-callout-drill': '#p-callout-drill .shot', close: '.email' };
const animating = (page, id) => page.evaluate(([id, sel]) => {
  window.fly.go(id, false);
  return document.getAnimations().filter((a) => a.effect.target && a.effect.target.matches(sel) && a.playState !== 'idle').length;
}, [id, anim[id]]);

for (const [name, viewport] of Object.entries(sizes)) {
  const errors = [];
  const page = await (await browser.newContext({ viewport })).newPage();
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(URL_);
  await ready(page);
  await page.waitForLoadState('load'); await page.waitForTimeout(500);

  // Every screen: in front, inside the screen, no clipped text, one glowing next button, an animation.
  const views = [];
  for (const id of screens) {
    if (id === 'timeline') { for (const k of [0, 4, 9]) views.push([id, k]); } else views.push([id]);
    if (id === 'position') views.push([id, 2]);
  }
  for (const [id, k] of views) {
    await cut(page, id);
    if (id === 'position' && k === 2) await page.click('.page-next');
    if (id === 'timeline') await scrollTo(page, k);
    await page.waitForTimeout(1300);
    const label = `${name} ${id}${k !== undefined ? ` ${id === 'position' ? 'blurb 2' : `entry ${k}`}` : ''}`;
    const r = await fitsScreen(page, id);
    const shown = await front(page);
    check(`${label} in front and fits`, shown === id && !r.bad.length && !r.overflowX, r.bad.join(', ') || `front ${shown}`);
    const glow = await glowing(page);
    const want = id === 'close' || (id === 'timeline' && k !== 9) ? 0 : 1;
    check(`${label} has ${want} glowing next button and plain callouts`, glow.length === want && await plainRest(page), glow.join('|'));
  }
  for (const id of screens) check(`${name} ${id} has its animation`, (await animating(page, id)) > 0, anim[id]);
  const timer = await page.evaluate(() => document.querySelector('.timer').textContent);
  check(`${name} HUD timer counts down`, timer !== '1:40', timer);

  // Chat plays on its own, each line after 3 s of "juhdawn is typing..."; Continue shows from the start.
  {
    const p = await (await browser.newContext({ viewport })).newPage();
    await p.goto(`${URL_}#why-riot`); await ready(p);
    const now = () => p.evaluate(() => ({ beats: document.querySelectorAll('.beat.shown').length, typing: getComputedStyle(document.querySelector('.typing')).display, go: getComputedStyle(document.querySelector('#why-riot .next')).visibility }));
    const seen = [await now()];
    for (const wait of [2500, 1200, 3000, 3000, 3000]) { await p.waitForTimeout(wait); seen.push(await now()); } // about 2.5, 3.7, 6.7, 9.7 and 12.7 s
    const fit = await fitsScreen(p, 'why-riot');
    check(`${name} HUD chat: typing 3 s before each of four lines, Continue from the start, all fit`,
      seen.map((s) => s.beats).join() === '0,0,1,2,3,4' && seen.slice(0, 5).every((s) => s.typing === 'block') && seen[5].typing === 'none' && seen[0].go === 'visible' && !fit.bad.length,
      JSON.stringify(seen.map((s) => s.beats + s.typing)) + fit.bad.join());
    await p.close();
  }

  // No room names on screen: map labels, chips, minimap, overlay, bar.
  const onScreen = await page.evaluate(() => [...document.querySelectorAll('.stage text, .chip, .mini, .plan, .bar, .menu a')].map((e) => e.textContent.trim()));
  check(`${name} no room names rendered`, !onScreen.some((t) => roomRe.test(t)) && onScreen.some((t) => t), onScreen.filter((t) => roomRe.test(t)).join());

  // Wheel outside the timeline does not change the screen.
  const still = [];
  for (const id of ['lobby', 'position', 'buy', 'why-riot', 'projects', 'close']) {
    await cut(page, id); await page.waitForTimeout(300);
    const t0 = await page.evaluate(() => window.fly.tl.time());
    await page.mouse.move(viewport.width / 2, viewport.height / 2);
    for (let n = 0; n < 3; n++) { await page.mouse.wheel(0, 400); await page.waitForTimeout(150); }
    await page.keyboard.press('PageDown'); await page.waitForTimeout(500);
    const t1 = await page.evaluate(() => window.fly.tl.time());
    if (t0 !== t1 || (await front(page)) !== id || (await page.evaluate(() => scrollY))) still.push(id);
  }
  check(`${name} wheel and keys outside the timeline do not move the screen`, !still.length, still.join());

  // Wheel in the timeline: cards and camera move together, the map more slowly, no snapping.
  await cut(page, 'timeline'); await page.waitForTimeout(800);
  await page.mouse.move(viewport.width * 0.8, viewport.height / 2);
  const at = () => page.evaluate(() => ({ y: document.getElementById('timeline').scrollTop, t: window.fly.tl.time(), card: document.querySelectorAll('#timeline .card')[2].getBoundingClientRect().top, mark: document.querySelectorAll('.marks rect')[2].getBoundingClientRect().top, hint: getComputedStyle(document.querySelector('.hint')).opacity }));
  const a = await at();
  for (let n = 0; n < 3; n++) { await page.mouse.wheel(0, 150); await page.waitForTimeout(250); }
  await page.waitForTimeout(800);
  const b = await at();
  await page.waitForTimeout(1200);
  const c = await at();
  check(`${name} timeline scroll moves cards and camera, map slower, same way, no snap`,
    b.y > a.y && b.t > a.t && b.card < a.card && b.mark < a.mark && a.card - b.card > a.mark - b.mark && c.y === b.y && c.t === b.t && +b.hint < 0.1, JSON.stringify({ a, b, c }));
  await scrollTo(page, 3); await page.waitForTimeout(500);
  const level = await page.evaluate(() => {
    const c = document.querySelectorAll('#timeline .card')[3].getBoundingClientRect(), m = document.querySelectorAll('.marks rect')[3].getBoundingClientRect();
    return [Math.abs((c.top + c.bottom) / 2 - innerHeight / 2), Math.abs((m.top + m.bottom) / 2 - innerHeight / 2)];
  });
  check(`${name} marker level with its card on the reading line`, level.every((v) => v < 3), level.map((v) => v.toFixed(1)).join());

  // Keyboard forward through every screen by its next buttons.
  await cut(page, 'lobby'); await settle(page);
  const trail = ['lobby'];
  const targets = ['position', 'position 2', 'buy', 'why-riot', 'timeline', 'projects', 'p-readability-grid', 'p-playtest-triage', 'p-callout-drill', 'close'];
  for (const want of targets) {
    let found = false;
    for (let k = 0; k < 60 && !found; k++) {
      await page.keyboard.press('Tab');
      found = await page.evaluate(() => { const e = document.activeElement; return e.matches('.next') && getComputedStyle(e).visibility === 'visible'; });
    }
    if (!found) { trail.push('(no next)'); break; }
    await page.keyboard.press('Enter');
    await settle(page);
    const id = want.split(' ')[0];
    const ok = (await front(page)) === id && await page.evaluate(([id, two]) => !!document.activeElement.closest(`#${id}`) && (!two || document.getElementById('position').classList.contains('p2')), [id, want.endsWith('2')]);
    if (!ok) { trail.push(`(${want}: front ${await front(page)})`); break; }
    trail.push(want);
  }
  check(`${name} keyboard reaches every screen by next buttons`, trail.length === targets.length + 1 && !trail.at(-1).startsWith('('), trail.slice(-2).join(' '));

  // Keyboard back through every screen by Back.
  const backs = [];
  for (const want of ['p-callout-drill', 'p-playtest-triage', 'p-readability-grid', 'projects', 'timeline end', 'why-riot', 'buy', 'position 2', 'position 1', 'lobby']) {
    await page.focus('.back'); await page.keyboard.press('Enter'); await settle(page);
    const id = want.split(' ')[0];
    const state = await page.evaluate(() => ({ p2: document.getElementById('position').classList.contains('p2'), next: getComputedStyle(document.querySelector('#t-ucla .next')).visibility === 'visible' && document.querySelector('#t-ucla .next').getBoundingClientRect().bottom < innerHeight }));
    const ok = (await front(page)) === id && (want !== 'timeline end' || state.next) && (want !== 'position 2' || state.p2) && (want !== 'position 1' || !state.p2);
    backs.push(ok ? want : `(${want}: front ${await front(page)} ${JSON.stringify(state)})`);
    if (!ok) break;
  }
  check(`${name} Back walks every screen in reverse`, backs.length === 10 && !backs.at(-1).startsWith('('), backs.slice(-2).join(' '));
  check(`${name} Back hidden on the lobby`, await page.evaluate(() => getComputedStyle(document.querySelector('.back')).display === 'none'));

  // Map overlay by keyboard: opens, Esc closes and returns focus, every item jumps.
  await cut(page, 'projects'); await page.waitForTimeout(300);
  await page.focus('.map-btn'); await page.keyboard.press('Enter'); await page.waitForTimeout(400);
  const opened = await page.evaluate(() => document.querySelector('.map-dialog').open && !!document.activeElement.closest('.map-dialog'));
  const fitsDialog = await page.evaluate(() => { const r = document.querySelector('.map-dialog').getBoundingClientRect(); return r.top >= 0 && r.left >= 0 && r.bottom <= innerHeight + 0.5 && r.right <= innerWidth + 0.5; });
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  const closed = await page.evaluate(() => !document.querySelector('.map-dialog').open && document.activeElement.matches('.map-btn'));
  check(`${name} Map overlay opens by keyboard, fits, Esc closes and returns focus`, opened && fitsDialog && closed, JSON.stringify({ opened, fitsDialog, closed }));
  const missed = [];
  const items = [['.map-dialog .chip[href="#position"]', 'position'], ['.map-dialog .chip[href="#why-riot"]', 'why-riot'], ['.map-dialog .chip[href="#t-yanglab"]', 'timeline'], ['.map-dialog .chip[href="#projects"]', 'projects'], ['.others a[href="#lobby"]', 'lobby'], ['.others a[href="#buy"]', 'buy'], ['.others a[href="#close"]', 'close']];
  for (const [sel, id] of items) {
    await cut(page, id === 'close' ? 'buy' : 'close'); await page.waitForTimeout(200);
    await page.focus('.map-btn'); await page.keyboard.press('Enter'); await page.waitForTimeout(400);
    await page.focus(sel); await page.waitForTimeout(250);
    const preview = !sel.includes('chip') || await page.evaluate(() => {
      const p = document.querySelector('#preview-map'), r = p.getBoundingClientRect();
      return getComputedStyle(p).opacity === '1' && r.top >= 0 && r.left >= 0 && r.bottom <= innerHeight && r.right <= innerWidth;
    });
    await page.keyboard.press('Enter'); await page.waitForTimeout(500);
    const ok = preview && (await front(page)) === id && await page.evaluate((id) => !document.querySelector('.map-dialog').open && !!document.activeElement.closest(`#${id}`), id);
    if (!ok) missed.push(id);
  }
  check(`${name} every overlay item previews (callouts) and jumps by keyboard`, !missed.length, missed.join());

  // Close map: all seven labels are buttons; focus highlights them (the four sections also preview), Enter cuts there.
  const closeMissed = [];
  const closeItems = [['position', 'position'], ['why-riot', 'why-riot'], ['t-yanglab', 'timeline'], ['projects', 'projects'], ['p-readability-grid', 'p-readability-grid'], ['p-playtest-triage', 'p-playtest-triage'], ['p-callout-drill', 'p-callout-drill']];
  for (const [href, id] of closeItems) {
    await cut(page, 'close'); await page.waitForTimeout(900);
    const sel = `#close .chip[href="#${href}"]`;
    await page.focus(sel); await page.waitForTimeout(250);
    const lit = await page.evaluate(([sel, card]) => {
      const p = document.querySelector('#preview-close'), r = p.getBoundingClientRect();
      const shown = getComputedStyle(p).opacity === '1' && r.top >= 0 && r.left >= 0 && r.bottom <= innerHeight && r.right <= innerWidth;
      return document.querySelector(sel).classList.contains('on') && shown === card;
    }, [sel, !href.startsWith('p-')]);
    await page.keyboard.press('Enter'); await page.waitForTimeout(500);
    const ok = lit && (await front(page)) === id && await page.evaluate((id) => !!document.activeElement.closest(`#${id}`), id) && !await page.evaluate(() => gsap.getTweensOf(window.fly.tl).length);
    if (!ok) closeMissed.push(id);
  }
  const closeLabels = await page.evaluate(() => [...document.querySelectorAll('#close .chip')].map((c) => c.textContent).join());
  check(`${name} close map: seven label buttons highlight, sections preview, each cuts to its screen`, !closeMissed.length && closeLabels === 'Position Overview,Why I love Riot,Past experiences,Riot-inspired Projects,Readability Grid,Playtest Triage,Callout Drill', closeMissed.join() || closeLabels);

  // Deep links
  for (const [hash, id] of [['t-motorola', 'timeline'], ['p-callout-drill', 'p-callout-drill'], ['position', 'position']]) {
    const deep = await (await browser.newContext({ viewport })).newPage();
    deep.on('pageerror', (e) => errors.push(e.message));
    await deep.goto(`${URL_}#${hash}`); await ready(deep); await deep.waitForTimeout(800);
    const centred = id !== 'timeline' || await deep.evaluate((h) => { const r = document.getElementById(h).getBoundingClientRect(); return Math.abs((r.top + r.bottom) / 2 - innerHeight / 2) < 3; }, hash);
    check(`${name} deep link #${hash}`, (await front(deep)) === id && centred);
    await deep.close();
  }
  check(`${name} no console errors`, !errors.length, errors.join(' | '));
  await page.close();
}

// Resize keeps the fly-through working and the reader's screen
{
  const page = await (await browser.newContext({ viewport: sizes.desktop })).newPage();
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(`${URL_}#p-playtest-triage`); await ready(page); await page.waitForTimeout(500);
  await page.setViewportSize(sizes.phone); await page.waitForTimeout(1000);
  const r = await page.evaluate(() => document.documentElement.classList.contains('ready'));
  check('resize rebuilds cleanly on the same screen', r && (await front(page)) === 'p-playtest-triage' && !errs.length, errs.join());
  await page.close();
}

// Glitches repeat every 6 to 10 s while the reader stays, and stop once the screen is left
{
  const page = await (await browser.newContext({ viewport: sizes.desktop })).newPage();
  await page.goto(`${URL_}#projects`); await ready(page);
  const count = () => page.evaluate(() => window.glitches);
  await page.evaluate(() => { // count each restart of the glitch on any of its targets
    window.glitches = 0;
    const seen = new MutationObserver((list) => list.forEach((m) => { if (!(m.oldValue || '').includes('glitch') && m.target.classList.contains('glitch')) window.glitches++; }));
    document.querySelectorAll('.name, #projects h2, .project h3').forEach((el) => seen.observe(el, { attributeFilter: ['class'], attributeOldValue: true }));
  });
  await page.waitForTimeout(5500);
  const early = await count();
  await page.waitForTimeout(5000);
  const stay = await count();
  await page.evaluate(() => window.fly.go('p-readability-grid', true));
  await page.waitForTimeout(300);
  const flying = await count();
  await page.waitForFunction(() => document.getElementById('p-readability-grid').classList.contains('here'), null, { timeout: 8000 });
  const arrived = await count();
  await page.evaluate(() => window.fly.go('buy', false));
  await page.waitForTimeout(10500);
  const left = await count();
  check('glitch repeats at 6 to 10 s while on the screen, not during a move, stops when left', early === 0 && stay === 1 && flying === stay && arrived >= stay + 1 && left === arrived, JSON.stringify({ early, stay, flying, arrived, left }));
  await page.close();
}

// Sounds: none before the first click; then START, hover, LOCK IN, a chat line and the glitch each
// play their file; the speaker button mutes them, and the choice survives a reload
{
  const ctx = await browser.newContext({ viewport: sizes.desktop });
  await ctx.addInitScript(() => {
    // Each file is told apart by its length: big click 3.7 s, hover 1.2 s, small click 0.48 s, glitch about 0.4 s
    window.played = [];
    const start = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function (...a) {
      const d = this.buffer.duration;
      window.played.push(d > 3 ? 'big' : d > 1 ? 'hover' : Math.abs(d - 0.48) < 0.01 ? 'small' : 'glitch');
      return start.apply(this, a);
    };
  });
  const page = await ctx.newPage();
  await page.goto(URL_); await ready(page); await page.waitForTimeout(500);
  // The glitch repeats on its own timer, so each step looks only at the other sounds
  const since = async (n) => (await page.evaluate(() => window.played)).slice(n).filter((s) => s !== 'glitch').join(' ');
  const count = () => page.evaluate(() => window.played.length);
  await page.hover('#lobby .next'); await page.mouse.move(5, 500);
  const before = await since(0);
  await page.click('#lobby .next'); const start = await since(0);
  await page.waitForTimeout(2500); await page.mouse.move(5, 500); await page.waitForTimeout(150);
  const glitch = (await page.evaluate(() => window.played)).includes('glitch');
  const n0 = await count(); await page.hover('.page-next'); const hover = await since(n0);
  await page.click('.page-next'); await page.waitForTimeout(1500);
  await page.hover('#position .lock .next'); await page.waitForTimeout(150);
  const n1 = await count(); await page.click('#position .lock .next'); const lock = await since(n1);
  await page.evaluate(() => window.fly.go('why-riot', false)); await page.waitForTimeout(3500);
  const n2 = await count(); await page.waitForTimeout(3200); const chat = await since(n2);
  await page.click('.sound'); const n3 = await count();
  await page.hover('.map-btn'); await page.click('.back'); await page.waitForTimeout(300);
  const muted = (await count()) - n3;
  await page.reload(); await ready(page);
  const pressed = await page.getAttribute('.sound', 'aria-pressed');
  check('sounds: silent before the first click, then START, glitch, hover, LOCK IN, chat; mute holds across a reload', before === '' && start === 'small' && glitch && hover === 'hover' && lock === 'big' && chat === 'hover' && muted === 0 && pressed === 'false', JSON.stringify({ before, start, glitch, hover, lock, chat, muted, pressed }));
  await ctx.close();
}

// Reduced motion and no JavaScript show all content as a plain page, with nothing moving
const wanted = ['Visual Portfolio', 'juhdawn#tchno', 'Position Overview', 'Department TBD', "Hi, I'm Jadon", "I don't list an exact department", 'Emerald IV', 'X. William Yang Lab', 'Jamnesia', 'Silvus Technologies', 'Golotl', 'Starborne', 'See all my past games', 'LLM Autobattler', 'UCLA Health', 'Motorola Solutions', 'Counterfactual Simulation', 'GPA 3.9', 'Readability Grid', 'Playtest Triage', 'Callout Drill', 'July 2027', 'jadonjzhu@gmail.com', 'Resume (PDF)'];
for (const [label, opts] of [['reduced motion', { reducedMotion: 'reduce' }], ['no JavaScript', { javaScriptEnabled: false }]]) {
  for (const [name, viewport] of Object.entries(sizes)) {
    const page = await (await browser.newContext({ viewport, ...opts })).newPage();
    await page.goto(URL_);
    await page.waitForTimeout(800);
    const t = await page.evaluate(() => document.querySelector('main').innerText);
    const missing = wanted.filter((w) => !t.includes(w));
    const r = await page.evaluate(() => ({
      fly: document.documentElement.classList.contains('fly'),
      sections: [...document.querySelectorAll('main > section')].filter((s) => s.getBoundingClientRect().height > 0 && getComputedStyle(s).visibility === 'visible').length,
      blurbs: [...document.querySelectorAll('.blurb')].filter((b) => b.getBoundingClientRect().height > 0 && getComputedStyle(b).visibility === 'visible').length,
      chrome: ['.where', '.map-btn'].some((s) => getComputedStyle(document.querySelector(s)).display !== 'none') || document.querySelector('.map-dialog').open,
      speaker: getComputedStyle(document.querySelector('.sound')).display !== 'none',
      overflow: document.documentElement.scrollWidth > innerWidth,
      animations: document.getAnimations ? document.getAnimations().filter((a) => a.playState === 'running').length : 0,
    }));
    check(`${label} ${name} plain page shows all content, no bar, nothing moving, speaker button only with script`, !missing.length && !r.fly && r.sections === screens.length && r.blurbs === 2 && !r.chrome && !r.overflow && !r.animations && r.speaker === (opts.javaScriptEnabled !== false), missing.join(',') || JSON.stringify(r));
    await page.close();
  }
}
await browser.close();
server.kill();
console.log(failed ? `${failed} FAILED` : 'ALL PASS');
process.exitCode = failed ? 1 : 0;
