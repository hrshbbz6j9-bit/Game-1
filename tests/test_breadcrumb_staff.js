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

  const breadcrumbInitial = await page.textContent('#forumBreadcrumb');
  console.log('Breadcrumb initial:', breadcrumbInitial);

  // Click the Skincare category chip
  await page.evaluate(() => {
    const chips = document.querySelectorAll('#forumTabs .index-chip');
    for (const c of chips) { if (c.textContent === 'Skincare') { c.click(); break; } }
  });
  await page.waitForTimeout(200);
  const breadcrumbAfter = await page.textContent('#forumBreadcrumb');
  console.log('Breadcrumb after selecting Skincare:', breadcrumbAfter);

  // Reset to All
  await page.evaluate(() => document.querySelector('#forumTabs .index-chip').click());
  await page.waitForTimeout(200);

  const staffBadgeVisible = await page.evaluate(() => !!document.querySelector('.tier-badge.staff'));
  console.log('Staff badge rendered somewhere:', staffBadgeVisible);
  const staffBadgeText = await page.evaluate(() => {
    const el = document.querySelector('.tier-badge.staff');
    return el ? el.textContent : null;
  });
  console.log('Staff badge text:', staffBadgeText);

  const lastActivityVisible = await page.evaluate(() => !!document.querySelector('.thread-last-activity'));
  console.log('Last activity row rendered:', lastActivityVisible);
  const lastActivityText = await page.evaluate(() => {
    const el = document.querySelector('.thread-last-activity');
    return el ? el.textContent.trim() : null;
  });
  console.log('Last activity text sample:', lastActivityText);

  await page.screenshot({ path: `${SD}/breadcrumb_staff.png` });

  console.log('Errors:', errors.length ? errors : 'none');
  await browser.close();
})();
