const { chromium, CHROMIUM_PATH } = require('./helpers/playwright-env');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ executablePath: CHROMIUM_PATH });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

  const filePath = 'file://' + path.resolve(__dirname, '..', 'looksmaxxing_dictionary.html');
  await page.goto(filePath);
  await page.waitForTimeout(300);
  await page.click('#welcomeClose');
  await page.waitForTimeout(200);

  console.log('=== Term of the Day includes the actual term in its label ===');
  const totdLabel = await page.evaluate(() => document.getElementById('totdCard').getAttribute('aria-label'));
  console.log(totdLabel);

  console.log('=== Term card includes difficulty + premium status ===');
  await page.fill('#searchInput', 'Mewing');
  await page.waitForTimeout(200);
  const termLabel = await page.evaluate(() => document.querySelector('.term-top').getAttribute('aria-label'));
  console.log(termLabel);
  await page.fill('#searchInput', '');
  await page.waitForTimeout(150);

  console.log('=== Thread card includes category + pinned/locked state ===');
  await page.click('.nav-tab[data-view="forum"]');
  await page.waitForTimeout(1700);
  await page.evaluate(() => { const o = document.getElementById('popupAdOverlay'); if (o.classList.contains('show')) document.getElementById('popupAdClose').click(); });
  await page.waitForTimeout(200);
  const threadLabels = await page.evaluate(() => [...document.querySelectorAll('.thread-top')].slice(0, 2).map(t => t.getAttribute('aria-label')));
  console.log(JSON.stringify(threadLabels, null, 2));

  console.log('Errors:', errors.length ? errors : 'none');
  await browser.close();
})();
