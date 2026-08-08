const { chromium, CHROMIUM_PATH } = require('./helpers/playwright-env');
const path = require('path');
const fs = require('fs');
const SD = path.join(__dirname, '.artifacts');
require('fs').mkdirSync(SD, { recursive: true });

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

  console.log('=== Set up real state: favorite a term, rename profile ===');
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
  await page.fill('#profileUsernameInput', 'roundtrip_user');
  await page.click('#profileSave');
  await page.waitForTimeout(200);

  console.log('=== Export it ===');
  await page.click('#editProfileBtn');
  await page.waitForTimeout(200);
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.click('#exportDataBtn'),
  ]);
  const backupPath = `${SD}/roundtrip_backup.json`;
  await download.saveAs(backupPath);

  console.log('=== Reset everything (data is now gone) ===');
  await page.click('#resetDataBtn');
  await page.waitForTimeout(150);
  await page.click('#resetDataConfirmBtn');
  await page.waitForTimeout(400);
  const usernameAfterReset = await page.evaluate(() => localStorage.getItem('looksmax_username'));
  console.log('Username after reset (should be null, fresh state):', usernameAfterReset);

  console.log('=== Import the backup restores everything ===');
  await page.click('#welcomeClose').catch(() => {});
  await page.waitForTimeout(200);
  await page.click('.nav-tab[data-view="forum"]');
  await page.waitForTimeout(1700);
  await page.evaluate(() => { const o = document.getElementById('popupAdOverlay'); if (o.classList.contains('show')) document.getElementById('popupAdClose').click(); });
  await page.waitForTimeout(200);
  await page.click('#editProfileBtn');
  await page.waitForTimeout(200);

  const fileInput = await page.$('#importDataInput');
  await fileInput.setInputFiles(backupPath);
  await page.waitForTimeout(200);
  const confirmText = await page.evaluate(() => document.getElementById('importDataConfirmText').textContent);
  console.log('Confirm prompt:', confirmText);
  await page.click('#importDataConfirmBtn');
  await page.waitForTimeout(400);

  const restoredUsername = await page.evaluate(() => localStorage.getItem('looksmax_username'));
  const restoredFavorites = await page.evaluate(() => JSON.parse(localStorage.getItem('looksmax_favorites') || '[]'));
  console.log('Restored username:', restoredUsername);
  console.log('Restored favorites includes Mewing:', restoredFavorites.includes('Mewing'));
  await page.screenshot({ path: `${SD}/modern/30_import_restored.png` });

  console.log('=== Importing garbage JSON is rejected cleanly ===');
  fs.writeFileSync(`${SD}/garbage.json`, JSON.stringify({ notARealBackup: true, foo: "bar" }));
  await page.click('#welcomeClose').catch(() => {});
  await page.waitForTimeout(200);
  await page.click('.nav-tab[data-view="forum"]');
  await page.waitForTimeout(1700);
  await page.evaluate(() => { const o = document.getElementById('popupAdOverlay'); if (o.classList.contains('show')) document.getElementById('popupAdClose').click(); });
  await page.waitForTimeout(200);
  await page.click('#editProfileBtn');
  await page.waitForTimeout(200);
  const fileInput2 = await page.$('#importDataInput');
  await fileInput2.setInputFiles(`${SD}/garbage.json`);
  await page.waitForTimeout(200);
  const toastForGarbage = await page.evaluate(() => document.getElementById('toast')?.textContent);
  const confirmRowShownForGarbage = await page.evaluate(() => document.getElementById('importDataConfirmRow').style.display === 'flex');
  console.log('Toast for non-backup JSON:', toastForGarbage, '| confirm row shown (should be false):', confirmRowShownForGarbage);

  console.log('=== Importing invalid JSON syntax is also rejected cleanly ===');
  fs.writeFileSync(`${SD}/invalid.json`, 'not valid json {{{');
  const fileInput3 = await page.$('#importDataInput');
  await fileInput3.setInputFiles(`${SD}/invalid.json`);
  await page.waitForTimeout(200);
  const toastForInvalid = await page.evaluate(() => document.getElementById('toast')?.textContent);
  console.log('Toast for invalid JSON:', toastForInvalid);

  console.log('Errors:', errors.length ? errors : 'none');
  await browser.close();
})();
