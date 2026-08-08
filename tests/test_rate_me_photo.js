const { chromium, CHROMIUM_PATH } = require('./helpers/playwright-env');
const path = require('path');
const SD = path.join(__dirname, '.artifacts');
require('fs').mkdirSync(SD, { recursive: true });

async function run(appMode) {
  const browser = await chromium.launch({ executablePath: CHROMIUM_PATH });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

  const base = 'file://' + path.resolve(__dirname, '..', 'looksmaxxing_dictionary.html');
  const filePath = appMode ? base + '?app=1' : base;
  await page.goto(filePath);
  await page.waitForTimeout(300);
  await page.evaluate(() => { const w = document.getElementById("welcomeOverlay"); if (w && w.classList.contains("show")) document.getElementById("welcomeClose").click(); });

  await page.evaluate(() => document.querySelector('.nav-tab[data-view="forum"]').click());
  await page.waitForTimeout(1700);
  await page.evaluate(() => { const o = document.getElementById('popupAdOverlay'); if (o.classList.contains('show')) document.getElementById('popupAdClose').click(); });
  await page.waitForTimeout(200);

  const label = appMode ? '[APP MODE]' : '[WEB MODE]';
  console.log(`${label} === Open New Thread, select Rate Me prefix, attach photo ===`);
  await page.click('#newThreadBtn');
  await page.waitForTimeout(200);
  await page.fill('#newThreadTitle', 'Rate me honestly please');
  await page.selectOption('#newThreadCategory', 'Questions');
  await page.selectOption('#newThreadPrefix', 'RATE ME');
  await page.fill('#newThreadBody', 'Be honest, what should I focus on?');
  await page.setInputFiles('#newThreadPhotoInput', path.join(__dirname, 'fixtures', 'test_photo.png'));
  await page.waitForTimeout(400);
  const previewShown = await page.evaluate(() => document.getElementById('newThreadPhotoPreviewWrap').style.display !== 'none');
  console.log(`${label} Photo preview shown before submit:`, previewShown);
  await page.screenshot({ path: `${SD}/rate_me_form_${appMode ? 'app' : 'web'}.png` });

  await page.click('#newThreadSubmit');
  await page.waitForTimeout(300);

  const tid = await page.evaluate(() => document.querySelector('[data-edit-thread]').closest('.thread-card').dataset.threadId);
  const sel = `.thread-card[data-thread-id="${tid}"]`;

  console.log(`${label} === Prefix tag shows on the thread ===`);
  const prefixText = await page.evaluate((s) => document.querySelector(`${s} .thread-prefix`)?.textContent, sel);
  console.log(`${label} Prefix tag text:`, prefixText);

  console.log(`${label} === Photo shows when thread opened ===`);
  await page.evaluate((s) => document.querySelector(`${s} .thread-top`).click(), sel);
  await page.waitForTimeout(200);
  const photoShown = await page.evaluate((s) => !!document.querySelector(`${s} .thread-photo img`), sel);
  console.log(`${label} Photo shown in opened thread:`, photoShown);
  await page.screenshot({ path: `${SD}/rate_me_thread_${appMode ? 'app' : 'web'}.png` });

  console.log(`${label} === Persists across reload ===`);
  await page.reload();
  await page.waitForTimeout(300);
  await page.evaluate(() => document.querySelector('.nav-tab[data-view="forum"]').click());
  await page.waitForTimeout(1700);
  await page.evaluate(() => { const o = document.getElementById('popupAdOverlay'); if (o.classList.contains('show')) document.getElementById('popupAdClose').click(); });
  await page.evaluate((s) => document.querySelector(`${s} .thread-top`).click(), sel);
  await page.waitForTimeout(200);
  const photoPersisted = await page.evaluate((s) => !!document.querySelector(`${s} .thread-photo img`), sel);
  console.log(`${label} Photo persisted after reload:`, photoPersisted);

  console.log(`${label} === Other users can reply (real peer rating) ===`);
  await page.fill(`${sel} .reply-input`, '8/10 imo, work on your skincare routine');
  await page.evaluate((s) => document.querySelector(`${s} .reply-send-btn`).click(), sel);
  await page.waitForTimeout(300);
  const replyPosted = await page.evaluate((s) => document.querySelector(`${s} .reply-text`)?.textContent, sel);
  console.log(`${label} Reply posted:`, replyPosted);

  console.log(`${label} === Photo upload without prefix also works (not Rate-Me-only) ===`);
  await page.click('#newThreadBtn');
  await page.waitForTimeout(200);
  await page.fill('#newThreadTitle', 'Just sharing progress, no prefix');
  await page.selectOption('#newThreadCategory', 'Progress Logs');
  await page.fill('#newThreadBody', 'Update on my routine.');
  await page.setInputFiles('#newThreadPhotoInput', path.join(__dirname, 'fixtures', 'test_photo.png'));
  await page.waitForTimeout(400);
  await page.click('#newThreadSubmit');
  await page.waitForTimeout(300);
  const secondHasNoPrefix = await page.evaluate(() => {
    const card = document.querySelector('[data-edit-thread]').closest('.thread-card');
    return !card.querySelector('.thread-prefix');
  });
  console.log(`${label} Second thread (no prefix selected) has no prefix tag:`, secondHasNoPrefix);

  console.log(`${label} Errors:`, errors.length ? errors : 'none');
  await browser.close();
}

(async () => {
  await run(false);
  await run(true);
})();
