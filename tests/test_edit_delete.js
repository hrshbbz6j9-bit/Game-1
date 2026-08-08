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

  console.log('=== No owner buttons on threads you do not own ===');
  const seedOwnerBtns = await page.evaluate(() => document.querySelectorAll('.thread-card [data-edit-thread]').length);
  console.log('Edit buttons visible on seed (not-owned) threads:', seedOwnerBtns);

  console.log('=== Post a new thread (owned by you) ===');
  await page.click('#newThreadBtn');
  await page.waitForTimeout(200);
  await page.fill('#newThreadTitle', 'Original title before edit');
  await page.selectOption('#newThreadCategory', 'Fitness');
  await page.fill('#newThreadBody', 'Original body before edit.');
  await page.click('#newThreadSubmit');
  await page.waitForTimeout(300);

  const tid = await page.evaluate(() => document.querySelector('[data-edit-thread]').closest('.thread-card').dataset.threadId);
  console.log('New thread id:', tid);
  const sel = `.thread-card[data-thread-id="${tid}"]`;

  const ownThreadHasButtons = await page.evaluate((s) => {
    const card = document.querySelector(s);
    return !!card.querySelector('[data-edit-thread]') && !!card.querySelector('[data-delete-thread]');
  }, sel);
  console.log('New own thread shows edit/delete buttons:', ownThreadHasButtons);

  console.log('=== Edit the thread ===');
  await page.evaluate((s) => document.querySelector(`${s} [data-edit-thread]`).click(), sel);
  await page.waitForTimeout(200);
  const editFormPrefilled = await page.evaluate((s) => ({
    title: document.querySelector(`${s} .edit-title-input`)?.value,
    body: document.querySelector(`${s} .edit-body-input`)?.value
  }), sel);
  console.log('Edit form prefilled:', editFormPrefilled);
  await page.screenshot({ path: `${SD}/thread_edit_form.png` });

  await page.fill(`${sel} .edit-title-input`, 'Edited title after save');
  await page.fill(`${sel} .edit-body-input`, 'Edited body after save.');
  await page.evaluate((s) => document.querySelector(`${s} [data-save-thread]`).click(), sel);
  await page.waitForTimeout(300);
  const afterEdit = await page.evaluate((s) => {
    const card = document.querySelector(s);
    return {
      title: card.querySelector('.thread-title').textContent.trim(),
      hasEditedTag: !!card.querySelector('.edited-tag')
    };
  }, sel);
  console.log('After edit:', afterEdit);

  console.log('=== Reply, then edit and delete the reply ===');
  await page.evaluate((s) => document.querySelector(`${s} .thread-top`).click(), sel);
  await page.waitForTimeout(200);
  await page.fill(`${sel} .reply-input`, 'My original reply text');
  await page.evaluate((s) => document.querySelector(`${s} .reply-send-btn`).click(), sel);
  await page.waitForTimeout(300);

  const replyOwnerBtns = await page.evaluate((s) => {
    const item = [...document.querySelectorAll(`${s} .reply-item`)].pop();
    return { edit: !!item.querySelector('[data-edit-reply]'), del: !!item.querySelector('[data-delete-reply]') };
  }, sel);
  console.log('Reply owner buttons present:', replyOwnerBtns);

  await page.evaluate((s) => {
    const item = [...document.querySelectorAll(`${s} .reply-item`)].pop();
    item.querySelector('[data-edit-reply]').click();
  }, sel);
  await page.waitForTimeout(200);
  const replyEditPrefilled = await page.evaluate((s) => document.querySelector(`${s} .edit-reply-input`)?.value, sel);
  console.log('Reply edit input prefilled:', replyEditPrefilled);
  await page.fill(`${sel} .edit-reply-input`, 'My edited reply text');
  await page.evaluate((s) => document.querySelector(`${s} [data-save-reply]`).click(), sel);
  await page.waitForTimeout(300);
  const replyAfterEdit = await page.evaluate((s) => {
    const item = [...document.querySelectorAll(`${s} .reply-item`)].pop();
    return { text: item.querySelector('.reply-text')?.textContent, edited: !!item.querySelector('.edited-tag') };
  }, sel);
  console.log('Reply after edit:', replyAfterEdit);
  await page.screenshot({ path: `${SD}/reply_edited.png` });

  const replyCountBefore = await page.evaluate((s) => document.querySelectorAll(`${s} .reply-item`).length, sel);
  await page.evaluate((s) => {
    const item = [...document.querySelectorAll(`${s} .reply-item`)].pop();
    item.querySelector('[data-delete-reply]').click();
  }, sel);
  await page.waitForTimeout(200);
  const deleteConfirmShown = await page.evaluate((s) => !!document.querySelector(`${s} .delete-confirm-row`), sel);
  console.log('Reply delete confirm row shown:', deleteConfirmShown);
  await page.screenshot({ path: `${SD}/reply_delete_confirm.png` });
  await page.evaluate((s) => document.querySelector(`${s} [data-confirm-delete-reply]`).click(), sel);
  await page.waitForTimeout(300);
  const replyCountAfter = await page.evaluate((s) => document.querySelectorAll(`${s} .reply-item`).length, sel);
  console.log('Reply count before/after delete:', replyCountBefore, '->', replyCountAfter);

  console.log('=== Delete the thread itself ===');
  const threadCountBefore = await page.evaluate(() => document.querySelectorAll('.thread-card').length);
  await page.evaluate((s) => document.querySelector(`${s} [data-delete-thread]`).click(), sel);
  await page.waitForTimeout(200);
  const deleteThreadConfirmShown = await page.evaluate((s) => !!document.querySelector(`${s} .delete-confirm-row`), sel);
  console.log('Thread delete confirm row shown:', deleteThreadConfirmShown);
  await page.screenshot({ path: `${SD}/thread_delete_confirm.png` });
  await page.evaluate((s) => document.querySelector(`${s} [data-confirm-delete-thread]`).click(), sel);
  await page.waitForTimeout(300);
  const threadCountAfter = await page.evaluate(() => document.querySelectorAll('.thread-card').length);
  const stillExists = await page.evaluate((s) => !!document.querySelector(s), sel);
  console.log('Thread count before/after delete:', threadCountBefore, '->', threadCountAfter, '| deleted thread still in DOM:', stillExists);

  console.log('=== Cancel flows do not mutate data ===');
  await page.click('#newThreadBtn');
  await page.waitForTimeout(200);
  await page.fill('#newThreadTitle', 'Cancel test thread');
  await page.selectOption('#newThreadCategory', 'Questions');
  await page.fill('#newThreadBody', 'Body for cancel test.');
  await page.click('#newThreadSubmit');
  await page.waitForTimeout(300);
  const tid2 = await page.evaluate(() => document.querySelector('[data-edit-thread]').closest('.thread-card').dataset.threadId);
  const sel2 = `.thread-card[data-thread-id="${tid2}"]`;
  await page.evaluate((s) => document.querySelector(`${s} [data-edit-thread]`).click(), sel2);
  await page.waitForTimeout(150);
  await page.fill(`${sel2} .edit-title-input`, 'Should not persist');
  await page.evaluate((s) => document.querySelector(`${s} [data-cancel-thread-edit]`).click(), sel2);
  await page.waitForTimeout(200);
  const titleAfterCancel = await page.evaluate((s) => document.querySelector(`${s} .thread-title`).textContent.trim(), sel2);
  console.log('Title after cancel (should still be original "Cancel test thread"):', titleAfterCancel);

  console.log('Errors:', errors.length ? errors : 'none');
  await browser.close();
})();
