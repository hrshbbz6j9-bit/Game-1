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

  console.log('=== No Follow button on your own profile ===');
  await page.click('#editProfileBtn');
  await page.waitForTimeout(200);
  await page.click('#profileClose');
  await page.evaluate(() => document.querySelector('#profileCard .avatar')?.click());
  await page.waitForTimeout(200);
  const memberModalOpenForSelf = await page.evaluate(() => document.getElementById('memberOverlay').classList.contains('show'));
  console.log('(sanity) member modal did not open from own avatar:', !memberModalOpenForSelf);

  console.log('=== Open another member profile, follow them ===');
  await page.evaluate(() => document.querySelectorAll('.thread-card .thread-meta .author')[2].click());
  await page.waitForTimeout(300);
  const memberName = await page.evaluate(() => document.querySelector('#memberProfileBody .profile-name')?.textContent.trim());
  console.log('Viewing member:', memberName);
  const followBtnInitial = await page.evaluate(() => document.getElementById('memberFollowBtn')?.textContent);
  console.log('Follow button initial state:', followBtnInitial);
  await page.screenshot({ path: `${SD}/follow_before.png` });

  await page.click('#memberFollowBtn');
  await page.waitForTimeout(200);
  const followBtnAfter = await page.evaluate(() => document.getElementById('memberFollowBtn')?.textContent);
  console.log('Follow button after clicking:', followBtnAfter);
  await page.screenshot({ path: `${SD}/follow_after.png` });
  await page.click('#memberClose');

  console.log('=== Following filter chip shows their threads ===');
  await page.evaluate(() => {
    const chips = [...document.querySelectorAll('#forumTabs .index-chip')];
    chips.find(c => c.textContent === '👥 Following').click();
  });
  await page.waitForTimeout(200);
  const cardCountInFollowing = await page.evaluate(() => document.querySelectorAll('.thread-card').length);
  console.log('Threads shown in Following filter (should be > 0):', cardCountInFollowing);
  await page.screenshot({ path: `${SD}/following_filter.png` });

  console.log('=== My Activity shows the followed member ===');
  await page.evaluate(() => {
    const chips = [...document.querySelectorAll('#forumTabs .index-chip')];
    chips.find(c => c.textContent === 'All').click();
  });
  await page.waitForTimeout(200);
  await page.click('#myActivityBtn');
  await page.waitForTimeout(300);
  const followingLabel = await page.textContent('#activityFollowingLabel');
  const followingRowText = await page.evaluate(() => document.querySelector('#activityFollowingList .activity-row-title')?.textContent);
  console.log('Following label:', followingLabel, '| row shown:', followingRowText);
  await page.screenshot({ path: `${SD}/my_activity_following.png` });

  console.log('=== Clicking the followed member in My Activity opens their profile ===');
  await page.click('[data-view-member]');
  await page.waitForTimeout(300);
  const memberModalShownFromActivity = await page.evaluate(() => document.getElementById('memberOverlay').classList.contains('show'));
  console.log('Member modal opened from My Activity list:', memberModalShownFromActivity);

  console.log('=== Unfollow works and updates everywhere ===');
  await page.click('#memberFollowBtn');
  await page.waitForTimeout(200);
  const followBtnAfterUnfollow = await page.evaluate(() => document.getElementById('memberFollowBtn')?.textContent);
  console.log('Follow button after unfollow:', followBtnAfterUnfollow);
  await page.click('#memberClose');
  await page.evaluate(() => {
    const chips = [...document.querySelectorAll('#forumTabs .index-chip')];
    chips.find(c => c.textContent === '👥 Following').click();
  });
  await page.waitForTimeout(200);
  const emptyStateAfterUnfollow = await page.evaluate(() => document.querySelector('.empty-state p')?.textContent);
  console.log('Empty state after unfollowing everyone:', emptyStateAfterUnfollow);

  console.log('=== Persists across reload ===');
  const allChipClicked = await page.evaluate(() => {
    const chips = [...document.querySelectorAll('#forumTabs .index-chip')];
    const allChip = chips.find(c => c.textContent === 'All');
    if (allChip) { allChip.click(); return true; }
    return false;
  });
  await page.waitForTimeout(200);
  const breadcrumbAfterAllClick = await page.evaluate(() => document.getElementById('forumBreadcrumb')?.textContent);
  console.log('All chip found and clicked:', allChipClicked, '| breadcrumb:', breadcrumbAfterAllClick);
  const debugCardCount = await page.evaluate(() => document.querySelectorAll('.thread-card').length);
  const debugAuthorCount = await page.evaluate(() => document.querySelectorAll('.thread-card .thread-meta .author').length);
  const debugOverlayShown = await page.evaluate(() => document.getElementById('memberOverlay').classList.contains('show'));
  console.log('DEBUG cards:', debugCardCount, '| authors:', debugAuthorCount, '| member overlay still shown:', debugOverlayShown);
  await page.evaluate(() => document.querySelectorAll('.thread-card .thread-meta .author')[2].click());
  await page.waitForTimeout(300);
  await page.click('#memberFollowBtn');
  await page.waitForTimeout(200);
  await page.click('#memberClose');
  await page.reload();
  await page.waitForTimeout(300);
  await page.evaluate(() => document.querySelector('.nav-tab[data-view="forum"]').click());
  await page.waitForTimeout(1700);
  await page.evaluate(() => { const o = document.getElementById('popupAdOverlay'); if (o.classList.contains('show')) document.getElementById('popupAdClose').click(); });
  await page.evaluate(() => document.querySelectorAll('.thread-card .thread-meta .author')[2].click());
  await page.waitForTimeout(300);
  const followStatePersisted = await page.evaluate(() => document.getElementById('memberFollowBtn')?.textContent);
  console.log('Follow state after reload:', followStatePersisted);

  console.log('Errors:', errors.length ? errors : 'none');
  await browser.close();
})();
