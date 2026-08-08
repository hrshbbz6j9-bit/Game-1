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

  console.log('=== No photo initially: letter avatar shown everywhere ===');
  const noPhotoInitially = await page.evaluate(() => !document.querySelector('#profileCard .avatar img'));
  console.log('Letter avatar (no img) in profile card initially:', noPhotoInitially);

  console.log('=== Open Edit Profile, upload photo ===');
  await page.click('#editProfileBtn');
  await page.waitForTimeout(200);
  const previewBeforeUpload = await page.evaluate(() => !document.querySelector('#profilePhotoPreview img'));
  console.log('Preview shows letter (no img) before upload:', previewBeforeUpload);

  await page.setInputFiles('#profilePhotoInput', path.join(__dirname, 'fixtures', 'test_photo.png'));
  await page.waitForTimeout(500);
  const previewAfterUpload = await page.evaluate(() => !!document.querySelector('#profilePhotoPreview img'));
  console.log('Preview shows uploaded image after upload:', previewAfterUpload);
  await page.screenshot({ path: `${SD}/profile_photo_uploaded.png` });

  await page.click('#profileSave');
  await page.waitForTimeout(300);

  console.log('=== Photo now appears on profile card, own posts, member profile ===');
  const profileCardHasImg = await page.evaluate(() => !!document.querySelector('#profileCard .avatar img'));
  console.log('Profile card avatar shows uploaded photo:', profileCardHasImg);

  await page.click('#newThreadBtn');
  await page.waitForTimeout(200);
  await page.fill('#newThreadTitle', 'Testing my new profile photo');
  await page.selectOption('#newThreadCategory', 'Fitness');
  await page.fill('#newThreadBody', 'Just checking my avatar shows up right.');
  await page.click('#newThreadSubmit');
  await page.waitForTimeout(300);
  const threadCardHasImg = await page.evaluate(() => !!document.querySelector('.thread-card .thread-meta .avatar img'));
  console.log('Own new thread shows photo avatar:', threadCardHasImg);
  await page.screenshot({ path: `${SD}/profile_photo_in_thread.png` });

  console.log('=== Other users still show letter avatars (no photo mechanism for them) ===');
  const otherAuthorHasLetterAvatar = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('.thread-card')];
    const other = cards.find(c => !c.querySelector('.thread-meta .author')?.textContent.includes('you'));
    return other ? !other.querySelector('.thread-meta .avatar img') : null;
  });
  console.log('Other seed author still shows letter avatar (no img):', otherAuthorHasLetterAvatar);

  console.log('=== Persists across reload ===');
  await page.reload();
  await page.waitForTimeout(300);
  await page.evaluate(() => document.querySelector('.nav-tab[data-view="forum"]').click());
  await page.waitForTimeout(1700);
  await page.evaluate(() => { const o = document.getElementById('popupAdOverlay'); if (o.classList.contains('show')) document.getElementById('popupAdClose').click(); });
  await page.waitForTimeout(200);
  const persistedAfterReload = await page.evaluate(() => !!document.querySelector('#profileCard .avatar img'));
  console.log('Photo persists after reload:', persistedAfterReload);

  console.log('=== Remove photo reverts to letter avatar everywhere ===');
  await page.click('#editProfileBtn');
  await page.waitForTimeout(200);
  await page.click('#profilePhotoRemove');
  await page.waitForTimeout(300);
  const previewAfterRemove = await page.evaluate(() => !document.querySelector('#profilePhotoPreview img'));
  console.log('Preview reverted to letter after remove:', previewAfterRemove);
  await page.click('#profileSave');
  await page.waitForTimeout(200);
  const cardAfterRemove = await page.evaluate(() => !document.querySelector('#profileCard .avatar img'));
  console.log('Profile card reverted to letter avatar after remove:', cardAfterRemove);

  console.log('Errors:', errors.length ? errors : 'none');
  await browser.close();
})();
