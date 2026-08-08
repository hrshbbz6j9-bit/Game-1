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

  console.log('=== Badge starts hidden ===');
  const badgeInitial = await page.evaluate(() => ({
    text: document.getElementById('notifBadge').textContent,
    shown: document.getElementById('notifBadge').classList.contains('show')
  }));
  console.log('Initial badge:', badgeInitial);

  console.log('=== Post own thread, then simulate someone else replying (localStorage) ===');
  await page.click('#newThreadBtn');
  await page.waitForTimeout(200);
  await page.fill('#newThreadTitle', 'Notif test thread');
  await page.selectOption('#newThreadCategory', 'Fitness');
  await page.fill('#newThreadBody', 'Waiting for replies.');
  await page.click('#newThreadSubmit');
  await page.waitForTimeout(300);
  const tid = await page.evaluate(() => document.querySelector('[data-edit-thread]').closest('.thread-card').dataset.threadId);

  // Simulate another user replying by mutating localStorage directly, then reloading
  await page.evaluate((id) => {
    const threads = JSON.parse(localStorage.getItem('looksmax_threads'));
    const t = threads.find(x => x.id == id);
    t.replies.push({ author: 'quietjawline', text: 'Nice thread, following this.' });
    localStorage.setItem('looksmax_threads', JSON.stringify(threads));
  }, tid);
  await page.reload();
  await page.waitForTimeout(300);
  await page.evaluate(() => document.querySelector('.nav-tab[data-view="forum"]').click());
  await page.waitForTimeout(1700);
  await page.evaluate(() => { const o = document.getElementById('popupAdOverlay'); if (o.classList.contains('show')) document.getElementById('popupAdClose').click(); });
  await page.waitForTimeout(200);

  const badgeAfterReply = await page.evaluate(() => ({
    text: document.getElementById('notifBadge').textContent,
    shown: document.getElementById('notifBadge').classList.contains('show')
  }));
  console.log('Badge after reply from another user:', badgeAfterReply);

  await page.click('#notifBtn');
  await page.waitForTimeout(300);
  const notifRowText = await page.evaluate(() => document.querySelector('#notifList .activity-row-meta')?.textContent);
  console.log('Notification row text:', notifRowText);
  await page.screenshot({ path: `${SD}/notifications_list.png` });

  console.log('=== Click notification jumps and marks seen ===');
  await page.click('[data-notif-thread]');
  await page.waitForTimeout(400);
  const notifOverlayClosed = await page.evaluate(() => !document.getElementById('notifOverlay').classList.contains('show'));
  const someThreadOpen = await page.evaluate(() => !!document.querySelector('.thread-card.open'));
  console.log('Overlay closed after click:', notifOverlayClosed, '| thread opened:', someThreadOpen);

  const badgeAfterClick = await page.evaluate(() => ({
    text: document.getElementById('notifBadge').textContent,
    shown: document.getElementById('notifBadge').classList.contains('show')
  }));
  console.log('Badge after jumping to notified thread (should be back to hidden):', badgeAfterClick);

  console.log('=== Mark all read works ===');
  await page.evaluate((id) => {
    const threads = JSON.parse(localStorage.getItem('looksmax_threads'));
    const t = threads.find(x => x.id == id);
    t.replies.push({ author: 'matte_or_bust', text: 'Another reply to build up notifications.' });
    localStorage.setItem('looksmax_threads', JSON.stringify(threads));
  }, tid);
  await page.reload();
  await page.waitForTimeout(300);
  await page.evaluate(() => document.querySelector('.nav-tab[data-view="forum"]').click());
  await page.waitForTimeout(1700);
  await page.evaluate(() => { const o = document.getElementById('popupAdOverlay'); if (o.classList.contains('show')) document.getElementById('popupAdClose').click(); });
  await page.waitForTimeout(200);
  const badgeBeforeMarkAll = await page.evaluate(() => document.getElementById('notifBadge').classList.contains('show'));
  console.log('Badge shown before mark-all-read:', badgeBeforeMarkAll);
  await page.click('#notifBtn');
  await page.waitForTimeout(200);
  await page.click('#notifMarkAllRead');
  await page.waitForTimeout(200);
  const emptyStateShown = await page.evaluate(() => document.querySelector('#notifList .activity-empty')?.textContent);
  console.log('Empty state after mark all read:', emptyStateShown);
  const badgeAfterMarkAll = await page.evaluate(() => document.getElementById('notifBadge').classList.contains('show'));
  console.log('Badge shown after mark-all-read:', badgeAfterMarkAll);
  await page.screenshot({ path: `${SD}/notifications_empty.png` });

  console.log('=== Watching a thread with existing unread replies does NOT retroactively notify ===');
  await page.click('#notifClose');
  await page.waitForTimeout(200);
  await page.evaluate(() => document.querySelectorAll('.thread-card .thread-top')[3].click());
  await page.waitForTimeout(200);
  await page.evaluate(() => document.querySelectorAll('.thread-card .thread-top')[3].click());
  await page.waitForTimeout(200);
  await page.evaluate(() => document.querySelector('.thread-card [data-watch]').click());
  await page.waitForTimeout(200);
  const badgeAfterWatch = await page.evaluate(() => document.getElementById('notifBadge').classList.contains('show'));
  console.log('Badge shown right after watching a thread (should be false):', badgeAfterWatch);

  console.log('Errors:', errors.length ? errors : 'none');
  await browser.close();
})();
