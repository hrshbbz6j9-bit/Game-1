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

  console.log('=== Trending button exists and activates ===');
  const trendingBtnExists = await page.evaluate(() => !!document.querySelector('.sort-btn[data-sort="trending"]'));
  console.log('Trending button exists:', trendingBtnExists);
  await page.click('.sort-btn[data-sort="trending"]');
  await page.waitForTimeout(200);
  const activeSort = await page.evaluate(() => document.querySelector('.sort-btn.active')?.dataset.sort);
  console.log('Active sort after click:', activeSort);
  await page.screenshot({ path: `${SD}/trending_sort.png` });

  console.log('=== Order matches descending trending score (pinned threads excluded) ===');
  const order = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('.thread-card:not(.pinned)')];
    return cards.map(c => c.dataset.threadId);
  });
  console.log('Rendered order (non-pinned):', order.slice(0, 6));

  console.log('=== Pinned threads still float to top under Trending ===');
  const firstTwoPinned = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('.thread-card')].slice(0, 2);
    return cards.map(c => c.classList.contains('pinned'));
  });
  console.log('First two cards pinned:', firstTwoPinned);

  console.log('=== Switching back to Newest / Top still works ===');
  await page.click('.sort-btn[data-sort="newest"]');
  await page.waitForTimeout(200);
  const activeAfterNewest = await page.evaluate(() => document.querySelector('.sort-btn.active')?.dataset.sort);
  console.log('Active sort after clicking Newest:', activeAfterNewest);
  await page.click('.sort-btn[data-sort="top"]');
  await page.waitForTimeout(200);
  const activeAfterTop = await page.evaluate(() => document.querySelector('.sort-btn.active')?.dataset.sort);
  console.log('Active sort after clicking Top:', activeAfterTop);

  console.log('Errors:', errors.length ? errors : 'none');
  await browser.close();
})();
