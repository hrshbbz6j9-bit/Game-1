const { chromium, CHROMIUM_PATH } = require('./helpers/playwright-env');
const path = require('path');
const SD = path.join(__dirname, '.artifacts');
require('fs').mkdirSync(SD, { recursive: true });

(async () => {
  const browser = await chromium.launch({ executablePath: CHROMIUM_PATH });
  const page = await browser.newPage({ viewport: { width: 360, height: 640 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

  const filePath = 'file://' + path.resolve(__dirname, '..', 'looksmaxxing_dictionary.html');
  await page.goto(filePath);
  await page.waitForTimeout(300);
  await page.evaluate(() => { const w = document.getElementById("welcomeOverlay"); if (w && w.classList.contains("show")) document.getElementById("welcomeClose").click(); });

  async function checkOverflow(label) {
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    console.log(`${label}: overflow =`, overflow);
    if (overflow) await page.screenshot({ path: `${SD}/overflow_${label.replace(/[^a-z0-9]/gi, '_')}.png` });
    return overflow;
  }

  console.log('=== Courses view at 360px ===');
  await page.evaluate(() => document.querySelector('.nav-tab[data-view="courses"]').click());
  await page.waitForTimeout(300);
  await checkOverflow('courses_view');

  console.log('=== Sell Course modal at 360px ===');
  await page.click('#sellCourseBtn');
  await page.waitForTimeout(200);
  await checkOverflow('sell_course_modal');
  await page.click('#sellCourseClose');
  await page.waitForTimeout(150);

  console.log('=== Dashboard modal at 360px ===');
  await page.click('#dashboardBtn').catch(() => console.log('(no dashboardBtn, skipping)'));
  await page.waitForTimeout(200);
  await checkOverflow('dashboard_modal');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(150);

  console.log('=== Leaderboard modal at 360px ===');
  await page.evaluate(() => document.querySelector('.nav-tab[data-view="forum"]').click());
  await page.waitForTimeout(1700);
  await page.evaluate(() => { const o = document.getElementById('popupAdOverlay'); if (o.classList.contains('show')) document.getElementById('popupAdClose').click(); });
  await page.waitForTimeout(200);
  await page.click('#leaderboardBtn');
  await page.waitForTimeout(200);
  await checkOverflow('leaderboard_modal');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(150);

  console.log('=== Achievements modal at 360px ===');
  await page.click('#achievementsBtn');
  await page.waitForTimeout(200);
  await checkOverflow('achievements_modal');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(150);

  console.log('=== New Thread modal at 360px ===');
  await page.click('#newThreadBtn');
  await page.waitForTimeout(200);
  await checkOverflow('new_thread_modal');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(150);

  console.log('=== Scanner modal at 360px ===');
  await page.click('#scannerPromoBtn').catch(() => console.log('(no scannerPromoBtn by that id, trying alt)'));
  await page.waitForTimeout(200);
  await checkOverflow('scanner_modal');

  console.log('Errors:', errors.length ? errors : 'none');
  await browser.close();
})();
