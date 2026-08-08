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

  console.log('=== Post our own thread so we control its title/id ===');
  await page.click('#newThreadBtn');
  await page.waitForTimeout(200);
  await page.fill('#newThreadTitle', 'Notification blocking test thread');
  await page.fill('#newThreadBody', 'checking blocked users do not trigger notifications.');
  await page.click('#newThreadSubmit');
  await page.waitForTimeout(300);

  console.log('=== Inject a reply from "orthobound" directly into localStorage, then reload ===');
  await page.evaluate(() => {
    const threads = JSON.parse(localStorage.getItem('looksmax_threads'));
    const t = threads.find(t => t.title === 'Notification blocking test thread');
    t.replies.push({ author: 'orthobound', text: 'reply from soon-to-be-blocked user' });
    localStorage.setItem('looksmax_threads', JSON.stringify(threads));
    const seen = JSON.parse(localStorage.getItem('looksmax_notif_seen') || '{}');
    seen[t.id] = 0;
    localStorage.setItem('looksmax_notif_seen', JSON.stringify(seen));
  });
  await page.reload();
  await page.waitForTimeout(300);
  await dismissChrome();

  const badgeBeforeBlock = await page.evaluate(() => document.getElementById('notifBadge').textContent);
  const badgeVisibleBeforeBlock = await page.evaluate(() => document.getElementById('notifBadge').classList.contains('show'));
  console.log('Notif badge before blocking the replier:', badgeBeforeBlock, '| visible:', badgeVisibleBeforeBlock);

  console.log('=== Block "orthobound" via localStorage, reload, badge should drop this thread from notifications ===');
  await page.evaluate(() => {
    localStorage.setItem('looksmax_blocked', JSON.stringify(['orthobound']));
  });
  await page.reload();
  await page.waitForTimeout(300);
  await dismissChrome();

  const badgeAfterBlock = await page.evaluate(() => document.getElementById('notifBadge').textContent);
  const badgeVisibleAfterBlock = await page.evaluate(() => document.getElementById('notifBadge').classList.contains('show'));
  console.log('Notif badge after blocking the replier:', badgeAfterBlock, '| visible:', badgeVisibleAfterBlock);

  await page.click('#notifBtn');
  await page.waitForTimeout(200);
  const notifListEmptyText = await page.evaluate(() => document.getElementById('notifList').textContent.trim());
  console.log('Notif list contents (should be caught-up empty state):', notifListEmptyText);
  await page.screenshot({ path: `${SD}/modern/37_notif_empty_after_block.png` });
  await page.click('#notifClose');
  await page.waitForTimeout(200);

  console.log('=== A reply from a non-blocked user still triggers a notification ===');
  await page.evaluate(() => {
    const threads = JSON.parse(localStorage.getItem('looksmax_threads'));
    const t = threads.find(t => t.title === 'Notification blocking test thread');
    t.replies.push({ author: 'derma.simplified', text: 'reply from a normal user' });
    localStorage.setItem('looksmax_threads', JSON.stringify(threads));
  });
  await page.reload();
  await page.waitForTimeout(300);
  await dismissChrome();

  const badgeAfterNormalReply = await page.evaluate(() => document.getElementById('notifBadge').textContent);
  console.log('Notif badge after a reply from a non-blocked user (should be 1):', badgeAfterNormalReply);
  await page.click('#notifBtn');
  await page.waitForTimeout(200);
  const notifRowText = await page.evaluate(() => document.getElementById('notifList').textContent.trim());
  console.log('Notif list contents (should mention derma.simplified, not orthobound):', notifRowText);

  console.log('Errors:', errors.length ? errors : 'none');
  await browser.close();
})();
