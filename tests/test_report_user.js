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
  await page.click('#welcomeClose');
  await page.waitForTimeout(200);

  await page.click('.nav-tab[data-view="forum"]');
  await page.waitForTimeout(1700);
  await page.evaluate(() => { const o = document.getElementById('popupAdOverlay'); if (o.classList.contains('show')) document.getElementById('popupAdClose').click(); });
  await page.waitForTimeout(200);

  console.log('=== Own profile has no Report button ===');
  await page.click('#newThreadBtn');
  await page.waitForTimeout(200);
  await page.fill('#newThreadTitle', 'Self report-check thread');
  await page.fill('#newThreadBody', 'checking report button absent on my own profile.');
  await page.click('#newThreadSubmit');
  await page.waitForTimeout(300);
  const myUsername = await page.evaluate(() => localStorage.getItem('looksmax_username') || 'you');
  await page.evaluate((name) => {
    const el = [...document.querySelectorAll('#threadList [data-author]')].find(e => e.dataset.author === name);
    if (el) el.click();
  }, myUsername);
  await page.waitForTimeout(300);
  const ownReportBtn = await page.$('#memberReportBtn');
  console.log('Report button on own profile (should be null):', ownReportBtn);
  await page.click('#memberClose');
  await page.waitForTimeout(200);

  console.log('=== Open another user, click Report, see reason panel ===');
  const author = await page.evaluate((myName) => {
    const els = [...document.querySelectorAll('#threadList [data-author]')];
    const el = els.find(e => e.dataset.author !== myName);
    return el ? el.dataset.author : null;
  }, myUsername);
  await page.evaluate((name) => {
    const el = [...document.querySelectorAll('#threadList [data-author]')].find(e => e.dataset.author === name);
    if (el) el.click();
  }, author);
  await page.waitForTimeout(300);
  await page.click('#memberReportBtn');
  await page.waitForTimeout(200);
  const panelVisible = await page.evaluate(() => !!document.querySelector('#memberProfileBody .report-panel'));
  const reasonButtons = await page.evaluate(() => [...document.querySelectorAll('[data-member-reason]')].map(b => b.textContent));
  console.log('Report panel visible:', panelVisible, '| reasons:', JSON.stringify(reasonButtons));
  await page.screenshot({ path: `${SD}/modern/36_report_user_panel.png` });

  console.log('=== Cancel closes the panel without reporting ===');
  await page.click('#memberReportCancel');
  await page.waitForTimeout(200);
  const cancelledPanelGone = await page.evaluate(() => !document.querySelector('#memberProfileBody .report-panel'));
  const stillReportable = await page.evaluate(() => !!document.getElementById('memberReportBtn') && !document.getElementById('memberReportBtn').disabled);
  console.log('Panel gone after cancel:', cancelledPanelGone, '| report button still active:', stillReportable);

  console.log('=== Submitting a reason reports the user and disables further reports ===');
  await page.click('#memberReportBtn');
  await page.waitForTimeout(200);
  await page.click('[data-member-reason="Harassment"]');
  await page.waitForTimeout(200);
  const toastText = await page.evaluate(() => document.getElementById('toast')?.textContent);
  const reportBtnText = await page.evaluate(() => document.getElementById('memberReportBtn')?.textContent.trim());
  const reportBtnDisabled = await page.evaluate(() => document.getElementById('memberReportBtn')?.disabled);
  console.log('Toast:', toastText, '| button text:', reportBtnText, '| disabled:', reportBtnDisabled);

  console.log('=== Reopening the same profile still shows Reported (persisted) ===');
  await page.click('#memberClose');
  await page.waitForTimeout(200);
  await page.evaluate((name) => {
    const el = [...document.querySelectorAll('#threadList [data-author]')].find(e => e.dataset.author === name);
    if (el) el.click();
  }, author);
  await page.waitForTimeout(300);
  const reopenedText = await page.evaluate(() => document.getElementById('memberReportBtn')?.textContent.trim());
  const reopenedDisabled = await page.evaluate(() => document.getElementById('memberReportBtn')?.disabled);
  console.log('Text on reopen:', reopenedText, '| disabled on reopen:', reopenedDisabled);

  console.log('Errors:', errors.length ? errors : 'none');
  await browser.close();
})();
