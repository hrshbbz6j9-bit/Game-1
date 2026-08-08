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

  console.log('=== LEADERBOARD ===');
  await page.evaluate(() => document.querySelector('.nav-tab[data-view="forum"]').click());
  await page.waitForTimeout(1700);
  await page.evaluate(() => { const o = document.getElementById('popupAdOverlay'); if (o.classList.contains('show')) document.getElementById('popupAdClose').click(); });
  await page.waitForTimeout(200);

  await page.click('#leaderboardBtn');
  await page.waitForTimeout(300);
  const rowCount = await page.evaluate(() => document.querySelectorAll('.leaderboard-row').length);
  console.log('Leaderboard rows rendered:', rowCount);

  const topRowText = await page.evaluate(() => document.querySelector('.leaderboard-row').textContent.replace(/\s+/g, ' ').trim());
  console.log('Top row:', topRowText);

  const sortedDescending = await page.evaluate(() => {
    const scores = [...document.querySelectorAll('.leaderboard-score')].map(el => parseInt(el.textContent, 10));
    return scores.every((s, i) => i === 0 || s <= scores[i - 1]);
  });
  console.log('Scores sorted descending:', sortedDescending);

  await page.screenshot({ path: `${SD}/leaderboard.png` });
  await page.click('#leaderboardClose');
  await page.waitForTimeout(200);

  console.log('=== RELATED TERMS ===');
  await page.evaluate(() => document.querySelector('.nav-tab[data-view="dictionary"]').click());
  await page.waitForTimeout(200);
  await page.fill('#searchInput', 'Canthal Tilt');
  await page.waitForTimeout(200);
  await page.evaluate(() => document.querySelector('.term-card .term-top').click());
  await page.waitForTimeout(300);

  const relatedChips = await page.evaluate(() => [...document.querySelectorAll('.related-chip')].map(c => c.textContent));
  console.log('Related chips for Canthal Tilt:', relatedChips);

  await page.screenshot({ path: `${SD}/related_terms.png` });

  // Click a related chip and confirm it jumps
  await page.evaluate(() => document.querySelector('.related-chip').click());
  await page.waitForTimeout(300);
  const newSearchVal = await page.inputValue('#searchInput');
  const openTermName = await page.evaluate(() => {
    const el = document.querySelector('.term-card.open .term-name');
    return el ? el.textContent : null;
  });
  console.log('After clicking related chip -> search value:', newSearchVal, '| opened term:', openTermName);

  console.log('Errors:', errors.length ? errors : 'none');
  await browser.close();
})();
