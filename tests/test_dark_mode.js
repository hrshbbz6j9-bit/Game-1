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

  const themeAttrBefore = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  console.log('Theme attribute before toggle:', themeAttrBefore);

  await page.click('#themeToggleBtn');
  await page.waitForTimeout(300);
  const themeAttrAfter = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  console.log('Theme attribute after toggle:', themeAttrAfter);

  await page.screenshot({ path: `${SD}/dark_dictionary.png` });

  // Open a term with technique guide (locked) to check the yellow header sticker
  await page.fill('#searchInput', 'Mewing');
  await page.waitForTimeout(200);
  await page.evaluate(() => document.querySelector('.term-card .term-top').click());
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${SD}/dark_term_open.png` });

  await page.evaluate(() => document.querySelector('.nav-tab[data-view="forum"]').click());
  await page.waitForTimeout(1700);
  await page.evaluate(() => { const o = document.getElementById('popupAdOverlay'); if (o.classList.contains('show')) document.getElementById('popupAdClose').click(); });
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${SD}/dark_forum.png` });

  await page.evaluate(() => document.querySelector('.nav-tab[data-view="courses"]').click());
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${SD}/dark_courses.png` });

  // Reload and confirm persistence
  await page.reload();
  await page.waitForTimeout(300);
  const themeAfterReload = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  console.log('Theme attribute after reload:', themeAfterReload);

  // toggle back to light
  await page.click('#themeToggleBtn');
  await page.waitForTimeout(300);
  const themeBackToLight = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  console.log('Theme attribute after toggling back:', themeBackToLight);

  console.log('Errors:', errors.length ? errors : 'none');
  await browser.close();
})();
