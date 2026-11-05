// Screenshots every screen at both sizes: both agent-select blurbs, the map overlay, the timeline
// at its start, middle and end, and a frame halfway into each move.
// Usage: node test/shots.mjs [outDir] [port]
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { homedir } from 'node:os';

const out = process.argv[2] || 'docs/screenshots';
const port = process.argv[3] || '38123';
mkdirSync(out, { recursive: true });
const server = spawn('node', ['scripts/serve.mjs'], { env: { ...process.env, PORT: port }, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 400));
const browser = await chromium.launch({ executablePath: `${homedir()}/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome` });
const sizes = { desktop: { width: 1440, height: 900 }, phone: { width: 390, height: 844 } };
const screens = ['lobby', 'position', 'buy', 'why-riot', 'timeline', 'projects', 'p-readability-grid', 'p-playtest-triage', 'p-callout-drill', 'close'];
for (const [name, viewport] of Object.entries(sizes)) {
  const page = await (await browser.newContext({ viewport })).newPage();
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log(name, m.type(), m.text()); });
  page.on('pageerror', (e) => console.log(name, 'pageerror', e.message));
  await page.goto(`http://localhost:${port}/`);
  await page.waitForLoadState('load'); await page.waitForTimeout(2000);
  const fly = await page.evaluate(() => document.documentElement.classList.contains('ready'));
  console.log(name, 'fly mode:', fly);
  if (!fly) continue;
  let n = 0;
  const shot = async (label, wait = 300) => {
    await page.waitForTimeout(wait);
    await page.screenshot({ path: `${out}/${name}-${String(n++).padStart(2, '0')}-${label}.png` });
  };
  const cut = (id) => page.evaluate((id) => window.fly.go(id, false), id);
  for (let i = 0; i < screens.length; i++) {
    const id = screens[i];
    if (i) { // halfway into the move from the previous screen
      await cut(screens[i - 1]);
      await page.waitForTimeout(100); // let the timeline's scroll event run before the time is set
      await page.evaluate((i) => { const f = window.fly; const a = i - 1 === 4 ? f.leave : f.arrive[i - 1]; f.tl.time((a + f.arrive[i]) / 2); }, i);
      await shot(`to-${id}`, 200);
    }
    await cut(id);
    if (id === 'position') {
      await shot('position-1', 1600);
      await page.click('.page-next');
      await shot('position-2', 1600);
    } else if (id === 'buy') {
      await shot('buy', 1200);
      await page.hover('#buy .chip[href="#why-riot"]');
      await shot('buy-preview', 400);
      await page.mouse.move(5, 500);
    } else if (id === 'why-riot') {
      await shot('why-riot-typing', 4500); // line 1 shown, line 2 being typed
      await shot('why-riot', 9000); // all four lines (each follows 3 s of typing)
    } else if (id === 'timeline') {
      await shot('timeline-start', 800);
      for (const [label, k] of [['middle', 4], ['end', 9]]) {
        await page.evaluate((k) => { const c = document.querySelectorAll('#timeline .card')[k]; document.getElementById('timeline').scrollTop = c.offsetTop + c.offsetHeight / 2 - innerHeight / 2; }, k);
        await shot(`timeline-${label}`, 800);
      }
    } else if (id === 'close') {
      await shot('close', 3200);
      await page.hover('#close .chip[href="#why-riot"]');
      await shot('close-preview', 400);
      await page.mouse.move(5, 500);
    } else {
      await shot(id, 900);
    }
  }
  await cut('projects');
  await page.click('.map-btn');
  await shot('overlay', 1000);
  await page.focus('.map-dialog .chip[href="#t-yanglab"]');
  await shot('overlay-preview', 400);
  await page.close();
}
await browser.close();
server.kill();
