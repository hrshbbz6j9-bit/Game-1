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
  await page.waitForTimeout(1600);
  await page.evaluate(() => { const o = document.getElementById('popupAdOverlay'); if (o.classList.contains('show')) document.getElementById('popupAdClose').click(); });
  await page.waitForTimeout(200);

  await page.screenshot({ path: `${SD}/alive_1_forum_default.png` });
  console.log('1. Default forum view (avatars + newest sort) captured');

  // Read likes on first thread before liking
  const before = await page.evaluate(() => document.querySelector('.like-btn').textContent.trim());
  console.log('Like count before click:', before);
  await page.evaluate(() => document.querySelector('.like-btn').click());
  await page.waitForTimeout(200);
  const after = await page.evaluate(() => document.querySelector('.like-btn').textContent.trim());
  const likedClass = await page.evaluate(() => document.querySelector('.like-btn').classList.contains('liked'));
  console.log('Like count after click:', after, '| liked class applied:', likedClass);

  // Unlike to confirm toggle works
  await page.evaluate(() => document.querySelector('.like-btn').click());
  await page.waitForTimeout(200);
  const afterUnlike = await page.evaluate(() => document.querySelector('.like-btn').textContent.trim());
  console.log('Like count after un-click:', afterUnlike);

  // Like a specific thread heavily to push it to top of "Top" sort
  await page.evaluate(() => {
    const cards = document.querySelectorAll('.thread-card');
    const last = cards[cards.length - 1]; // an older/lower-liked thread
    const btn = last.querySelector('.like-btn');
    btn.click();
  });
  await page.waitForTimeout(200);

  await page.evaluate(() => document.querySelector('.sort-btn[data-sort="top"]').click());
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${SD}/alive_2_top_sort.png` });
  console.log('2. Top-sorted view captured');

  const topThreadLikes = await page.evaluate(() => document.querySelector('.thread-card .like-btn').textContent.trim());
  console.log('Top thread by likes now shows:', topThreadLikes);

  // Switch to courses to see bestseller badge
  await page.evaluate(() => document.querySelector('.nav-tab[data-view="courses"]').click());
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${SD}/alive_3_bestseller.png` });
  console.log('3. Courses view with bestseller badge captured');

  const bestsellerVisible = await page.evaluate(() => !!document.querySelector('.bestseller-tag'));
  console.log('Bestseller tag present:', bestsellerVisible);

  console.log('Errors:', errors.length ? errors : 'none');
  await browser.close();
})();
