const { chromium, CHROMIUM_PATH } = require('./helpers/playwright-env');
const path = require('path');

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

  console.log('=== Forum thread author names become keyboard-focusable after render ===');
  await page.evaluate(() => document.querySelector('.nav-tab[data-view="forum"]').click());
  await page.waitForTimeout(1700);
  await page.evaluate(() => { const o = document.getElementById('popupAdOverlay'); if (o.classList.contains('show')) document.getElementById('popupAdClose').click(); });
  await page.waitForTimeout(300);
  const authorTabindex = await page.evaluate(() => {
    const el = document.querySelector('.thread-meta .author[data-author]');
    return el ? el.getAttribute('tabindex') : null;
  });
  console.log('Thread author span tabindex:', authorTabindex);

  console.log('=== Pressing Enter on a focused author name opens the member profile modal ===');
  await page.focus('.thread-meta .author[data-author]');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  const memberModalShown = await page.evaluate(() => document.getElementById('memberOverlay').classList.contains('show'));
  console.log('Member profile modal shown after Enter on author name:', memberModalShown);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);

  console.log('=== Leaderboard rows are also keyboard-focusable ===');
  await page.click('#leaderboardBtn');
  await page.waitForTimeout(300);
  const leaderboardRowTabindex = await page.evaluate(() => {
    const el = document.querySelector('.leaderboard-row[data-author]');
    return el ? el.getAttribute('tabindex') : null;
  });
  console.log('Leaderboard row tabindex:', leaderboardRowTabindex);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);

  console.log('=== Own avatar in profile card is correctly excluded (opens Edit, not member modal) ===');
  const ownAvatarTabindex = await page.evaluate(() => {
    const el = document.querySelector('#profileCard [data-author]');
    return el ? el.getAttribute('tabindex') : 'NO_ELEMENT_FOUND';
  });
  console.log('Own profile-card avatar tabindex (should be null, excluded):', ownAvatarTabindex);

  console.log('Errors:', errors.length ? errors : 'none');
  await browser.close();
})();
