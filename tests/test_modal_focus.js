const { chromium, CHROMIUM_PATH } = require('./helpers/playwright-env');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ executablePath: CHROMIUM_PATH });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

  const filePath = 'file://' + path.resolve(__dirname, '..', 'looksmaxxing_dictionary.html') + '?app=1';
  await page.goto(filePath);
  await page.waitForTimeout(300);

  console.log('=== Opening the welcome modal moves focus to its heading ===');
  const focusedTag = await page.evaluate(() => ({ tag: document.activeElement.tagName, cls: document.activeElement.className, text: document.activeElement.textContent.trim().slice(0, 40) }));
  console.log(JSON.stringify(focusedTag));

  console.log('=== Closing it restores focus to whatever was focused before (body/nothing specific here) ===');
  await page.click('#welcomeClose');
  await page.waitForTimeout(200);

  console.log('=== Opening paywall via a known button moves focus into the dialog, closing restores it to the button ===');
  await page.focus('#premiumPill');
  await page.click('#premiumPill');
  await page.waitForTimeout(200);
  const paywallFocus = await page.evaluate(() => ({ tag: document.activeElement.tagName, cls: document.activeElement.className }));
  console.log('Focus after opening paywall:', JSON.stringify(paywallFocus));
  await page.click('#paywallClose');
  await page.waitForTimeout(200);
  const afterCloseFocus = await page.evaluate(() => document.activeElement.id);
  console.log('Focus after closing (should be back on premiumPill):', afterCloseFocus);

  console.log('=== Escape also restores focus correctly ===');
  await page.click('#premiumPill');
  await page.waitForTimeout(200);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  const afterEscapeFocus = await page.evaluate(() => document.activeElement.id);
  console.log('Focus after Escape (should be back on premiumPill):', afterEscapeFocus);

  console.log('=== Scanner modal (dynamically rendered content) still gets focus correctly ===');
  await page.click('.nav-tab[data-view="dictionary"]');
  await page.waitForTimeout(200);
  await page.click('#scannerPromoBtn');
  await page.waitForTimeout(200);
  const scannerFocus = await page.evaluate(() => ({ tag: document.activeElement.tagName, cls: document.activeElement.className, text: document.activeElement.textContent.trim().slice(0, 30) }));
  console.log('Focus after opening scanner:', JSON.stringify(scannerFocus));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);

  console.log('=== Repeated open/close cycles do not accumulate stray tabindex or break subsequent opens ===');
  for (let i = 0; i < 3; i++) {
    await page.click('#premiumPill');
    await page.waitForTimeout(150);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(150);
  }
  const finalFocus = await page.evaluate(() => document.activeElement.id);
  console.log('Focus stable after repeated cycles:', finalFocus);

  console.log('Errors:', errors.length ? errors : 'none');
  await browser.close();
})();
