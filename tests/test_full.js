const { chromium, CHROMIUM_PATH } = require('./helpers/playwright-env');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ executablePath: CHROMIUM_PATH });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', msg => { if (msg.type() === 'error') errors.push('CONSOLE: ' + msg.text()); });

  const filePath = 'file://' + path.resolve(__dirname, '..', 'looksmaxxing_dictionary.html');
  await page.goto(filePath);
  await page.waitForTimeout(300);
  await page.evaluate(() => { const w = document.getElementById("welcomeOverlay"); if (w && w.classList.contains("show")) document.getElementById("welcomeClose").click(); });

  console.log('--- Ad Banner ---');
  const bannerVisible = await page.isVisible('#adBanner');
  console.log('Banner visible on load:', bannerVisible);

  console.log('--- Tab Navigation ---');
  await page.click('.nav-tab[data-view="forum"]');
  await page.waitForTimeout(200);
  const forumActive = await page.$eval('#view-forum', el => el.classList.contains('active'));
  console.log('Forum view active:', forumActive);

  // popup ad should appear after ~1.2s delay
  await page.waitForTimeout(1500);
  const popupShown = await page.$eval('#popupAdOverlay', el => el.classList.contains('show'));
  console.log('Popup ad shown after forum tab visit:', popupShown);
  await page.click('#popupAdClose');
  await page.waitForTimeout(200);

  console.log('--- Forum: thread list & reply ---');
  const threadCount = await page.$$eval('.thread-card', els => els.length);
  console.log('Seed thread count:', threadCount);

  await page.evaluate(() => document.querySelectorAll('.thread-card .thread-top')[2].click());
  await page.waitForTimeout(400);
  const threadOpen = await page.$eval('.thread-card.open', el => el.classList.contains('open'));
  console.log('First thread expanded:', threadOpen);

  await page.fill('.thread-card.open .reply-input', 'Testing a reply from automated check');
  await page.click('.thread-card.open .reply-send-btn');
  await page.waitForTimeout(300);
  const replyCount = await page.$$eval('.thread-card.open .reply-item', els => els.length);
  console.log('Reply items after posting:', replyCount);

  console.log('--- Forum: new thread ---');
  await page.click('#newThreadBtn');
  await page.waitForTimeout(300);
  await page.fill('#newThreadTitle', 'Automated test thread');
  await page.selectOption('#newThreadCategory', 'Skincare');
  await page.fill('#newThreadBody', 'This is a body created by the automated browser test.');
  await page.click('#newThreadSubmit');
  await page.waitForTimeout(300);
  const newThreadCount = await page.$$eval('.thread-card', els => els.length);
  console.log('Thread count after posting new thread:', newThreadCount);

  console.log('--- Courses tab ---');
  await page.click('.nav-tab[data-view="courses"]');
  await page.waitForTimeout(300);
  const courseCount = await page.$$eval('.course-card', els => els.length);
  console.log('Seed course count:', courseCount);

  console.log('--- Sell a course ---');
  await page.click('#sellCourseBtn');
  await page.waitForTimeout(300);
  await page.fill('#sellCourseTitle', 'Automated Test Course');
  await page.fill('#sellCoursePrice', '49');
  await page.waitForTimeout(200);
  const breakdownText = await page.textContent('#sellCourseBreakdown');
  console.log('Breakdown preview:', breakdownText.trim());
  await page.fill('#sellCourseDesc', 'A course created by automated test.');
  await page.click('#sellCourseSubmit');
  await page.waitForTimeout(300);
  const newCourseCount = await page.$$eval('.course-card', els => els.length);
  console.log('Course count after listing:', newCourseCount);

  console.log('--- Creator Dashboard ---');
  await page.click('#dashboardBtn');
  await page.waitForTimeout(300);
  const dashboardStatsText = await page.textContent('#dashboardStats');
  console.log('Dashboard stats present:', dashboardStatsText.includes('Total Sales Volume'));
  await page.click('#dashboardClose');
  await page.waitForTimeout(200);

  console.log('--- Remove Ads flow ---');
  await page.click('.nav-tab[data-view="dictionary"]');
  await page.waitForTimeout(200);
  await page.click('#adBannerCard');
  await page.waitForTimeout(300);
  const removeAdsShown = await page.$eval('#removeAdsOverlay', el => el.classList.contains('show'));
  console.log('Remove-ads sheet shown:', removeAdsShown);
  await page.click('#removeAdsCta');
  await page.waitForTimeout(300);
  const bannerHiddenAfter = await page.$eval('#adBanner', el => el.classList.contains('hidden'));
  console.log('Banner hidden after purchase:', bannerHiddenAfter);

  // Reload and confirm persistence
  await page.reload();
  await page.waitForTimeout(400);
  const bannerHiddenAfterReload = await page.$eval('#adBanner', el => el.classList.contains('hidden'));
  console.log('Banner still hidden after reload:', bannerHiddenAfterReload);

  await page.click('.nav-tab[data-view="courses"]');
  await page.waitForTimeout(300);
  const coursesPersisted = await page.$$eval('.course-card', els => els.length);
  console.log('Courses persisted after reload:', coursesPersisted);

  await page.click('.nav-tab[data-view="forum"]');
  await page.waitForTimeout(300);
  const threadsPersisted = await page.$$eval('.thread-card', els => els.length);
  console.log('Threads persisted after reload:', threadsPersisted);

  console.log('--- Errors ---');
  console.log(errors.length ? errors : 'none');

  await browser.close();
})();
