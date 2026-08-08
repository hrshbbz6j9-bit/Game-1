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

  console.log('=== Non-OP should not see mark-best buttons on a seed thread ===');
  await page.evaluate(() => document.querySelectorAll('.thread-card .thread-top')[2].click());
  await page.waitForTimeout(200);
  const nonOpMarkBtns = await page.evaluate(() => document.querySelectorAll('.thread-card.open [data-mark-best]').length);
  console.log('Mark-best buttons on a thread you do not own:', nonOpMarkBtns);

  console.log('=== Create own thread, get replies, mark best answer ===');
  await page.click('#newThreadBtn');
  await page.waitForTimeout(200);
  await page.fill('#newThreadTitle', 'Which routine should I pick?');
  await page.selectOption('#newThreadCategory', 'Questions');
  await page.fill('#newThreadBody', 'Torn between two options, need advice.');
  await page.click('#newThreadSubmit');
  await page.waitForTimeout(300);
  const tid = await page.evaluate(() => document.querySelector('[data-edit-thread]').closest('.thread-card').dataset.threadId);
  const sel = `.thread-card[data-thread-id="${tid}"]`;

  // Post your own reply first (idx 0), then simulate two other users replying (idx 1, idx 2)
  await page.evaluate((s) => document.querySelector(`${s} .thread-top`).click(), sel);
  await page.waitForTimeout(200);
  await page.fill(`${sel} .reply-input`, 'Bumping — anyone have input?');
  await page.evaluate((s) => document.querySelector(`${s} .reply-send-btn`).click(), sel);
  await page.waitForTimeout(300);
  await page.evaluate((id) => {
    const threads = JSON.parse(localStorage.getItem('looksmax_threads'));
    const t = threads.find(x => x.id == id);
    t.replies.push({ author: 'coach.leanmax', text: 'Option A is better for beginners.' });
    t.replies.push({ author: 'derma.simplified', text: 'Option B has better long-term evidence, go with that.' });
    localStorage.setItem('looksmax_threads', JSON.stringify(threads));
  }, tid);
  await page.reload();
  await page.waitForTimeout(300);
  await page.evaluate(() => document.querySelector('.nav-tab[data-view="forum"]').click());
  await page.waitForTimeout(1700);
  await page.evaluate(() => { const o = document.getElementById('popupAdOverlay'); if (o.classList.contains('show')) document.getElementById('popupAdClose').click(); });
  await page.waitForTimeout(200);
  await page.evaluate((s) => document.querySelector(`${s} .thread-top`).click(), sel);
  await page.waitForTimeout(200);

  const markBtnCount = await page.evaluate((s) => document.querySelectorAll(`${s} [data-mark-best]`).length, sel);
  console.log('Mark-best buttons visible as OP:', markBtnCount);

  // Mark the SECOND reply (Option B, derma.simplified) as best
  await page.evaluate((s) => {
    const btns = [...document.querySelectorAll(`${s} [data-mark-best]`)];
    const target = btns.find(b => b.closest('.reply-item').textContent.includes('Option B'));
    target.click();
  }, sel);
  await page.waitForTimeout(300);
  await page.evaluate((s) => document.querySelector(s).scrollIntoView({block:'center'}), sel);
  await page.screenshot({ path: `${SD}/best_answer_marked.png` });

  const firstReplyText = await page.evaluate((s) => document.querySelector(`${s} .reply-item .reply-text`)?.textContent, sel);
  const badgeShown = await page.evaluate((s) => !!document.querySelector(`${s} .best-answer-badge`), sel);
  console.log('First reply after reorder (should be Option B):', firstReplyText);
  console.log('Best answer badge shown:', badgeShown);

  console.log('=== Unmark best answer ===');
  await page.evaluate((s) => document.querySelector(`${s} [data-mark-best].reported, ${s} .reply-item.best-answer [data-mark-best]`).click(), sel);
  await page.waitForTimeout(300);
  const badgeAfterUnmark = await page.evaluate((s) => !!document.querySelector(`${s} .best-answer-badge`), sel);
  console.log('Best answer badge shown after unmark (should be false):', badgeAfterUnmark);

  console.log('=== Delete an earlier reply shifts the best-answer index correctly ===');
  // Re-mark Option B (derma.simplified, original idx 2) as best
  await page.evaluate((s) => {
    const btns = [...document.querySelectorAll(`${s} [data-mark-best]`)];
    const target = btns.find(b => b.closest('.reply-item').textContent.includes('Option B'));
    target.click();
  }, sel);
  await page.waitForTimeout(300);
  const bestIdxBeforeDelete = await page.evaluate((id) => {
    const threads = JSON.parse(localStorage.getItem('looksmax_threads'));
    return threads.find(x => x.id == id).bestAnswerIdx;
  }, tid);
  console.log('bestAnswerIdx before deleting your own earlier reply (expect 2):', bestIdxBeforeDelete);

  // Delete YOUR OWN reply at idx 0 ("Bumping...") through the real UI delete flow
  await page.evaluate((s) => {
    const items = [...document.querySelectorAll(`${s} .reply-item`)];
    const ownItem = items.find(i => i.textContent.includes('Bumping'));
    ownItem.querySelector('[data-delete-reply]').click();
  }, sel);
  await page.waitForTimeout(200);
  await page.evaluate((s) => document.querySelector(`${s} [data-confirm-delete-reply]`).click(), sel);
  await page.waitForTimeout(300);

  const bestIdxAfterDelete = await page.evaluate((id) => {
    const threads = JSON.parse(localStorage.getItem('looksmax_threads'));
    return threads.find(x => x.id == id).bestAnswerIdx;
  }, tid);
  console.log('bestAnswerIdx after deleting your own earlier reply (expect 1):', bestIdxAfterDelete);
  const badgeStillOnOptionB = await page.evaluate((s) => {
    const badge = document.querySelector(`${s} .reply-item.best-answer`);
    return badge ? badge.textContent.includes('Option B') : null;
  }, sel);
  console.log('Best-answer badge still correctly on Option B after real deleteReply():', badgeStillOnOptionB);
  await page.screenshot({ path: `${SD}/best_answer_after_delete.png` });

  console.log('Errors:', errors.length ? errors : 'none');
  await browser.close();
})();
