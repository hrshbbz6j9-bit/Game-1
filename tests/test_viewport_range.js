const { chromium, CHROMIUM_PATH } = require('./helpers/playwright-env');
const path = require('path');
const SD = path.join(__dirname, '.artifacts');
require('fs').mkdirSync(SD, { recursive: true });

const viewports = [
  { name: 'small_360x640', width: 360, height: 640 },
  { name: 'iphone_se_375x667', width: 375, height: 667 },
  { name: 'large_428x926', width: 428, height: 926 },
];

(async () => {
  const browser = await chromium.launch({ executablePath: CHROMIUM_PATH });
  const filePath = 'file://' + path.resolve(__dirname, '..', 'looksmaxxing_dictionary.html');

  for (const vp of viewports) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

    await page.goto(filePath);
    await page.waitForTimeout(300);
    await page.evaluate(() => { const w = document.getElementById("welcomeOverlay"); if (w && w.classList.contains("show")) document.getElementById("welcomeClose").click(); });

    console.log(`=== ${vp.name} (${vp.width}x${vp.height}) ===`);
    const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    console.log('Horizontal overflow (should be false):', hasHorizontalOverflow);
    await page.screenshot({ path: `${SD}/viewport_${vp.name}.png` });

    await page.evaluate(() => document.querySelector('.nav-tab[data-view="forum"]').click());
    await page.waitForTimeout(1700);
    await page.evaluate(() => { const o = document.getElementById('popupAdOverlay'); if (o.classList.contains('show')) document.getElementById('popupAdClose').click(); });
    await page.waitForTimeout(200);
    const forumOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    console.log('Forum view horizontal overflow (should be false):', forumOverflow);
    await page.screenshot({ path: `${SD}/viewport_${vp.name}_forum.png` });

    console.log('Errors:', errors.length ? errors : 'none');
    await page.close();
  }
  await browser.close();
})();
