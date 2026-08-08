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

  const resultCount = await page.textContent('#resultCount');
  console.log('Total terms indexed:', resultCount);

  // Favorite the first 2 visible terms
  const favButtons = await page.$$('.fav-btn');
  await favButtons[0].click();
  await page.waitForTimeout(200);
  await page.click('#searchInput'); // just to ensure list refreshed, no-op
  const favButtons2 = await page.$$('.fav-btn');
  await favButtons2[1].click();
  await page.waitForTimeout(200);

  const activeStars = await page.$$eval('.fav-btn.active', els => els.length);
  console.log('Active stars after favoriting 2 terms:', activeStars);

  // Click the Saved chip
  const chips = await page.$$('.index-chip');
  let savedChip = null;
  for (const c of chips) {
    const text = await c.textContent();
    if (text.includes('Saved')) { savedChip = c; break; }
  }
  await savedChip.click();
  await page.waitForTimeout(300);
  const savedCount = await page.$$eval('.term-card', els => els.length);
  console.log('Terms shown in Saved filter:', savedCount);
  const savedResultText = await page.textContent('#resultCount');
  console.log('Result count text:', savedResultText);

  // Reload and confirm persistence
  await page.reload();
  await page.waitForTimeout(300);
  const chipsAfter = await page.$$('.index-chip');
  let savedChipAfter = null;
  for (const c of chipsAfter) {
    const text = await c.textContent();
    if (text.includes('Saved')) { savedChipAfter = c; break; }
  }
  await savedChipAfter.click();
  await page.waitForTimeout(300);
  const savedCountAfterReload = await page.$$eval('.term-card', els => els.length);
  console.log('Terms shown in Saved filter after reload:', savedCountAfterReload);

  // Unfavorite one and confirm it disappears from Saved view
  const firstFav = await page.$('.fav-btn.active');
  await firstFav.click();
  await page.waitForTimeout(300);
  const savedCountAfterRemove = await page.$$eval('.term-card', els => els.length);
  console.log('Terms shown in Saved filter after removing one:', savedCountAfterRemove);

  console.log('Errors:', errors.length ? errors : 'none');
  await browser.close();
})();
