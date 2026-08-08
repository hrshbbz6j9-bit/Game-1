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

  for (let i = 0; i < 3; i++) {
    await page.click('#randomTermBtn');
    await page.waitForTimeout(300);
    const searchVal = await page.inputValue('#searchInput');
    const openCardTerm = await page.evaluate(() => {
      const card = document.querySelector('.term-card.open .term-name');
      return card ? card.textContent : null;
    });
    const resultCount = await page.textContent('#resultCount');
    console.log(`Pick ${i+1}: search="${searchVal}" openCard="${openCardTerm}" resultCount="${resultCount}"`);
  }

  await page.screenshot({ path: `${SD}/random_term.png` });
  console.log('Errors:', errors.length ? errors : 'none');
  await browser.close();
})();
