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
  await page.evaluate(() => document.querySelector('.nav-tab[data-view="courses"]').click());
  await page.waitForTimeout(200);

  console.log('=== 6 swatches render, one pre-selected ===');
  await page.click('#sellCourseBtn');
  await page.waitForTimeout(200);
  const swatchCount = await page.evaluate(() => document.querySelectorAll('.thumb-swatch').length);
  const selectedCount = await page.evaluate(() => document.querySelectorAll('.thumb-swatch.selected').length);
  console.log('Swatches shown:', swatchCount, '| pre-selected:', selectedCount);
  await page.screenshot({ path: `${SD}/thumb_swatches.png` });

  console.log('=== Selecting a swatch updates selection state ===');
  await page.evaluate(() => document.querySelectorAll('.thumb-swatch')[2].click());
  await page.waitForTimeout(150);
  const selectedIdx = await page.evaluate(() => {
    const swatches = [...document.querySelectorAll('.thumb-swatch')];
    return swatches.findIndex(s => s.classList.contains('selected'));
  });
  console.log('Selected swatch index after clicking index 2:', selectedIdx);

  console.log('=== Listing the course uses the picked gradient ===');
  await page.fill('#sellCourseTitle', 'Picked Thumbnail Course');
  await page.fill('#sellCoursePrice', '25');
  await page.fill('#sellCourseDesc', 'Testing thumbnail selection.');
  const pickedGradient = await page.evaluate(() => document.querySelectorAll('.thumb-swatch')[2].style.background);
  await page.click('#sellCourseSubmit');
  await page.waitForTimeout(300);
  const courseThumbBg = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('.course-card')];
    const card = cards.find(c => c.textContent.includes('Picked Thumbnail Course'));
    return card ? card.querySelector('.course-thumb').style.background : null;
  });
  console.log('Picked gradient (swatch):', pickedGradient);
  console.log('Applied gradient (thumb):', courseThumbBg);
  console.log('Gradients match:', pickedGradient === courseThumbBg);

  console.log('=== Course creator uses actual username, not hardcoded "you" ===');
  await page.click('#editProfileBtn').catch(() => {});
  await page.evaluate(() => document.querySelector('.nav-tab[data-view="forum"]').click());
  await page.waitForTimeout(1700);
  await page.evaluate(() => { const o = document.getElementById('popupAdOverlay'); if (o.classList.contains('show')) document.getElementById('popupAdClose').click(); });
  await page.click('#editProfileBtn');
  await page.waitForTimeout(200);
  await page.fill('#profileUsernameInput', 'renamed_user');
  await page.click('#profileSave');
  await page.waitForTimeout(200);
  await page.evaluate(() => document.querySelector('.nav-tab[data-view="courses"]').click());
  await page.waitForTimeout(200);
  await page.click('#sellCourseBtn');
  await page.waitForTimeout(200);
  await page.fill('#sellCourseTitle', 'Renamed Creator Course');
  await page.fill('#sellCoursePrice', '30');
  await page.fill('#sellCourseDesc', 'Testing creator name.');
  await page.click('#sellCourseSubmit');
  await page.waitForTimeout(300);
  const creatorText = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('.course-card')];
    const card = cards.find(c => c.textContent.includes('Renamed Creator Course'));
    return card ? card.querySelector('.course-creator').textContent : null;
  });
  console.log('Creator line for new course after renaming:', creatorText);

  console.log('Errors:', errors.length ? errors : 'none');
  await browser.close();
})();
