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

  console.log('=== Own thread should NOT show a report button ===');
  await page.click('#newThreadBtn');
  await page.waitForTimeout(200);
  await page.fill('#newThreadTitle', 'My own thread for report test');
  await page.selectOption('#newThreadCategory', 'Fitness');
  await page.fill('#newThreadBody', 'body');
  await page.click('#newThreadSubmit');
  await page.waitForTimeout(300);
  const tidOwn = await page.evaluate(() => document.querySelector('[data-edit-thread]').closest('.thread-card').dataset.threadId);
  const selOwn = `.thread-card[data-thread-id="${tidOwn}"]`;
  const ownHasReportBtn = await page.evaluate((s) => !!document.querySelector(`${s} [data-report-thread]`), selOwn);
  console.log('Own thread has report button (should be false):', ownHasReportBtn);

  console.log('=== Report a seed (not-owned) thread ===');
  const seedSel = '.thread-card:not([data-thread-id="' + tidOwn + '"])';
  const seedTid = await page.evaluate((s) => {
    const el = [...document.querySelectorAll('.thread-card')].find(c => c.querySelector('[data-report-thread]'));
    return el ? el.dataset.threadId : null;
  }, seedSel);
  console.log('Reportable seed thread id:', seedTid);
  const sel = `.thread-card[data-thread-id="${seedTid}"]`;

  await page.evaluate((s) => document.querySelector(`${s} [data-report-thread]`).click(), sel);
  await page.waitForTimeout(200);
  const reasonBtnCount = await page.evaluate((s) => document.querySelectorAll(`${s} .report-reason-btn`).length, sel);
  console.log('Reason buttons shown:', reasonBtnCount);
  await page.screenshot({ path: `${SD}/report_reasons.png` });

  await page.evaluate((s) => {
    const btns = [...document.querySelectorAll(`${s} .report-reason-btn`)];
    btns.find(b => b.textContent === 'Spam').click();
  }, sel);
  await page.waitForTimeout(300);
  const afterReport = await page.evaluate((s) => {
    const btn = document.querySelector(`${s} [data-report-thread], ${s} .owner-btn.reported`);
    return { exists: !!btn, disabled: btn ? btn.disabled : null, text: btn ? btn.textContent : null };
  }, sel);
  console.log('Report button state after reporting:', afterReport);
  await page.screenshot({ path: `${SD}/thread_reported.png` });

  console.log('=== Reporting persists across reload ===');
  await page.reload();
  await page.waitForTimeout(300);
  await page.evaluate(() => document.querySelector('.nav-tab[data-view="forum"]').click());
  await page.waitForTimeout(1700);
  await page.evaluate(() => { const o = document.getElementById('popupAdOverlay'); if (o.classList.contains('show')) document.getElementById('popupAdClose').click(); });
  await page.waitForTimeout(200);
  const stillReportedAfterReload = await page.evaluate((s) => !!document.querySelector(`${s} .owner-btn.reported`), sel);
  console.log('Still shows Reported after reload:', stillReportedAfterReload);

  console.log('=== Report a reply from another user ===');
  const replySel = '.thread-card[data-thread-id="2"]';
  await page.evaluate((s) => document.querySelector(`${s} .thread-top`).click(), replySel);
  await page.waitForTimeout(200);
  const replyReportBtnCount = await page.evaluate((s) => document.querySelectorAll(`${s} [data-report-reply]`).length, replySel);
  console.log('Report-able replies (not own):', replyReportBtnCount);
  if (replyReportBtnCount > 0) {
    await page.evaluate((s) => document.querySelector(`${s} [data-report-reply]`).click(), replySel);
    await page.waitForTimeout(200);
    await page.screenshot({ path: `${SD}/reply_report_reasons.png` });
    await page.evaluate((s) => {
      const btns = [...document.querySelectorAll(`${s} [data-reply-report-idx] .report-reason-btn`)];
      btns.find(b => b.textContent === 'Harassment').click();
    }, replySel);
    await page.waitForTimeout(300);
    const replyReportedState = await page.evaluate((s) => !!document.querySelector(`${s} .owner-btn.reported`), replySel);
    console.log('Reply shows Reported state:', replyReportedState);
  }

  console.log('=== Cancel report leaves nothing reported ===');
  const cancelTid = await page.evaluate(() => {
    const el = [...document.querySelectorAll('.thread-card')].find(c => c.querySelector('[data-report-thread]'));
    return el ? el.dataset.threadId : null;
  });
  const cancelSel = `.thread-card[data-thread-id="${cancelTid}"]`;
  await page.evaluate((s) => document.querySelector(`${s} [data-report-thread]`).click(), cancelSel);
  await page.waitForTimeout(200);
  await page.evaluate((s) => document.querySelector(`${s} [data-cancel-thread-report]`).click(), cancelSel);
  await page.waitForTimeout(200);
  const stillHasReportBtn = await page.evaluate((s) => !!document.querySelector(`${s} [data-report-thread]`), cancelSel);
  console.log('Report button still active (not reported) after cancel:', stillHasReportBtn);

  console.log('Errors:', errors.length ? errors : 'none');
  await browser.close();
})();
