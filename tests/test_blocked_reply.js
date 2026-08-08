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
  const dismissChrome = async () => {
    await page.click('#welcomeClose').catch(() => {});
    await page.waitForTimeout(200);
    await page.click('.nav-tab[data-view="forum"]');
    await page.waitForTimeout(1700);
    await page.evaluate(() => { const o = document.getElementById('popupAdOverlay'); if (o && o.classList.contains('show')) document.getElementById('popupAdClose').click(); });
    await page.waitForTimeout(200);
  };

  await page.goto(filePath);
  await page.waitForTimeout(300);
  await dismissChrome();

  console.log('=== Post our own thread, inject a reply from another user, block them ===');
  await page.click('#newThreadBtn');
  await page.waitForTimeout(200);
  await page.fill('#newThreadTitle', 'Reply blocking test thread');
  await page.fill('#newThreadBody', 'checking blocked-user replies collapse.');
  await page.click('#newThreadSubmit');
  await page.waitForTimeout(300);

  await page.evaluate(() => {
    const threads = JSON.parse(localStorage.getItem('looksmax_threads'));
    const t = threads.find(t => t.title === 'Reply blocking test thread');
    t.replies.push({ author: 'orthobound', text: 'reply from a user we will block' });
    t.replies.push({ author: 'derma.simplified', text: 'reply from a normal user' });
    localStorage.setItem('looksmax_threads', JSON.stringify(threads));
    localStorage.setItem('looksmax_blocked', JSON.stringify(['orthobound']));
  });
  await page.reload();
  await page.waitForTimeout(300);
  await dismissChrome();

  console.log('=== Open the thread, the blocked reply is collapsed, the other reply is not ===');
  await page.click('.thread-top:has-text("Reply blocking test thread")');
  await page.waitForTimeout(200);
  const replyState = await page.evaluate(() => {
    const items = [...document.querySelectorAll('.thread-card.open .reply-item')];
    return items.map(i => i.textContent.replace(/\s+/g, ' ').trim());
  });
  console.log(JSON.stringify(replyState, null, 2));
  await page.screenshot({ path: `${SD}/modern/38_blocked_reply_collapsed.png` });

  console.log('=== Unblocking from the reply placeholder restores the full reply ===');
  await page.click('.thread-card.open [data-unblock-reply]');
  await page.waitForTimeout(200);
  const replyStateAfterUnblock = await page.evaluate(() => {
    const items = [...document.querySelectorAll('.thread-card.open .reply-item')];
    return items.map(i => i.textContent.replace(/\s+/g, ' ').trim());
  });
  console.log(JSON.stringify(replyStateAfterUnblock, null, 2));
  const storedBlocked = await page.evaluate(() => JSON.parse(localStorage.getItem('looksmax_blocked') || '[]'));
  console.log('Stored blocked after unblock:', storedBlocked);

  console.log('Errors:', errors.length ? errors : 'none');
  await browser.close();
})();
