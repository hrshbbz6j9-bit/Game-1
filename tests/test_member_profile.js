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

  console.log('=== Click author name in thread-meta ===');
  await page.evaluate(() => document.querySelectorAll('.thread-card .thread-meta .author')[2].click());
  await page.waitForTimeout(300);
  const memberShown = await page.evaluate(() => document.getElementById('memberOverlay').classList.contains('show'));
  const memberName = await page.evaluate(() => document.querySelector('#memberProfileBody .profile-name')?.textContent);
  console.log('Member modal shown:', memberShown, '| name:', memberName);
  await page.screenshot({ path: `${SD}/member_profile.png` });

  console.log('=== Recent threads list & jump ===');
  const threadRowCount = await page.evaluate(() => document.querySelectorAll('#memberProfileBody [data-jump-thread]').length);
  console.log('Recent thread rows:', threadRowCount);
  if (threadRowCount > 0) {
    await page.evaluate(() => document.querySelector('#memberProfileBody [data-jump-thread]').click());
    await page.waitForTimeout(400);
    const memberClosedAfterJump = await page.evaluate(() => !document.getElementById('memberOverlay').classList.contains('show'));
    const someThreadOpen = await page.evaluate(() => !!document.querySelector('.thread-card.open'));
    console.log('Member overlay closed after jump:', memberClosedAfterJump, '| thread opened:', someThreadOpen);
  }

  console.log('=== Click author in a reply ===');
  await page.evaluate(() => document.querySelectorAll('.thread-card .thread-top')[3].click());
  await page.waitForTimeout(300);
  const replyAuthorExists = await page.evaluate(() => !!document.querySelector('.thread-card.open .reply-author'));
  if (replyAuthorExists) {
    await page.evaluate(() => document.querySelector('.thread-card.open .reply-author').click());
    await page.waitForTimeout(300);
    const shownFromReply = await page.evaluate(() => document.getElementById('memberOverlay').classList.contains('show'));
    console.log('Member modal shown from reply-author click:', shownFromReply);
    await page.click('#memberClose');
    await page.waitForTimeout(200);
  }

  console.log('=== Click leaderboard row ===');
  await page.click('#leaderboardBtn');
  await page.waitForTimeout(300);
  await page.evaluate(() => document.querySelectorAll('.leaderboard-row')[1].click());
  await page.waitForTimeout(300);
  const shownFromLeaderboard = await page.evaluate(() => document.getElementById('memberOverlay').classList.contains('show'));
  const nameFromLeaderboard = await page.evaluate(() => document.querySelector('#memberProfileBody .profile-name')?.textContent);
  console.log('Member modal shown from leaderboard row:', shownFromLeaderboard, '| name:', nameFromLeaderboard);
  await page.screenshot({ path: `${SD}/member_profile_from_leaderboard.png` });

  console.log('=== Own avatar in profile card should NOT open member modal (uses Edit instead) ===');
  await page.click('#memberClose');
  await page.click('#leaderboardClose');
  await page.waitForTimeout(200);
  await page.evaluate(() => document.querySelector('#profileCard .avatar').click());
  await page.waitForTimeout(300);
  const memberShownFromOwnCard = await page.evaluate(() => document.getElementById('memberOverlay').classList.contains('show'));
  console.log('Member modal shown from own profile-card avatar (should be false):', memberShownFromOwnCard);

  console.log('Errors:', errors.length ? errors : 'none');
  await browser.close();
})();
