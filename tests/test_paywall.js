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
  await page.evaluate(() => { const w = document.getElementById("welcomeOverlay"); if (w && w.classList.contains("show")) document.getElementById("welcomeClose").click(); });

  // Search for a premium term
  await page.fill('#searchInput', 'Mewing');
  await page.waitForTimeout(200);
  const resultCount = await page.textContent('#resultCount');
  console.log('Search result count:', resultCount);

  // Open the Mewing card
  await page.click('.term-card .term-top');
  await page.waitForTimeout(400);

  const hasLocked = await page.$('.technique-locked') !== null;
  console.log('Technique locked visible:', hasLocked);

  const proBadge = await page.$('.badge.pro') !== null;
  console.log('PRO badge visible:', proBadge);

  // Click unlock button -> should open paywall
  await page.click('[data-unlock]');
  await page.waitForTimeout(400);
  const paywallShown = await page.$eval('#paywallOverlay', el => el.classList.contains('show'));
  console.log('Paywall shown after unlock click:', paywallShown);

  // Click the CTA to unlock premium
  await page.click('#unlockCta');
  await page.waitForTimeout(400);
  const paywallClosed = await page.$eval('#paywallOverlay', el => !el.classList.contains('show'));
  console.log('Paywall closed after CTA:', paywallClosed);

  const pillText = await page.textContent('#premiumPill');
  console.log('Premium pill text:', pillText.trim());

  const toastText = await page.textContent('#toast');
  console.log('Toast text:', toastText.trim());

  // Reopen Mewing card to confirm technique now visible
  await page.fill('#searchInput', 'Mewing');
  await page.waitForTimeout(200);
  await page.click('.term-card .term-top');
  await page.waitForTimeout(400);
  const techniqueVisible = await page.$('.technique-steps') !== null;
  const stillLocked = await page.$('.technique-locked') !== null;
  console.log('Technique steps visible after unlock:', techniqueVisible);
  console.log('Still locked after unlock:', stillLocked);

  const stepsHtml = await page.$eval('.technique-steps', el => el.innerHTML.substring(0, 200));
  console.log('Steps HTML sample:', stepsHtml);

  // Reload page to confirm localStorage persistence
  await page.reload();
  await page.waitForTimeout(300);
  const pillAfterReload = await page.textContent('#premiumPill');
  console.log('Premium pill after reload:', pillAfterReload.trim());

  console.log('Console/page errors:', errors.length ? errors : 'none');

  await browser.close();
})();
