const { chromium, CHROMIUM_PATH } = require('./helpers/playwright-env');
const path = require('path');
const SD = path.join(__dirname, '.artifacts');
require('fs').mkdirSync(SD, { recursive: true });

(async () => {
  const browser = await chromium.launch({ executablePath: CHROMIUM_PATH });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

  const filePath = 'file://' + path.resolve(__dirname, '..', 'looksmaxxing_dictionary.html');
  await page.goto(filePath);
  await page.waitForTimeout(300);
  await page.evaluate(() => { const w = document.getElementById("welcomeOverlay"); if (w && w.classList.contains("show")) document.getElementById("welcomeClose").click(); });
  await page.click('#themeToggleBtn');
  await page.waitForTimeout(200);

  await page.evaluate(() => document.querySelector('.nav-tab[data-view="forum"]').click());
  await page.waitForTimeout(1700);
  await page.evaluate(() => { const o = document.getElementById('popupAdOverlay'); if (o.classList.contains('show')) document.getElementById('popupAdClose').click(); });
  await page.waitForTimeout(200);

  await page.evaluate(() => document.querySelector('.thread-card .thread-top').click());
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${SD}/dark_locked_thread.png` });

  await page.evaluate(() => document.querySelectorAll('.thread-card .thread-top')[2].click());
  await page.waitForTimeout(300);
  await page.evaluate(() => document.querySelector('.thread-card.open .quote-btn').click());
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${SD}/dark_quote_preview.png` });

  console.log('Errors:', errors.length ? errors : 'none');
  await browser.close();
})();
