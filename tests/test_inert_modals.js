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
  await page.click('#welcomeClose');
  await page.waitForTimeout(200);

  console.log('=== All closed overlays start inert ===');
  const inertCount = await page.evaluate(() => {
    const overlays = [...document.querySelectorAll('.paywall-overlay, .popup-ad-overlay')];
    return { total: overlays.length, inert: overlays.filter(o => o.hasAttribute('inert')).length, shown: overlays.filter(o => o.classList.contains('show')).length };
  });
  console.log(JSON.stringify(inertCount));

  console.log('=== Tabbing from the top reaches real page content quickly, not buried modal fields ===');
  const tabSequence = [];
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('Tab');
    const info = await page.evaluate(() => ({ tag: document.activeElement.tagName, id: document.activeElement.id, cls: (document.activeElement.className || '').toString().slice(0, 30) }));
    tabSequence.push(info);
  }
  console.log(JSON.stringify(tabSequence, null, 2));
  const reachedRealContent = tabSequence.some(t => t.id === 'searchInput' || t.cls.includes('term-top') || t.id === 'randomTermBtn' || t.cls.includes('index-chip') || t.cls.includes('totd-card'));
  console.log('Reached real page content within 8 tabs:', reachedRealContent);

  console.log('=== Opening a modal removes inert so its fields become reachable ===');
  await page.click('#premiumPill');
  await page.waitForTimeout(200);
  const paywallInert = await page.evaluate(() => document.getElementById('paywallOverlay').hasAttribute('inert'));
  console.log('Paywall overlay inert while open (should be false):', paywallInert);
  const canFocusInside = await page.evaluate(() => {
    document.getElementById('unlockCta').focus();
    return document.activeElement.id === 'unlockCta';
  });
  console.log('Can focus a button inside the open modal:', canFocusInside);

  console.log('=== Closing it again restores inert ===');
  await page.click('#paywallClose');
  await page.waitForTimeout(200);
  const paywallInertAfterClose = await page.evaluate(() => document.getElementById('paywallOverlay').hasAttribute('inert'));
  console.log('Paywall overlay inert again after close:', paywallInertAfterClose);

  console.log('Errors:', errors.length ? errors : 'none');
  await browser.close();
})();
