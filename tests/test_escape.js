const { chromium, CHROMIUM_PATH } = require('./helpers/playwright-env');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ executablePath: CHROMIUM_PATH });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

  const filePath = 'file://' + path.resolve(__dirname, '..', 'looksmaxxing_dictionary.html');
  await page.goto(filePath);
  await page.waitForTimeout(300);

  console.log('=== Escape closes the first-run welcome modal AND sets the onboarded flag ===');
  const welcomeShown = await page.evaluate(() => document.getElementById('welcomeOverlay').classList.contains('show'));
  console.log('Welcome shown initially:', welcomeShown);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(150);
  const welcomeHidden = await page.evaluate(() => !document.getElementById('welcomeOverlay').classList.contains('show'));
  const onboardedFlag = await page.evaluate(() => localStorage.getItem('looksmax_onboarded'));
  console.log('Welcome hidden after Escape:', welcomeHidden, '| onboarded flag set:', onboardedFlag);

  console.log('=== Escape closes the paywall modal ===');
  await page.click('#premiumPill');
  await page.waitForTimeout(200);
  const paywallShown = await page.evaluate(() => document.getElementById('paywallOverlay').classList.contains('show'));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(150);
  const paywallHidden = await page.evaluate(() => !document.getElementById('paywallOverlay').classList.contains('show'));
  console.log('Paywall shown then hidden after Escape:', paywallShown, '->', paywallHidden);

  console.log('=== Escape closes leaderboard modal ===');
  await page.evaluate(() => document.querySelector('.nav-tab[data-view="forum"]').click());
  await page.waitForTimeout(1700);
  await page.evaluate(() => { const o = document.getElementById('popupAdOverlay'); if (o.classList.contains('show')) document.getElementById('popupAdClose').click(); });
  await page.waitForTimeout(200);
  await page.click('#leaderboardBtn');
  await page.waitForTimeout(200);
  const lbShown = await page.evaluate(() => document.getElementById('leaderboardOverlay').classList.contains('show'));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(150);
  const lbHidden = await page.evaluate(() => !document.getElementById('leaderboardOverlay').classList.contains('show'));
  console.log('Leaderboard shown then hidden after Escape:', lbShown, '->', lbHidden);

  console.log('=== Escape with no modal open does nothing / no crash ===');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(100);

  console.log('Errors:', errors.length ? errors : 'none');
  await browser.close();
})();
