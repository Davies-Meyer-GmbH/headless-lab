// Section screenshots for the discovery report.
// Serves nothing itself: run against a static file server, e.g.
//   python3 -m http.server 8123 --directory alpina-be-frontend
// Usage: node discovery/screenshots.js [base-url] [out-dir]
const fs = require('fs');
const path = require('path');
const { chromium } = require('/tmp/alpina-shots/node_modules/playwright-core');

const BASE = process.argv[2] || 'http://localhost:8123';
const OUT = process.argv[3] || 'discovery/out/shots';
const ROOT = '/home/dejan/projects/drupal/headless-lab';
const exe = fs.readdirSync(process.env.HOME + '/.cache/ms-playwright')
  .filter((d) => d.startsWith('chromium-')).sort().pop();

const VIDEO_SHOTS = {
  'hero-header': 'index-video',
  'full-width-teaser': 'index-video',
  'sub-header-anchor': 'alpinaweiss-video',
  'sub-header': 'about-video',
};

(async () => {
  const stat = JSON.parse(fs.readFileSync(path.join(ROOT, 'discovery/out/static.json'), 'utf8'));
  // block -> representative page (prefer index, else first page).
  const shots = [];
  for (const [block, entry] of Object.entries(stat.sections)) {
    const page = entry.pages.includes('index') ? 'index' : entry.pages[0];
    shots.push({ block, page, file: `${block}.png` });
  }
  for (const [block, page] of Object.entries(VIDEO_SHOTS)) {
    shots.push({ block, page, file: `${block}-video.png` });
  }
  const byPage = {};
  for (const s of shots) {
    (byPage[s.page] = byPage[s.page] || []).push(s);
  }
  fs.mkdirSync(path.join(ROOT, OUT), { recursive: true });
  const browser = await chromium.launch({
    executablePath: `${process.env.HOME}/.cache/ms-playwright/${exe}/chrome-linux64/chrome`,
  });
  for (const [pageName, list] of Object.entries(byPage)) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`${BASE}/${pageName}.html`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    // The sticky header would paint over every section shot. Capture it
    // first, then hide it for the remaining sections.
    list.sort((a, b) => (a.block === 'navigation' ? -1 : b.block === 'navigation' ? 1 : 0));
    let headerHidden = false;
    for (const s of list) {
      if (s.block !== 'navigation' && !headerHidden) {
        await page.addStyleTag({ content: 'header.navigation{display:none !important}' });
        await page.waitForTimeout(200);
        headerHidden = true;
      }
      const el = page.locator('.' + s.block).first();
      await el.scrollIntoViewIfNeeded();
      await page.waitForTimeout(250);
      const out = path.join(ROOT, OUT, s.file);
      await el.screenshot({ path: out });
      console.log(s.file, fs.statSync(out).size, 'bytes');
    }
    await page.close();
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
