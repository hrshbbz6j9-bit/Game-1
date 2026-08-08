const { chromium, CHROMIUM_PATH } = require('./helpers/playwright-env');
const path = require('path');
const SD = path.join(__dirname, '.artifacts');
require('fs').mkdirSync(SD, { recursive: true });

function isoDaysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

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

  console.log('=== First visit: streak = 1, no badge shown (not meaningful yet) ===');
  const streakAfterFirst = await page.evaluate(() => localStorage.getItem('looksmax_streak'));
  console.log('Streak value after first visit:', streakAfterFirst);
  await page.evaluate(() => document.querySelector('.nav-tab[data-view="forum"]').click());
  await page.waitForTimeout(1700);
  await page.evaluate(() => { const o = document.getElementById('popupAdOverlay'); if (o.classList.contains('show')) document.getElementById('popupAdClose').click(); });
  await page.waitForTimeout(200);
  const badgeShownDay1 = await page.evaluate(() => !!document.querySelector('.streak-badge'));
  console.log('Streak badge shown on day 1:', badgeShownDay1);

  console.log('=== Simulate consecutive-day visit: streak increments to 2 ===');
  await page.evaluate((yesterday) => {
    localStorage.setItem('looksmax_last_visit_date', yesterday);
    localStorage.setItem('looksmax_streak', '1');
  }, isoDaysAgo(1));
  await page.reload();
  await page.waitForTimeout(300);
  const streakAfterConsecutive = await page.evaluate(() => localStorage.getItem('looksmax_streak'));
  console.log('Streak value after consecutive-day reload:', streakAfterConsecutive);
  await page.evaluate(() => document.querySelector('.nav-tab[data-view="forum"]').click());
  await page.waitForTimeout(1700);
  await page.evaluate(() => { const o = document.getElementById('popupAdOverlay'); if (o.classList.contains('show')) document.getElementById('popupAdClose').click(); });
  await page.waitForTimeout(200);
  const badgeText = await page.evaluate(() => document.querySelector('.streak-badge')?.textContent);
  console.log('Streak badge text:', badgeText);
  await page.screenshot({ path: `${SD}/streak_badge.png` });

  console.log('=== Revisiting same day does NOT double-increment ===');
  await page.reload();
  await page.waitForTimeout(300);
  const streakSameDay = await page.evaluate(() => localStorage.getItem('looksmax_streak'));
  console.log('Streak after reloading again same day (should still be 2):', streakSameDay);

  console.log('=== Gap of 3 days resets streak to 1 ===');
  await page.evaluate((threeDaysAgo) => {
    localStorage.setItem('looksmax_last_visit_date', threeDaysAgo);
    localStorage.setItem('looksmax_streak', '5');
  }, isoDaysAgo(3));
  await page.reload();
  await page.waitForTimeout(300);
  const streakAfterGap = await page.evaluate(() => localStorage.getItem('looksmax_streak'));
  console.log('Streak after a 3-day gap (should reset to 1):', streakAfterGap);

  console.log('=== Achievement unlocks at 7-day streak ===');
  await page.evaluate((yesterday) => {
    localStorage.setItem('looksmax_last_visit_date', yesterday);
    localStorage.setItem('looksmax_streak', '6');
  }, isoDaysAgo(1));
  await page.reload();
  await page.waitForTimeout(300);
  const streakNow = await page.evaluate(() => localStorage.getItem('looksmax_streak'));
  console.log('Streak now:', streakNow);
  await page.evaluate(() => document.querySelector('.nav-tab[data-view="forum"]').click());
  await page.waitForTimeout(1700);
  await page.evaluate(() => { const o = document.getElementById('popupAdOverlay'); if (o.classList.contains('show')) document.getElementById('popupAdClose').click(); });
  await page.click('#achievementsBtn');
  await page.waitForTimeout(300);
  const consistentUnlocked = await page.evaluate(() => {
    const items = [...document.querySelectorAll('.achievement-item')];
    const consistent = items.find(i => i.textContent.includes('Consistent'));
    return consistent ? consistent.classList.contains('unlocked') : null;
  });
  console.log('Consistent achievement unlocked at 7-day streak:', consistentUnlocked);
  await page.screenshot({ path: `${SD}/streak_achievement.png` });

  console.log('Errors:', errors.length ? errors : 'none');
  await browser.close();
})();
