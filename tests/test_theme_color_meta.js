const { chromium, CHROMIUM_PATH } = require('./helpers/playwright-env');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ executablePath: CHROMIUM_PATH });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

  const filePath = 'file://' + path.resolve(__dirname, '..', 'looksmaxxing_dictionary.html');

  console.log('=== Fresh load (light mode default): theme-color matches light paper ===');
  await page.goto(filePath);
  await page.waitForTimeout(300);
  const lightColor = await page.evaluate(() => document.querySelector('meta[name="theme-color"]').getAttribute('content'));
  console.log('theme-color on light-mode load:', lightColor);

  console.log('=== Toggling to dark mode updates theme-color live ===');
  await page.evaluate(() => { const w = document.getElementById("welcomeOverlay"); if (w && w.classList.contains("show")) document.getElementById("welcomeClose").click(); });
  await page.click('#themeToggleBtn');
  await page.waitForTimeout(150);
  const darkColor = await page.evaluate(() => document.querySelector('meta[name="theme-color"]').getAttribute('content'));
  console.log('theme-color after toggling to dark:', darkColor);

  console.log('=== Reloading with dark mode persisted: theme-color is correct from the very first paint (no flash) ===');
  await page.reload();
  await page.waitForTimeout(50);
  const darkColorImmediatelyAfterReload = await page.evaluate(() => document.querySelector('meta[name="theme-color"]').getAttribute('content'));
  console.log('theme-color immediately after reload (dark persisted):', darkColorImmediatelyAfterReload);

  console.log('=== Toggling back to light restores light theme-color ===');
  await page.click('#themeToggleBtn');
  await page.waitForTimeout(150);
  const backToLight = await page.evaluate(() => document.querySelector('meta[name="theme-color"]').getAttribute('content'));
  console.log('theme-color after toggling back to light:', backToLight);

  console.log('Errors:', errors.length ? errors : 'none');
  await browser.close();
})();
