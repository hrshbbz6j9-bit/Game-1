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

  console.log('=== First-ever visit: welcome modal shows automatically ===');
  await page.goto(filePath);
  await page.waitForTimeout(300);
  const shownOnFirstVisit = await page.evaluate(() => document.getElementById('welcomeOverlay').classList.contains('show'));
  console.log('Welcome modal shown on first visit:', shownOnFirstVisit);
  await page.screenshot({ path: `${SD}/welcome_modal.png` });

  console.log('=== Clicking "Let\'s Go" dismisses it and sets the onboarded flag ===');
  await page.click('#welcomeCta');
  await page.waitForTimeout(300);
  const hiddenAfterCta = await page.evaluate(() => !document.getElementById('welcomeOverlay').classList.contains('show'));
  const onboardedFlag = await page.evaluate(() => localStorage.getItem('looksmax_onboarded'));
  console.log('Hidden after CTA click:', hiddenAfterCta, '| onboarded flag set:', onboardedFlag);

  console.log('=== Reloading does NOT show it again ===');
  await page.reload();
  await page.waitForTimeout(300);
  const shownAfterReload = await page.evaluate(() => document.getElementById('welcomeOverlay').classList.contains('show'));
  console.log('Welcome modal shown after reload (should be false):', shownAfterReload);

  console.log('=== Fresh localStorage + close via X button also sets the flag ===');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForTimeout(300);
  await page.click('#welcomeClose');
  await page.waitForTimeout(300);
  const onboardedAfterX = await page.evaluate(() => localStorage.getItem('looksmax_onboarded'));
  console.log('Onboarded flag set after closing via X:', onboardedAfterX);

  console.log('=== Fresh localStorage + click outside sheet also dismisses ===');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForTimeout(300);
  await page.click('#welcomeOverlay', { position: { x: 10, y: 10 } });
  await page.waitForTimeout(300);
  const hiddenAfterBackdropClick = await page.evaluate(() => !document.getElementById('welcomeOverlay').classList.contains('show'));
  console.log('Hidden after clicking backdrop:', hiddenAfterBackdropClick);

  console.log('Errors:', errors.length ? errors : 'none');
  await browser.close();
})();
