const { chromium, CHROMIUM_PATH } = require('./helpers/playwright-env');
const path = require('path');
const fs = require('fs');

require('fs').mkdirSync(require('path').join(__dirname, '.artifacts'), { recursive: true });

(async () => {
  const browser = await chromium.launch({ executablePath: CHROMIUM_PATH });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, acceptDownloads: true });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

  const filePath = 'file://' + path.resolve(__dirname, '..', 'looksmaxxing_dictionary.html');
  await page.goto(filePath);
  await page.waitForTimeout(300);
  await page.click('#welcomeClose');
  await page.waitForTimeout(200);

  console.log('=== Favorite a term and rename the profile so the export has real content ===');
  await page.fill('#searchInput', 'Mewing');
  await page.waitForTimeout(200);
  await page.click('[data-fav]');
  await page.waitForTimeout(150);
  await page.fill('#searchInput', '');

  await page.click('.nav-tab[data-view="forum"]');
  await page.waitForTimeout(1700);
  await page.evaluate(() => { const o = document.getElementById('popupAdOverlay'); if (o.classList.contains('show')) document.getElementById('popupAdClose').click(); });
  await page.waitForTimeout(200);
  await page.click('#editProfileBtn');
  await page.waitForTimeout(200);
  await page.fill('#profileUsernameInput', 'export_test_user');
  await page.click('#profileSave');
  await page.waitForTimeout(200);
  await page.click('#editProfileBtn');
  await page.waitForTimeout(200);

  console.log('=== Clicking Export triggers a real file download with correct backup content ===');
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.click('#exportDataBtn'),
  ]);
  const suggestedName = download.suggestedFilename();
  const downloadPath = path.join(__dirname, '.artifacts', suggestedName);
  await download.saveAs(downloadPath);
  console.log('Suggested filename:', suggestedName);
  const content = JSON.parse(fs.readFileSync(downloadPath, 'utf8'));
  console.log('Exported username:', content.looksmax_username);
  console.log('Exported favorites includes Mewing:', (content.looksmax_favorites || []).includes('Mewing'));
  console.log('Export contains no non-looksmax keys:', Object.keys(content).every(k => k.startsWith('looksmax_')));
  console.log('Toast after export:', await page.evaluate(() => document.getElementById('toast')?.textContent));

  console.log('Errors:', errors.length ? errors : 'none');
  await browser.close();
})();
