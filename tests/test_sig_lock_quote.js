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

  console.log('=== LOCKED THREAD ===');
  // First thread card should be the locked/pinned announcement
  const lockInfo = await page.evaluate(() => {
    const card = document.querySelector('.thread-card');
    return {
      hasLockIcon: card.querySelector('.pin-icon')?.textContent?.includes('🔒') || card.innerHTML.includes('🔒'),
      tagText: card.querySelector('.thread-tag')?.textContent
    };
  });
  console.log('Locked card tag/icon:', lockInfo);

  await page.evaluate(() => document.querySelector('.thread-card .thread-top').click());
  await page.waitForTimeout(300);
  const lockedBodyState = await page.evaluate(() => {
    const card = document.querySelector('.thread-card.open');
    return {
      hasLockedMessage: !!card.querySelector('.locked-message'),
      hasReplyInput: !!card.querySelector('.reply-input')
    };
  });
  console.log('Locked thread open state:', lockedBodyState);
  await page.screenshot({ path: `${SD}/locked_thread.png` });

  console.log('=== SIGNATURE ===');
  await page.click('#editProfileBtn');
  await page.waitForTimeout(300);
  await page.fill('#profileSignatureInput', '8 months mewing | trust the process');
  await page.click('#profileSave');
  await page.waitForTimeout(300);

  // Open a non-locked thread and post a reply
  await page.evaluate(() => document.querySelectorAll('.thread-card .thread-top')[2].click());
  await page.waitForTimeout(300);
  await page.fill('.thread-card.open .reply-input', 'Testing signature display.');
  await page.evaluate(() => document.querySelector('.thread-card.open .reply-send-btn').click());
  await page.waitForTimeout(300);
  const sigShown = await page.evaluate(() => {
    const items = [...document.querySelectorAll('.thread-card.open .reply-item')];
    const last = items[items.length - 1];
    return last.querySelector('.post-signature')?.textContent || null;
  });
  console.log('Signature shown under new reply:', sigShown);
  await page.screenshot({ path: `${SD}/signature_reply.png` });

  console.log('=== QUOTE REPLY ===');
  const quoteBtnCount = await page.evaluate(() => document.querySelectorAll('.thread-card.open .quote-btn').length);
  console.log('Quote buttons rendered:', quoteBtnCount);
  await page.evaluate(() => document.querySelector('.thread-card.open .quote-btn').click());
  await page.waitForTimeout(300);
  const quotedPreview = await page.evaluate(() => document.querySelector('.thread-card.open .quoted-reply span')?.textContent || null);
  console.log('Quoted preview text:', quotedPreview);
  await page.screenshot({ path: `${SD}/quote_preview.png` });

  await page.fill('.thread-card.open .reply-input', 'agreed with this take');
  await page.evaluate(() => document.querySelector('.thread-card.open .reply-send-btn').click());
  await page.waitForTimeout(300);
  const lastReplyText = await page.evaluate(() => {
    const items = [...document.querySelectorAll('.thread-card.open .reply-text')];
    return items[items.length - 1]?.textContent || null;
  });
  console.log('Quoted reply submitted text:', lastReplyText);
  const quoteClearedAfterSend = await page.evaluate(() => !document.querySelector('.thread-card.open .quoted-reply'));
  console.log('Quote box cleared after send:', quoteClearedAfterSend);

  // Test cancel-quote button
  await page.evaluate(() => document.querySelector('.thread-card.open .quote-btn').click());
  await page.waitForTimeout(200);
  await page.evaluate(() => document.querySelector('.thread-card.open [data-cancel-quote]').click());
  await page.waitForTimeout(200);
  const quoteClearedAfterCancel = await page.evaluate(() => !document.querySelector('.thread-card.open .quoted-reply'));
  console.log('Quote box cleared after cancel:', quoteClearedAfterCancel);

  console.log('Errors:', errors.length ? errors : 'none');
  await browser.close();
})();
