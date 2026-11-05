// Copies the photos and makes web copies of the game art, from docs/redesign/.
// Run once after changing those images: node scripts/prep-images.mjs
import { readFileSync, writeFileSync, copyFileSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { chromium } from 'playwright';

const SRC = '../../docs/redesign/';
mkdirSync('assets/me', { recursive: true });
mkdirSync('assets/games', { recursive: true });

// Photos keep their size and format: both are small already.
copyFileSync(SRC + 'jadonzhu-body-no-bg.png', 'assets/me/body.png');
copyFileSync(SRC + 'jadonzhu-no-bg.png', 'assets/me/face.png');

// Games: name, long side in px (0 keeps the size), webp quality.
const games = [['golotl', 1200, 0.85], ['jamnesia', 1200, 0.85], ['starborne', 0, 0.9]];

const browser = await chromium.launch({
  executablePath: `${homedir()}/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome`,
});
const page = await browser.newPage();
for (const [name, long, quality] of games) {
  const url = 'data:image/png;base64,' + readFileSync(SRC + name + '.png').toString('base64');
  // Draws the image on a canvas at the new size, then encodes it as webp (alpha kept).
  const out = await page.evaluate(async ([url, long, quality]) => {
    const img = new Image();
    img.src = url;
    await img.decode();
    const k = long ? long / Math.max(img.width, img.height) : 1;
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * k);
    c.height = Math.round(img.height * k);
    const g = c.getContext('2d');
    g.imageSmoothingQuality = 'high';
    g.drawImage(img, 0, 0, c.width, c.height);
    const blob = await new Promise((done) => c.toBlob(done, 'image/webp', quality));
    return [...new Uint8Array(await blob.arrayBuffer())];
  }, [url, long, quality]);
  writeFileSync(`assets/games/${name}.webp`, Buffer.from(out));
  console.log(`assets/games/${name}.webp`, out.length, 'bytes');
}
await browser.close();
