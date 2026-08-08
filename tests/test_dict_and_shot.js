const { chromium, CHROMIUM_PATH } = require('./helpers/playwright-env');
const path = require('path');

require('fs').mkdirSync(require('path').join(__dirname, '.artifacts'), { recursive: true });

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

  await page.screenshot({ path: path.join(__dirname, '.artifacts', 'shot_dictionary.png') });

  await page.fill('#searchInput', 'Canthal');
  await page.waitForTimeout(200);
  const resultCount = await page.textContent('#resultCount');
  console.log('Search works:', resultCount);
  await page.click('.term-card .term-top');
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(__dirname, '.artifacts', 'shot_term_open.png') });

  await page.click('.nav-tab[data-view="forum"]');
  await page.waitForTimeout(1600); // let popup ad appear
  await page.screenshot({ path: path.join(__dirname, '.artifacts', 'shot_forum_popup.png') });
  await page.click('#popupAdClose');
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(__dirname, '.artifacts', 'shot_forum.png') });

  await page.click('.nav-tab[data-view="courses"]');
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(__dirname, '.artifacts', 'shot_courses.png') });

  console.log('Errors:', errors.length ? errors : 'none');
  await browser.close();
})();
