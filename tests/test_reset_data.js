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

  console.log('=== Favorite a term, then open Edit Profile ===');
  await page.fill('#searchInput', 'Mewing');
  await page.waitForTimeout(200);
  await page.click('[data-fav]');
  await page.waitForTimeout(150);
  const favCountBefore = await page.evaluate(() => JSON.parse(localStorage.getItem('looksmax_favorites') || '[]').length);
  console.log('Favorites before reset:', favCountBefore);

  await page.evaluate(() => document.querySelector('.nav-tab[data-view="forum"]').click());
  await page.waitForTimeout(1700);
  await page.evaluate(() => { const o = document.getElementById('popupAdOverlay'); if (o.classList.contains('show')) document.getElementById('popupAdClose').click(); });
  await page.waitForTimeout(200);
  await page.click('#editProfileBtn');
  await page.waitForTimeout(200);

  console.log('=== Confirm row is hidden by default ===');
  const confirmRowHiddenInitially = await page.evaluate(() => document.getElementById('resetDataConfirmRow').style.display === 'none');
  console.log('Hidden initially:', confirmRowHiddenInitially);

  console.log('=== Clicking Reset All Data reveals the confirm row (destructive action gated) ===');
  await page.click('#resetDataBtn');
  await page.waitForTimeout(150);
  const confirmRowShown = await page.evaluate(() => document.getElementById('resetDataConfirmRow').style.display === 'flex');
  console.log('Confirm row shown:', confirmRowShown);

  console.log('=== Cancel hides it again, WITHOUT clearing data ===');
  await page.click('#resetDataCancelBtn');
  await page.waitForTimeout(150);
  const confirmRowHiddenAfterCancel = await page.evaluate(() => document.getElementById('resetDataConfirmRow').style.display === 'none');
  const favCountAfterCancel = await page.evaluate(() => JSON.parse(localStorage.getItem('looksmax_favorites') || '[]').length);
  console.log('Hidden after cancel:', confirmRowHiddenAfterCancel, '| favorites still intact:', favCountAfterCancel);

  console.log('=== Confirming actually wipes localStorage and reloads to a fresh state ===');
  await page.click('#resetDataBtn');
  await page.waitForTimeout(150);
  await page.screenshot({ path: `${SD}/reset_data_confirm.png` });
  await page.click('#resetDataConfirmBtn');
  await page.waitForTimeout(500);
  const localStorageLengthAfterReset = await page.evaluate(() => {
    return { threads: localStorage.getItem('looksmax_threads'), favorites: localStorage.getItem('looksmax_favorites'), onboarded: localStorage.getItem('looksmax_onboarded') };
  });
  console.log('Storage after reset (all should be null except fresh-seeded values):', JSON.stringify(localStorageLengthAfterReset));
  const welcomeShownAgain = await page.evaluate(() => document.getElementById('welcomeOverlay').classList.contains('show'));
  console.log('Welcome modal shows again after full reset (fresh first-run state):', welcomeShownAgain);

  console.log('Errors:', errors.length ? errors : 'none');
  await browser.close();
})();
