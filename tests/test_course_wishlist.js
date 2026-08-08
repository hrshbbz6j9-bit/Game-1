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

  await page.evaluate(() => document.querySelector('.nav-tab[data-view="courses"]').click());
  await page.waitForTimeout(300);

  console.log('=== Wishlist starts empty ===');
  const countInitial = await page.textContent('#wishlistCount');
  console.log('Initial wishlist count:', countInitial);

  console.log('=== Save two courses to wishlist ===');
  await page.evaluate(() => document.querySelectorAll('[data-wishlist]')[0].click());
  await page.waitForTimeout(150);
  await page.evaluate(() => document.querySelectorAll('[data-wishlist]')[1].click());
  await page.waitForTimeout(150);
  const countAfterSave = await page.textContent('#wishlistCount');
  console.log('Count after saving 2:', countAfterSave);
  const activeStars = await page.evaluate(() => document.querySelectorAll('.wishlist-btn.active').length);
  console.log('Active wishlist stars shown:', activeStars);
  await page.screenshot({ path: `${SD}/course_wishlist_saved.png` });

  console.log('=== Toggle wishlist-only filter ===');
  await page.click('#wishlistToggleBtn');
  await page.waitForTimeout(200);
  const cardsInWishlistView = await page.evaluate(() => document.querySelectorAll('.course-card').length);
  console.log('Courses shown in wishlist-only view (expect 2):', cardsInWishlistView);
  await page.screenshot({ path: `${SD}/course_wishlist_filtered.png` });

  console.log('=== Persists across reload ===');
  await page.reload();
  await page.waitForTimeout(300);
  await page.evaluate(() => document.querySelector('.nav-tab[data-view="courses"]').click());
  await page.waitForTimeout(300);
  const countAfterReload = await page.textContent('#wishlistCount');
  console.log('Count after reload:', countAfterReload);

  console.log('=== Remove one, empty state when all removed ===');
  await page.click('#wishlistToggleBtn');
  await page.waitForTimeout(200);
  while (await page.evaluate(() => !!document.querySelector('[data-wishlist].active'))) {
    await page.evaluate(() => document.querySelector('[data-wishlist].active').click());
    await page.waitForTimeout(150);
  }
  const countAfterRemoveAll = await page.textContent('#wishlistCount');
  console.log('Count after removing all:', countAfterRemoveAll);
  const emptyStateShown = await page.evaluate(() => document.querySelector('.course-grid .empty-state')?.textContent.includes('No courses saved'));
  console.log('Empty state shown for empty wishlist view:', emptyStateShown);
  await page.screenshot({ path: `${SD}/course_wishlist_empty.png` });

  console.log('Errors:', errors.length ? errors : 'none');
  await browser.close();
})();
