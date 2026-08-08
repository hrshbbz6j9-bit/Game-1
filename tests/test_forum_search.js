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

  await page.evaluate(() => document.querySelector('.nav-tab[data-view="forum"]').click());
  await page.waitForTimeout(1700);
  await page.evaluate(() => { const o = document.getElementById('popupAdOverlay'); if (o.classList.contains('show')) document.getElementById('popupAdClose').click(); });
  await page.waitForTimeout(200);

  const totalBefore = await page.evaluate(() => document.querySelectorAll('.thread-card').length);
  console.log('Threads visible before search:', totalBefore);

  await page.fill('#forumSearchInput', 'rosacea');
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${SD}/search_rosacea.png` });
  const rosaceaCount = await page.evaluate(() => document.querySelectorAll('.thread-card').length);
  console.log('Threads matching "rosacea":', rosaceaCount);

  const clearVisible = await page.evaluate(() => document.getElementById('forumClearBtn').classList.contains('show'));
  console.log('Clear button visible:', clearVisible);

  await page.click('#forumClearBtn');
  await page.waitForTimeout(200);
  const totalAfterClear = await page.evaluate(() => document.querySelectorAll('.thread-card').length);
  console.log('Threads visible after clearing search:', totalAfterClear);

  await page.fill('#forumSearchInput', 'zzzznonexistentxyz');
  await page.waitForTimeout(200);
  const emptyStateText = await page.evaluate(() => document.getElementById('threadList').textContent);
  console.log('Empty state shown for nonsense query:', emptyStateText.includes('No threads match'));
  await page.screenshot({ path: `${SD}/search_empty.png` });

  console.log('Errors:', errors.length ? errors : 'none');
  await browser.close();
})();
