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
  await page.click('#welcomeClose');
  await page.waitForTimeout(200);
  await page.click('.nav-tab[data-view="courses"]');
  await page.waitForTimeout(200);
  await page.click('#sellCourseBtn');
  await page.waitForTimeout(200);

  console.log('=== Swatches are keyboard-focusable with correct aria state ===');
  const swatchInfo = await page.evaluate(() => {
    const swatches = [...document.querySelectorAll('.thumb-swatch')];
    return swatches.map(s => ({ tabindex: s.getAttribute('tabindex'), pressed: s.getAttribute('aria-pressed') }));
  });
  console.log(JSON.stringify(swatchInfo));

  console.log('=== Pressing Enter on the third swatch selects it and keeps focus on it after re-render ===');
  const swatches = await page.$$('.thumb-swatch');
  await swatches[2].focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(150);
  const afterSelect = await page.evaluate(() => {
    const swatches = [...document.querySelectorAll('.thumb-swatch')];
    const selectedIdx = swatches.findIndex(s => s.classList.contains('selected'));
    const focusedIdx = swatches.indexOf(document.activeElement);
    return { selectedIdx, focusedIdx, pressedOnFocused: document.activeElement.getAttribute('aria-pressed') };
  });
  console.log(JSON.stringify(afterSelect));

  console.log('Errors:', errors.length ? errors : 'none');
  await browser.close();
})();
