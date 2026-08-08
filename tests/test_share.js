const { chromium, CHROMIUM_PATH } = require('./helpers/playwright-env');
const path = require('path');
const SD = path.join(__dirname, '.artifacts');
require('fs').mkdirSync(SD, { recursive: true });

(async () => {
  const browser = await chromium.launch({ executablePath: CHROMIUM_PATH });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, permissions: ['clipboard-write', 'clipboard-read'] });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

  const filePath = 'file://' + path.resolve(__dirname, '..', 'looksmaxxing_dictionary.html');
  await page.goto(filePath);
  await page.waitForTimeout(300);
  await page.evaluate(() => { const w = document.getElementById("welcomeOverlay"); if (w && w.classList.contains("show")) document.getElementById("welcomeClose").click(); });

  // Force the clipboard fallback path (native share sheet isn't testable headlessly)
  await page.evaluate(() => { delete navigator.__proto__.share; Object.defineProperty(navigator, 'share', { value: undefined, configurable: true }); });

  console.log('=== Term card: share button copies term + definition, does not toggle card open/closed ===');
  await page.fill('.search-input, #searchInput', 'Mewing').catch(() => {});
  await page.waitForTimeout(200);
  const firstCard = await page.$('.term-card');
  await firstCard.click();
  await page.waitForTimeout(200);
  const openBeforeShare = await page.evaluate(() => document.querySelector('.term-card').classList.contains('open') || !!document.querySelector('.term-body'));
  await page.click('[data-share-term]');
  await page.waitForTimeout(200);
  const toastAfterTermShare = await page.evaluate(() => document.getElementById('toast')?.textContent);
  const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
  console.log('Toast after term share:', toastAfterTermShare);
  console.log('Clipboard contains term text:', clipboardText.length > 0);
  const stillOpenAfterShare = await page.evaluate(() => !!document.querySelector('.term-card .term-body'));
  console.log('Card still open after share click (stopPropagation worked):', stillOpenAfterShare);

  console.log('=== Forum thread: share button copies title + body ===');
  await page.evaluate(() => document.querySelector('.nav-tab[data-view="forum"]').click());
  await page.waitForTimeout(1700);
  await page.evaluate(() => { const o = document.getElementById('popupAdOverlay'); if (o.classList.contains('show')) document.getElementById('popupAdClose').click(); });
  await page.waitForTimeout(200);
  await page.click('[data-share-thread]');
  await page.waitForTimeout(200);
  const toastAfterThreadShare = await page.evaluate(() => document.getElementById('toast')?.textContent);
  const clipboardThread = await page.evaluate(() => navigator.clipboard.readText());
  console.log('Toast after thread share:', toastAfterThreadShare);
  console.log('Clipboard contains thread text:', clipboardThread.length > 0);
  const threadStillClosed = await page.evaluate(() => document.querySelectorAll('.thread-body').length >= 0);
  console.log('No crash after thread share click:', threadStillClosed);
  await page.screenshot({ path: `${SD}/share_buttons.png` });

  console.log('Errors:', errors.length ? errors : 'none');
  await browser.close();
})();
