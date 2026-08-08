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

  // Force dark mode
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('looksmax_theme', 'dark');
  });
  await page.waitForTimeout(200);

  await page.evaluate(() => document.querySelector('.nav-tab[data-view="forum"]').click());
  await page.waitForTimeout(1700);
  await page.evaluate(() => { const o = document.getElementById('popupAdOverlay'); if (o.classList.contains('show')) document.getElementById('popupAdClose').click(); });
  await page.waitForTimeout(200);

  // consume the initial baseline seed
  await page.waitForTimeout(200);

  console.log('=== Posting first thread in dark mode unlocks First Steps -> confetti + toast ===');
  await page.click('#newThreadBtn');
  await page.waitForTimeout(200);
  await page.fill('#newThreadTitle', 'Dark mode celebration test');
  await page.selectOption('#newThreadCategory', 'Fitness');
  await page.fill('#newThreadBody', 'Testing confetti visuals in dark mode.');
  await page.click('#newThreadSubmit');
  await page.waitForTimeout(2600);
  const toastText = await page.evaluate(() => document.getElementById('toast')?.textContent);
  const toastVisible = await page.evaluate(() => document.getElementById('toast')?.classList.contains('show'));
  console.log('Toast:', toastText, '| visible:', toastVisible);
  const canvasPresent = await page.evaluate(() => !!document.querySelector('canvas'));
  console.log('Confetti canvas present:', canvasPresent);
  await page.screenshot({ path: `${SD}/confetti_burst_dark.png` });

  console.log('Errors:', errors.length ? errors : 'none');
  await browser.close();
})();
