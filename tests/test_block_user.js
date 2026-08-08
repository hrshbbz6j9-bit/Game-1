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

  console.log('=== Post our own thread so we can click our own author name ===');
  await page.click('#newThreadBtn');
  await page.waitForTimeout(200);
  await page.fill('#newThreadTitle', 'Self profile test thread');
  await page.fill('#newThreadBody', 'Just checking the block button is absent on my own profile.');
  await page.click('#newThreadSubmit');
  await page.waitForTimeout(300);

  console.log('=== Own profile has no Block button ===');
  const myUsername = await page.evaluate(() => localStorage.getItem('looksmax_username') || 'you');
  await page.evaluate((name) => {
    const el = [...document.querySelectorAll('#threadList [data-author]')].find(e => e.dataset.author === name);
    if (el) el.click();
  }, myUsername);
  await page.waitForTimeout(300);
  const memberOpenedForSelf = await page.evaluate(() => document.getElementById('memberOverlay').classList.contains('show'));
  console.log('Member profile opened for self:', memberOpenedForSelf);
  const ownBlockBtn = await page.$('#memberBlockBtn');
  console.log('Block button on own profile (should be null):', ownBlockBtn);
  await page.click('#memberClose');
  await page.waitForTimeout(200);

  console.log('=== Find a thread author who is not us, open their profile, block them ===');
  const firstAuthor = await page.evaluate((myName) => {
    const els = [...document.querySelectorAll('#threadList [data-author]')];
    const el = els.find(e => e.dataset.author !== myName);
    return el ? el.dataset.author : null;
  }, myUsername);
  console.log('First thread author found:', firstAuthor);

  await page.evaluate((author) => {
    const el = [...document.querySelectorAll('#threadList [data-author]')].find(e => e.dataset.author === author);
    if (el) el.click();
  }, firstAuthor);
  await page.waitForTimeout(300);

  const memberVisible = await page.evaluate(() => document.getElementById('memberOverlay').classList.contains('show'));
  console.log('Member profile opened:', memberVisible);

  const blockBtnText = await page.evaluate(() => document.getElementById('memberBlockBtn')?.textContent.trim());
  console.log('Block button text before blocking:', blockBtnText);

  await page.click('#memberBlockBtn');
  await page.waitForTimeout(200);
  const blockBtnTextAfter = await page.evaluate(() => document.getElementById('memberBlockBtn')?.textContent.trim());
  const blockBtnActive = await page.evaluate(() => document.getElementById('memberBlockBtn')?.classList.contains('active'));
  console.log('Block button text after blocking:', blockBtnTextAfter, '| active class:', blockBtnActive);

  const storedBlocked = await page.evaluate(() => JSON.parse(localStorage.getItem('looksmax_blocked') || '[]'));
  console.log('Stored blocked list:', storedBlocked);

  await page.click('#memberClose');
  await page.waitForTimeout(200);

  console.log('=== Threads from blocked author now collapse to placeholder card ===');
  const threadState = await page.evaluate((author) => {
    const cards = [...document.querySelectorAll('#threadList > *')];
    const blockedCards = cards.filter(c => c.classList.contains('blocked-thread-card'));
    const stillFullCard = cards.some(c => c.classList.contains('thread-card') && c.querySelector(`[data-author="${author}"]`));
    return {
      totalCards: cards.length,
      blockedCardCount: blockedCards.length,
      blockedCardText: blockedCards[0] ? blockedCards[0].textContent.trim() : null,
      stillFullCard,
    };
  }, firstAuthor);
  console.log(JSON.stringify(threadState));
  await page.screenshot({ path: `${SD}/modern/31_blocked_thread_light.png` });

  console.log('=== Unblocking via the placeholder card restores the full thread ===');
  await page.click('.blocked-thread-card [data-unblock]');
  await page.waitForTimeout(200);
  const afterUnblock = await page.evaluate((author) => {
    const cards = [...document.querySelectorAll('#threadList > *')];
    const blockedCards = cards.filter(c => c.classList.contains('blocked-thread-card'));
    const fullCardBack = cards.some(c => c.classList.contains('thread-card') && c.querySelector(`[data-author="${author}"]`));
    return { blockedCardCount: blockedCards.length, fullCardBack };
  }, firstAuthor);
  console.log(JSON.stringify(afterUnblock));

  const storedBlockedAfter = await page.evaluate(() => JSON.parse(localStorage.getItem('looksmax_blocked') || '[]'));
  console.log('Stored blocked list after unblock:', storedBlockedAfter);

  console.log('=== Re-block via member profile toggles correctly (idempotent toggle) ===');
  await page.evaluate((author) => {
    const el = [...document.querySelectorAll('#threadList [data-author]')].find(e => e.dataset.author === author);
    if (el) el.click();
  }, firstAuthor);
  await page.waitForTimeout(300);
  await page.click('#memberBlockBtn');
  await page.waitForTimeout(200);
  await page.click('#memberBlockBtn');
  await page.waitForTimeout(200);
  const doubleToggleText = await page.evaluate(() => document.getElementById('memberBlockBtn')?.textContent.trim());
  console.log('Text after block+unblock via profile (should say Block this user):', doubleToggleText);

  console.log('Errors:', errors.length ? errors : 'none');
  await browser.close();
})();
