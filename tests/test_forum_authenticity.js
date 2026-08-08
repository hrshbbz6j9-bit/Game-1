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

  await page.evaluate(() => document.querySelector('.nav-tab[data-view="forum"]').click());
  await page.waitForTimeout(1700);
  await page.evaluate(() => { const o = document.getElementById('popupAdOverlay'); if (o.classList.contains('show')) document.getElementById('popupAdClose').click(); });
  await page.waitForTimeout(200);

  // First two cards should be pinned regardless of category/sort
  const firstTwoPinned = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('.thread-card')].slice(0, 2);
    return cards.map(c => c.classList.contains('pinned'));
  });
  console.log('First two cards are pinned:', firstTwoPinned);

  const pinIconVisible = await page.evaluate(() => !!document.querySelector('.pin-icon'));
  console.log('Pin icon rendered:', pinIconVisible);

  const prefixVisible = await page.evaluate(() => {
    const el = document.querySelector('.thread-prefix');
    return el ? el.textContent : null;
  });
  console.log('First prefix tag text:', prefixVisible);

  const viewsBefore = await page.evaluate(() => {
    const meta = document.querySelector('.thread-card .thread-meta');
    return meta.textContent.match(/👁\s*[\d,]+/)[0];
  });
  console.log('Views before opening thread:', viewsBefore);

  await page.evaluate(() => document.querySelector('.thread-card .thread-top').click());
  await page.waitForTimeout(200);
  await page.evaluate(() => document.querySelector('.thread-card .thread-top').click()); // close
  await page.waitForTimeout(200);
  await page.evaluate(() => document.querySelector('.thread-card .thread-top').click()); // open again
  await page.waitForTimeout(200);

  const viewsAfter = await page.evaluate(() => {
    const meta = document.querySelector('.thread-card .thread-meta');
    return meta.textContent.match(/👁\s*[\d,]+/)[0];
  });
  console.log('Views after opening twice:', viewsAfter);

  // Reactions
  const reactionBefore = await page.evaluate(() => document.querySelector('.reaction-btn[data-react="fire"]').textContent.trim());
  console.log('Fire reaction before:', reactionBefore);
  await page.evaluate(() => document.querySelector('.reaction-btn[data-react="fire"]').click());
  await page.waitForTimeout(200);
  const reactionAfter = await page.evaluate(() => document.querySelector('.reaction-btn[data-react="fire"]').textContent.trim());
  const reactionActive = await page.evaluate(() => document.querySelector('.reaction-btn[data-react="fire"]').classList.contains('active'));
  console.log('Fire reaction after click:', reactionAfter, '| active:', reactionActive);

  await page.screenshot({ path: `${SD}/forum_authentic.png` });

  // switch sort to Top, pinned threads should still lead
  await page.evaluate(() => document.querySelector('.sort-btn[data-sort="top"]').click());
  await page.waitForTimeout(300);
  const stillPinnedFirst = await page.evaluate(() => document.querySelector('.thread-card').classList.contains('pinned'));
  console.log('Pinned thread still first after switching to Top sort:', stillPinnedFirst);

  console.log('Errors:', errors.length ? errors : 'none');
  await browser.close();
})();
