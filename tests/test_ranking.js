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

  console.log('=== Tier badge shows icon + numeric rank on profile card ===');
  const badgeText = await page.evaluate(() => document.querySelector('#profileCard .tier-badge')?.textContent);
  const rankNumberText = await page.evaluate(() => document.querySelector('#profileCard .rank-number')?.textContent);
  console.log('Tier badge text (should include icon):', badgeText);
  console.log('Rank number shown:', rankNumberText);

  console.log('=== Progress bar exists and starts near 0% ===');
  const barWidthInitial = await page.evaluate(() => document.querySelector('#profileCard .rank-progress-fill')?.style.width);
  console.log('Progress bar width initially:', barWidthInitial);
  await page.screenshot({ path: `${SD}/ranking_profile_card.png` });

  console.log('=== Post 1 thread (3 pts) -- should NOT yet rank up (need 3 for Regular, exactly hits it) ===');
  await page.click('#newThreadBtn');
  await page.waitForTimeout(200);
  await page.fill('#newThreadTitle', 'Ranking test thread');
  await page.selectOption('#newThreadCategory', 'Fitness');
  await page.fill('#newThreadBody', 'Testing rank up toast.');
  await page.click('#newThreadSubmit');
  await page.waitForTimeout(400);
  const toastImmediate = await page.evaluate(() => document.getElementById('toast')?.textContent);
  console.log('Immediate toast after posting:', toastImmediate);
  await page.waitForTimeout(2300);
  const toastDelayed = await page.evaluate(() => document.getElementById('toast')?.textContent);
  const toastDelayedShown = await page.evaluate(() => document.getElementById('toast')?.classList.contains('show'));
  console.log('Delayed rank-up toast text:', toastDelayed, '| visible:', toastDelayedShown);
  const badgeAfterFirstThread = await page.evaluate(() => document.querySelector('#profileCard .tier-badge')?.textContent.trim());
  console.log('Tier badge after first thread:', badgeAfterFirstThread);

  console.log('=== Leaderboard rows show icon in tier badge ===');
  await page.click('#leaderboardBtn');
  await page.waitForTimeout(300);
  const leaderboardBadge = await page.evaluate(() => document.querySelector('.leaderboard-row .tier-badge')?.textContent);
  console.log('First leaderboard row tier badge text:', leaderboardBadge);
  await page.screenshot({ path: `${SD}/ranking_leaderboard.png` });
  await page.click('#leaderboardClose');

  console.log('=== Member profile modal shows icon + rank ===');
  await page.evaluate(() => document.querySelectorAll('.thread-card .thread-meta .author')[2].click());
  await page.waitForTimeout(300);
  const memberBadge = await page.evaluate(() => document.querySelector('#memberProfileBody .tier-badge')?.textContent);
  console.log('Member profile tier badge text:', memberBadge);
  await page.click('#memberClose');

  console.log('Errors:', errors.length ? errors : 'none');
  await browser.close();
})();
