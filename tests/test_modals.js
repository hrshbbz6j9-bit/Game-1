const { chromium, CHROMIUM_PATH } = require('./helpers/playwright-env');
const path = require('path');

require('fs').mkdirSync(require('path').join(__dirname, '.artifacts'), { recursive: true });

(async () => {
  const browser = await chromium.launch({ executablePath: CHROMIUM_PATH });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const filePath = 'file://' + path.resolve(__dirname, '..', 'looksmaxxing_dictionary.html');
  await page.goto(filePath);
  await page.waitForTimeout(300);
  await page.evaluate(() => { const w = document.getElementById("welcomeOverlay"); if (w && w.classList.contains("show")) document.getElementById("welcomeClose").click(); });

  await page.click('#premiumPill');
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(__dirname, '.artifacts', 'shot_paywall.png') });
  await page.click('#paywallClose');
  await page.waitForTimeout(300);

  await page.click('.nav-tab[data-view="forum"]');
  await page.waitForTimeout(300);
  await page.click('#newThreadBtn');
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(__dirname, '.artifacts', 'shot_newthread.png') });

  await browser.close();
})();
