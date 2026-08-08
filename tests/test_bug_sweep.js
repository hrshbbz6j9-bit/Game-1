const { chromium, CHROMIUM_PATH } = require('./helpers/playwright-env');
const path = require('path');
const SD = path.join(__dirname, '.artifacts');
require('fs').mkdirSync(SD, { recursive: true });

(async () => {
  const browser = await chromium.launch({ executablePath: CHROMIUM_PATH });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', e => errors.push('PAGE ERROR: ' + e.message));
  page.on('console', msg => { if (msg.type() === 'error') errors.push('CONSOLE: ' + msg.text()); });

  const filePath = 'file://' + path.resolve(__dirname, '..', 'looksmaxxing_dictionary.html');
  await page.goto(filePath);
  await page.waitForTimeout(300);
  await page.evaluate(() => { const w = document.getElementById("welcomeOverlay"); if (w && w.classList.contains("show")) document.getElementById("welcomeClose").click(); });

  console.log('--- Dictionary: open several terms with/without technique guide ---');
  for (const q of ['Mewing', 'Canthal Tilt', 'Bone Smashing', 'Buccal Fat Removal']) {
    await page.fill('#searchInput', q);
    await page.waitForTimeout(150);
    await page.evaluate(() => document.querySelector('.term-card .term-top')?.click());
    await page.waitForTimeout(150);
  }
  await page.fill('#searchInput', '');
  await page.waitForTimeout(150);

  console.log('--- Paywall / premium flow ---');
  await page.fill('#searchInput', 'Mewing');
  await page.waitForTimeout(150);
  await page.evaluate(() => document.querySelector('.term-card .term-top')?.click());
  await page.waitForTimeout(150);
  await page.evaluate(() => document.querySelector('[data-unlock]')?.click());
  await page.waitForTimeout(200);
  const paywallShown = await page.evaluate(() => document.getElementById('paywallOverlay')?.classList.contains('show'));
  console.log('Paywall overlay reachable:', paywallShown);
  if (paywallShown) {
    await page.evaluate(() => document.getElementById('paywallClose')?.click());
    await page.waitForTimeout(150);
  }
  await page.fill('#searchInput', '');
  await page.waitForTimeout(150);

  console.log('--- Forum: visit, open every modal ---');
  await page.evaluate(() => document.querySelector('.nav-tab[data-view="forum"]').click());
  await page.waitForTimeout(1700);
  await page.evaluate(() => { const o = document.getElementById('popupAdOverlay'); if (o.classList.contains('show')) document.getElementById('popupAdClose').click(); });
  await page.waitForTimeout(200);

  for (const [openId, closeId] of [
    ['leaderboardBtn', 'leaderboardClose'],
    ['achievementsBtn', 'achievementsClose'],
    ['myActivityBtn', 'myActivityClose'],
    ['notifBtn', 'notifClose'],
    ['editProfileBtn', 'profileClose'],
  ]) {
    await page.evaluate((id) => document.getElementById(id)?.click(), openId);
    await page.waitForTimeout(200);
    const shown = await page.evaluate((id) => {
      const overlay = document.getElementById(id)?.closest ? null : null;
      return true;
    }, openId);
    await page.evaluate((id) => document.getElementById(id)?.click(), closeId);
    await page.waitForTimeout(150);
  }
  console.log('Modal open/close cycle complete');

  console.log('--- Every forum category tab ---');
  const catCount = await page.evaluate(() => document.querySelectorAll('#forumTabs .index-chip').length);
  console.log('Forum category chips found:', catCount);
  for (let i = 0; i < catCount; i++) {
    await page.evaluate((idx) => document.querySelectorAll('#forumTabs .index-chip')[idx]?.click(), i);
    await page.waitForTimeout(100);
  }

  console.log('--- Courses: open all reviews, sell course modal, dashboard ---');
  await page.evaluate(() => document.querySelector('.nav-tab[data-view="courses"]').click());
  await page.waitForTimeout(300);
  await page.evaluate(() => document.querySelectorAll('[data-reviews-toggle]').forEach(b => b.click()));
  await page.waitForTimeout(200);
  await page.click('#sellCourseBtn');
  await page.waitForTimeout(200);
  await page.fill('#sellCoursePrice', '99');
  await page.waitForTimeout(150);
  await page.click('#sellCourseClose');
  await page.waitForTimeout(150);
  await page.click('#dashboardBtn');
  await page.waitForTimeout(200);
  const dashboardShown = await page.evaluate(() => document.getElementById('dashboardOverlay')?.classList.contains('show'));
  console.log('Dashboard reachable:', dashboardShown);
  await page.evaluate(() => document.getElementById('dashboardClose')?.click());

  console.log('--- Dark mode toggle from Courses tab (regression check) ---');
  await page.evaluate(() => document.querySelector('#themeToggleBtn').click());
  await page.waitForTimeout(200);
  const stillOnCourses = await page.evaluate(() => document.getElementById('view-courses').classList.contains('active'));
  console.log('Still on Courses view after toggling theme from Courses tab:', stillOnCourses);
  await page.evaluate(() => document.querySelector('.nav-tab[data-view="dictionary"]').click());
  await page.waitForTimeout(200);
  await page.fill('#searchInput', 'Mewing');
  await page.waitForTimeout(150);
  await page.evaluate(() => document.querySelector('.term-card .term-top')?.click());
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${SD}/sweep_dark_dictionary.png` });

  await page.evaluate(() => document.querySelector('.nav-tab[data-view="forum"]').click());
  await page.waitForTimeout(300);
  await page.click('#leaderboardBtn');
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${SD}/sweep_dark_leaderboard.png` });
  await page.click('#leaderboardClose');

  await page.evaluate(() => document.querySelector('.nav-tab[data-view="courses"]').click());
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${SD}/sweep_dark_courses.png` });

  console.log('=== ALL ERRORS COLLECTED ===');
  console.log(errors.length ? errors : 'none');
  await browser.close();
})();
