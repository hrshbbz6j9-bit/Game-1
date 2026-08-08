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

  await page.click('#achievementsBtn');
  await page.waitForTimeout(300);
  const progressBefore = await page.textContent('#achievementsProgress');
  console.log('Progress before any activity:', progressBefore);
  await page.screenshot({ path: `${SD}/achievements_before.png` });
  await page.click('#achievementsClose');
  await page.waitForTimeout(200);

  // Trigger "First Steps" by posting a thread
  await page.click('#newThreadBtn');
  await page.waitForTimeout(200);
  await page.fill('#newThreadTitle', 'Testing achievements system');
  await page.selectOption('#newThreadCategory', 'Questions');
  await page.fill('#newThreadBody', 'Just checking if achievements unlock correctly.');
  await page.click('#newThreadSubmit');
  await page.waitForTimeout(300);

  // Toggle dark mode for Night Owl
  await page.evaluate(() => document.querySelector('.nav-tab[data-view="dictionary"]').click());
  await page.waitForTimeout(200);
  await page.click('#themeToggleBtn');
  await page.waitForTimeout(200);

  // Favorite 10 terms for Curator
  for (let i = 0; i < 10; i++) {
    await page.evaluate((idx) => {
      const btns = document.querySelectorAll('.fav-btn');
      if (btns[idx]) btns[idx].click();
    }, i);
    await page.waitForTimeout(30);
  }

  await page.evaluate(() => document.querySelector('.nav-tab[data-view="forum"]').click());
  await page.waitForTimeout(300);
  await page.click('#achievementsBtn');
  await page.waitForTimeout(300);
  const progressAfter = await page.textContent('#achievementsProgress');
  console.log('Progress after activity:', progressAfter);

  const unlockedNames = await page.evaluate(() =>
    [...document.querySelectorAll('.achievement-item.unlocked .achievement-name')].map(el => el.textContent)
  );
  console.log('Unlocked achievements:', unlockedNames);

  await page.screenshot({ path: `${SD}/achievements_after.png` });

  console.log('Errors:', errors.length ? errors : 'none');
  await browser.close();
})();
