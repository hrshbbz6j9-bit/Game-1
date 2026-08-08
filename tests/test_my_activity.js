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

  // Empty state check first
  await page.click('#myActivityBtn');
  await page.waitForTimeout(300);
  const emptyLabels = await page.evaluate(() => ({
    threads: document.getElementById('activityThreadsLabel').textContent,
    replies: document.getElementById('activityRepliesLabel').textContent,
    reviews: document.getElementById('activityReviewsLabel').textContent
  }));
  console.log('Labels before any activity:', emptyLabels);
  await page.screenshot({ path: `${SD}/my_activity_empty.png` });
  await page.click('#myActivityClose');
  await page.waitForTimeout(200);

  // Post a thread
  await page.click('#newThreadBtn');
  await page.waitForTimeout(200);
  await page.fill('#newThreadTitle', 'My activity test thread');
  await page.selectOption('#newThreadCategory', 'Fitness');
  await page.fill('#newThreadBody', 'Checking that this shows up in My Activity.');
  await page.click('#newThreadSubmit');
  await page.waitForTimeout(300);

  // Reply to a different (seed) thread
  await page.evaluate(() => document.querySelectorAll('.thread-card .thread-top')[2].click());
  await page.waitForTimeout(200);
  await page.fill('.thread-card.open .reply-input', 'Replying for the My Activity test.');
  await page.evaluate(() => document.querySelector('.thread-card.open .reply-send-btn').click());
  await page.waitForTimeout(300);

  // Leave a course review
  await page.evaluate(() => document.querySelector('.nav-tab[data-view="courses"]').click());
  await page.waitForTimeout(300);
  await page.evaluate(() => document.querySelector('[data-reviews-toggle]').click());
  await page.waitForTimeout(300);
  await page.evaluate(() => document.querySelector('[data-star="4"]').click());
  await page.fill('.review-input', 'Great course, learned a lot.');
  await page.evaluate(() => document.querySelector('.review-submit-btn').click());
  await page.waitForTimeout(300);

  // Now open My Activity again
  await page.evaluate(() => document.querySelector('.nav-tab[data-view="forum"]').click());
  await page.waitForTimeout(300);
  await page.click('#myActivityBtn');
  await page.waitForTimeout(300);
  const labelsAfter = await page.evaluate(() => ({
    threads: document.getElementById('activityThreadsLabel').textContent,
    replies: document.getElementById('activityRepliesLabel').textContent,
    reviews: document.getElementById('activityReviewsLabel').textContent
  }));
  console.log('Labels after activity:', labelsAfter);
  await page.screenshot({ path: `${SD}/my_activity_filled.png` });

  // Click the thread row to jump
  await page.evaluate(() => document.querySelector('[data-jump-thread]').click());
  await page.waitForTimeout(500);
  const forumActiveAfterJump = await page.evaluate(() => document.getElementById('view-forum').classList.contains('active'));
  const jumpedThreadOpen = await page.evaluate(() => {
    const id = document.querySelector('[data-jump-thread]')?.dataset?.jumpThread;
    return !!document.querySelector('.thread-card.open');
  });
  console.log('Forum active after jump:', forumActiveAfterJump, '| some thread open:', jumpedThreadOpen);

  console.log('Errors:', errors.length ? errors : 'none');
  await browser.close();
})();
