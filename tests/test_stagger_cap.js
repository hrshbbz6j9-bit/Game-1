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

  console.log('=== Full unfiltered list: animation delay caps out instead of growing unbounded ===');
  const delays = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('.term-card')];
    return { total: cards.length, first: cards[0]?.style.animationDelay, tenth: cards[9]?.style.animationDelay, fiftieth: cards[49]?.style.animationDelay, last: cards[cards.length - 1]?.style.animationDelay };
  });
  console.log('Total cards rendered:', delays.total);
  console.log('Delay on card #1:', delays.first, '| #10:', delays.tenth, '| #50:', delays.fiftieth, '| last:', delays.last);
  console.log('Max delay stays capped at 0.36s (not growing to ~13s for 451 items):', delays.last === '0.36s');

  console.log('=== Cards near the end of the list are actually visible shortly after render (not stuck at opacity 0) ===');
  await page.waitForTimeout(500);
  const lastCardOpacity = await page.evaluate(() => {
    const cards = document.querySelectorAll('.term-card');
    const last = cards[cards.length - 1];
    return getComputedStyle(last).opacity;
  });
  console.log('Last card computed opacity 500ms after render (should be 1, not 0):', lastCardOpacity);

  console.log('Errors:', errors.length ? errors : 'none');
  await browser.close();
})();
