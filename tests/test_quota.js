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

  console.log('=== Simulated quota-exceeded on saveThreads() shows a friendly toast, not an uncaught crash ===');
  await page.evaluate(() => document.querySelector('.nav-tab[data-view="forum"]').click());
  await page.waitForTimeout(1700);
  await page.evaluate(() => { const o = document.getElementById('popupAdOverlay'); if (o.classList.contains('show')) document.getElementById('popupAdClose').click(); });
  await page.waitForTimeout(200);

  await page.evaluate(() => {
    const realSetItem = localStorage.setItem.bind(localStorage);
    localStorage.setItem = function (key, value) {
      if (key === 'looksmax_threads') {
        const err = new DOMException('Quota exceeded (simulated)', 'QuotaExceededError');
        throw err;
      }
      return realSetItem(key, value);
    };
  });

  await page.click('#newThreadBtn');
  await page.waitForTimeout(200);
  await page.fill('#newThreadTitle', 'Quota test thread');
  await page.selectOption('#newThreadCategory', 'Fitness');
  await page.fill('#newThreadBody', 'Testing quota exceeded handling.');
  await page.click('#newThreadSubmit');
  await page.waitForTimeout(400);

  const toastImmediatelyAfter = await page.evaluate(() => document.getElementById('toast')?.textContent);
  console.log('Toast immediately after submit (expected: success toast, briefly):', toastImmediatelyAfter);
  await page.waitForTimeout(200);
  const toastText = await page.evaluate(() => document.getElementById('toast')?.textContent);
  const toastVisible = await page.evaluate(() => document.getElementById('toast')?.classList.contains('show'));
  console.log('Toast shown after deferred quota-error (expected to win over success toast):', toastText, '| visible:', toastVisible);

  const modalStillFunctional = await page.evaluate(() => {
    document.getElementById('newThreadClose')?.click();
    return true;
  });
  console.log('App still responsive after simulated quota error (no crash):', modalStillFunctional);

  console.log('Page/console errors during simulated quota failure:', errors.length ? errors : 'none');
  await browser.close();
})();
