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

  console.log('=== Hidden by default at top of page ===');
  const hiddenAtTop = await page.evaluate(() => !document.getElementById('backToTopBtn').classList.contains('show'));
  console.log('Hidden at top:', hiddenAtTop);

  console.log('=== Appears after scrolling down past threshold ===');
  await page.evaluate(() => window.scrollTo(0, 800));
  await page.waitForTimeout(300);
  const shownAfterScroll = await page.evaluate(() => document.getElementById('backToTopBtn').classList.contains('show'));
  console.log('Shown after scrolling to 800px:', shownAfterScroll);
  await page.screenshot({ path: `${SD}/back_to_top.png` });

  console.log('=== Clicking it scrolls back to top ===');
  await page.click('#backToTopBtn');
  await page.waitForTimeout(600);
  const scrollYAfterClick = await page.evaluate(() => window.scrollY);
  console.log('scrollY after clicking back-to-top (should be near 0):', scrollYAfterClick);

  console.log('=== Hides again once scrolled back near top ===');
  await page.waitForTimeout(300);
  const hiddenAgain = await page.evaluate(() => !document.getElementById('backToTopBtn').classList.contains('show'));
  console.log('Hidden again after returning to top:', hiddenAgain);

  console.log('Errors:', errors.length ? errors : 'none');
  await browser.close();
})();
