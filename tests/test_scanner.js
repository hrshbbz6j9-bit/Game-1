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

  console.log('=== Web version (no ?app param): scanner promo hidden ===');
  const webFilePath = 'file://' + path.resolve(__dirname, '..', 'looksmaxxing_dictionary.html');
  await page.goto(webFilePath);
  await page.waitForTimeout(300);
  await page.evaluate(() => { const w = document.getElementById("welcomeOverlay"); if (w && w.classList.contains("show")) document.getElementById("welcomeClose").click(); });
  const promoHiddenOnWeb = await page.evaluate(() => {
    const el = document.getElementById('scannerPromo');
    return !el || getComputedStyle(el).display === 'none';
  });
  console.log('Scanner promo hidden on plain web load:', promoHiddenOnWeb);
  await page.screenshot({ path: `${SD}/scanner_hidden_web.png` });

  console.log('=== App version (?app=1): scanner promo visible ===');
  const appFilePath = webFilePath + '?app=1';
  await page.goto(appFilePath);
  await page.waitForTimeout(300);
  await page.evaluate(() => { const w = document.getElementById("welcomeOverlay"); if (w && w.classList.contains("show")) document.getElementById("welcomeClose").click(); });
  const promoVisibleInApp = await page.evaluate(() => {
    const el = document.getElementById('scannerPromo');
    return el && getComputedStyle(el).display !== 'none';
  });
  console.log('Scanner promo visible with ?app=1:', promoVisibleInApp);
  await page.screenshot({ path: `${SD}/scanner_promo_visible.png` });

  console.log('=== App mode persists via localStorage after navigating without the param ===');
  await page.goto(webFilePath);
  await page.waitForTimeout(300);
  await page.evaluate(() => { const w = document.getElementById("welcomeOverlay"); if (w && w.classList.contains("show")) document.getElementById("welcomeClose").click(); });
  const promoStillVisiblePersisted = await page.evaluate(() => {
    const el = document.getElementById('scannerPromo');
    return el && getComputedStyle(el).display !== 'none';
  });
  console.log('Scanner promo still visible after revisiting without ?app param (persisted):', promoStillVisiblePersisted);

  console.log('=== Open scanner -> paywall shown first ===');
  await page.click('#scannerPromoBtn');
  await page.waitForTimeout(200);
  const paywallShown = await page.evaluate(() => document.getElementById('scannerOverlay')?.classList.contains('show'));
  const paywallTitle = await page.evaluate(() => document.querySelector('#scannerBody .paywall-title')?.textContent);
  console.log('Scanner overlay shown:', paywallShown, '| title:', paywallTitle);
  await page.screenshot({ path: `${SD}/scanner_paywall.png` });

  console.log('=== Unlock -> upload state ===');
  await page.click('#scannerUnlockCta');
  await page.waitForTimeout(200);
  const uploadStateShown = await page.evaluate(() => !!document.getElementById('scannerFileInput'));
  console.log('Upload input shown after unlock:', uploadStateShown);
  await page.screenshot({ path: `${SD}/scanner_upload.png` });

  console.log('=== Upload photo -> analyzing -> result ===');
  await page.setInputFiles('#scannerFileInput', path.join(__dirname, 'fixtures', 'test_photo.png'));
  await page.waitForTimeout(300);
  const analyzingShown = await page.evaluate(() => document.querySelector('#scannerBody .scanner-analyzing-bar') ? true : false);
  console.log('Analyzing state shown:', analyzingShown);
  await page.screenshot({ path: `${SD}/scanner_analyzing.png` });

  await page.waitForTimeout(2200);
  const honestyNoteShown = await page.evaluate(() => document.querySelector('#scannerBody .scanner-honesty-note')?.textContent);
  console.log('Honesty disclaimer shown:', !!honestyNoteShown);
  console.log('Honesty note text:', honestyNoteShown);
  const noFabricatedScore = await page.evaluate(() => {
    const text = document.getElementById('scannerBody').textContent;
    return !/\d(\.\d)?\s*\/\s*10|\d{1,3}\s*%\s*(attractive|score|rating)/i.test(text);
  });
  console.log('No fabricated numeric score/rating present in result:', noFabricatedScore);
  await page.screenshot({ path: `${SD}/scanner_result.png` });

  console.log('=== Tip chip jumps to real dictionary term ===');
  await page.evaluate(() => document.querySelector('[data-jump-term]').click());
  await page.waitForTimeout(400);
  const scannerClosedAfterJump = await page.evaluate(() => !document.getElementById('scannerOverlay').classList.contains('show'));
  const termOpened = await page.evaluate(() => !!document.querySelector('.term-card.open'));
  console.log('Scanner closed after tip click:', scannerClosedAfterJump, '| a term opened:', termOpened);

  console.log('=== Unlock status persists across reload ===');
  await page.reload();
  await page.waitForTimeout(300);
  await page.click('#scannerPromoBtn');
  await page.waitForTimeout(200);
  const stillUnlockedAfterReload = await page.evaluate(() => !!document.getElementById('scannerFileInput'));
  console.log('Scanner still unlocked after reload (skips paywall):', stillUnlockedAfterReload);

  console.log('Errors:', errors.length ? errors : 'none');
  await browser.close();
})();
