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

  console.log('=== WATCH THREAD ===');
  await page.evaluate(() => document.querySelector('.nav-tab[data-view="forum"]').click());
  await page.waitForTimeout(1700);
  await page.evaluate(() => { const o = document.getElementById('popupAdOverlay'); if (o.classList.contains('show')) document.getElementById('popupAdClose').click(); });
  await page.waitForTimeout(200);

  await page.evaluate(() => document.querySelectorAll('.watch-btn')[2].click());
  await page.waitForTimeout(150);
  await page.evaluate(() => document.querySelectorAll('.watch-btn')[4].click());
  await page.waitForTimeout(200);

  await page.evaluate(() => {
    const chips = document.querySelectorAll('#forumTabs .index-chip');
    for (const c of chips) { if (c.textContent.includes('Watching')) { c.click(); break; } }
  });
  await page.waitForTimeout(300);
  const watchedCount = await page.evaluate(() => document.querySelectorAll('.thread-card').length);
  console.log('Threads shown in Watching filter:', watchedCount);
  await page.screenshot({ path: `${SD}/watching_filter.png` });

  // reload and confirm persistence
  await page.reload();
  await page.waitForTimeout(300);
  await page.evaluate(() => document.querySelector('.nav-tab[data-view="forum"]').click());
  await page.waitForTimeout(1700);
  await page.evaluate(() => { const o = document.getElementById('popupAdOverlay'); if (o.classList.contains('show')) document.getElementById('popupAdClose').click(); });
  await page.waitForTimeout(200);
  await page.evaluate(() => {
    const chips = document.querySelectorAll('#forumTabs .index-chip');
    for (const c of chips) { if (c.textContent.includes('Watching')) { c.click(); break; } }
  });
  await page.waitForTimeout(300);
  const watchedAfterReload = await page.evaluate(() => document.querySelectorAll('.thread-card').length);
  console.log('Threads shown in Watching filter after reload:', watchedAfterReload);

  console.log('=== COURSE REVIEWS ===');
  await page.evaluate(() => document.querySelector('.nav-tab[data-view="courses"]').click());
  await page.waitForTimeout(300);

  const firstReviewBtn = await page.evaluate(() => document.querySelector('[data-reviews-toggle]').textContent);
  console.log('First reviews toggle label:', firstReviewBtn);

  await page.evaluate(() => document.querySelector('[data-reviews-toggle]').click());
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${SD}/course_reviews_open.png` });

  const reviewCountBefore = await page.evaluate(() => document.querySelectorAll('.review-item').length);
  console.log('Existing review items shown:', reviewCountBefore);

  // Pick 3 stars, write a review, submit
  await page.evaluate(() => document.querySelector('[data-star="3"]').click());
  await page.waitForTimeout(200);
  await page.fill('.review-input', 'Automated test review — good course overall.');
  await page.evaluate(() => document.querySelector('.review-submit-btn').click());
  await page.waitForTimeout(300);

  const reviewCountAfter = await page.evaluate(() => document.querySelectorAll('.course-reviews.open .review-item').length);
  console.log('Review items after submitting:', reviewCountAfter);

  const newRatingText = await page.evaluate(() => document.querySelector('.course-rating').textContent);
  console.log('Course rating display after new review:', newRatingText);

  await page.screenshot({ path: `${SD}/course_review_submitted.png` });

  console.log('Errors:', errors.length ? errors : 'none');
  await browser.close();
})();
