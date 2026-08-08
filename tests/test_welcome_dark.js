const { chromium, CHROMIUM_PATH } = require('./helpers/playwright-env');
const path = require('path');
const SD = path.join(__dirname, '.artifacts');
require('fs').mkdirSync(SD, { recursive: true });

(async () => {
  const browser = await chromium.launch({ executablePath: CHROMIUM_PATH });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const filePath = 'file://' + path.resolve(__dirname, '..', 'looksmaxxing_dictionary.html');
  await page.goto(filePath);
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('looksmax_theme', 'dark');
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${SD}/welcome_modal_dark.png` });
  await browser.close();
})();
