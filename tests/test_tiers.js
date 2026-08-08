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
  await page.waitForTimeout(1600);
  await page.evaluate(() => { const o = document.getElementById('popupAdOverlay'); if (o.classList.contains('show')) document.getElementById('popupAdClose').click(); });
  await page.waitForTimeout(200);

  // Set a real username
  await page.click('#editProfileBtn');
  await page.waitForTimeout(200);
  await page.fill('#profileUsernameInput', 'jawline_journey');
  await page.click('#profileSave');
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${SD}/proof_1_newcomer.png` });
  console.log('1. Newcomer tier screenshot taken');

  // Post 3 threads + several replies to level up through tiers
  async function postThread(title, category, body) {
    await page.click('#newThreadBtn');
    await page.waitForTimeout(150);
    await page.fill('#newThreadTitle', title);
    await page.selectOption('#newThreadCategory', category);
    await page.fill('#newThreadBody', body);
    await page.click('#newThreadSubmit');
    await page.waitForTimeout(200);
  }

  await postThread('Week 1 of my glow up journey', 'Progress Logs', 'Starting my routine today, will update weekly.');
  await postThread('Week 2 update', 'Progress Logs', 'Skin already looking better with consistent SPF.');
  await postThread('Best jaw exercises for beginners?', 'Mewing & Jaw', 'Looking for a simple starting routine.');
  console.log('Posted 3 threads (score should be 9 -> Veteran tier)');
  await page.screenshot({ path: `${SD}/proof_2_after_threads.png` });

  // Reply to a seed thread a few times to push toward Elite
  await page.evaluate(() => document.querySelector('#forumTabs .index-chip').click()); // "All" chip to reset filter
  await page.waitForTimeout(200);
  for (let i = 0; i < 8; i++) {
    const isOpen = await page.evaluate(() => {
      const card = document.querySelector('.thread-card');
      return card && card.classList.contains('open');
    });
    if (!isOpen) {
      await page.evaluate(() => document.querySelector('.thread-card .thread-top').click());
      await page.waitForTimeout(150);
    }
    const opened = await page.$('.thread-card.open .reply-input');
    if (!opened) { console.log('WARN: thread did not open on iteration', i); continue; }
    await opened.fill(`Reply number ${i + 1} from testing.`);
    await page.evaluate(() => document.querySelector('.thread-card.open .reply-send-btn').click());
    await page.waitForTimeout(150);
  }
  console.log('Posted 8 replies (score should be 9 + 8 = 17 -> Elite tier)');
  await page.screenshot({ path: `${SD}/proof_3_elite_tier.png` });

  // Unlock premium (VIP)
  await page.evaluate(() => document.querySelector('.nav-tab[data-view="dictionary"]').click());
  await page.waitForTimeout(200);
  await page.click('#premiumPill');
  await page.waitForTimeout(300);
  await page.click('#unlockCta');
  await page.waitForTimeout(300);
  await page.evaluate(() => document.querySelector('.nav-tab[data-view="forum"]').click());
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${SD}/proof_4_vip_badge.png` });
  console.log('VIP unlocked, screenshot taken');

  // Scroll to see one of the newly posted threads with tier badge on a reply
  await page.evaluate(() => {
    const cards = document.querySelectorAll('.thread-card');
    cards[0].scrollIntoView();
  });
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${SD}/proof_5_thread_with_badges.png` });

  console.log('Errors:', errors.length ? errors : 'none');
  await browser.close();
})();
