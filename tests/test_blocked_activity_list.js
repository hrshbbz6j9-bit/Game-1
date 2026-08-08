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
  await page.click('#welcomeClose');
  await page.waitForTimeout(200);

  await page.click('.nav-tab[data-view="forum"]');
  await page.waitForTimeout(1700);
  await page.evaluate(() => { const o = document.getElementById('popupAdOverlay'); if (o.classList.contains('show')) document.getElementById('popupAdClose').click(); });
  await page.waitForTimeout(200);

  console.log('=== My Activity Blocked section starts empty ===');
  await page.click('#myActivityBtn').catch(async () => {
    // fallback selector if id differs
    await page.click('text=MY ACTIVITY');
  });
  await page.waitForTimeout(200);
  const emptyLabel = await page.evaluate(() => document.getElementById('activityBlockedLabel')?.textContent);
  const emptyText = await page.evaluate(() => document.getElementById('activityBlockedList')?.textContent.trim());
  console.log('Blocked label (empty state):', emptyLabel, '| list text:', emptyText);
  await page.click('#myActivityClose');
  await page.waitForTimeout(200);

  console.log('=== Block someone, then check My Activity lists them with an Unblock button ===');
  const author = await page.evaluate(() => {
    const el = document.querySelector('#threadList [data-author]');
    return el ? el.dataset.author : null;
  });
  await page.evaluate((name) => {
    const el = [...document.querySelectorAll('#threadList [data-author]')].find(e => e.dataset.author === name);
    if (el) el.click();
  }, author);
  await page.waitForTimeout(300);
  await page.click('#memberBlockBtn');
  await page.waitForTimeout(200);
  await page.click('#memberClose');
  await page.waitForTimeout(200);

  await page.click('#myActivityBtn').catch(async () => { await page.click('text=MY ACTIVITY'); });
  await page.waitForTimeout(200);
  const filledLabel = await page.evaluate(() => document.getElementById('activityBlockedLabel')?.textContent);
  const rowText = await page.evaluate(() => document.getElementById('activityBlockedList')?.textContent.trim());
  console.log('Blocked label (after blocking):', filledLabel, '| row text:', rowText);
  await page.screenshot({ path: `${SD}/modern/34_activity_blocked_list.png` });

  console.log('=== Unblocking from My Activity list removes them and updates the forum ===');
  await page.click('[data-unblock-activity]');
  await page.waitForTimeout(200);
  const afterUnblockLabel = await page.evaluate(() => document.getElementById('activityBlockedLabel')?.textContent);
  const afterUnblockText = await page.evaluate(() => document.getElementById('activityBlockedList')?.textContent.trim());
  console.log('Blocked label (after unblock):', afterUnblockLabel, '| list text:', afterUnblockText);
  const storedBlocked = await page.evaluate(() => JSON.parse(localStorage.getItem('looksmax_blocked') || '[]'));
  console.log('Stored blocked after unblock:', storedBlocked);
  await page.click('#myActivityClose');
  await page.waitForTimeout(200);
  const threadCardBack = await page.evaluate((name) => {
    return [...document.querySelectorAll('#threadList .thread-card')].some(c => c.querySelector(`[data-author="${name}"]`));
  }, author);
  console.log('Full thread card visible again in forum after unblock from My Activity:', threadCardBack);

  console.log('Errors:', errors.length ? errors : 'none');
  await browser.close();
})();
