const { chromium, CHROMIUM_PATH } = require('./helpers/playwright-env');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ executablePath: CHROMIUM_PATH });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const filePath = 'file://' + path.resolve(__dirname, '..', 'looksmaxxing_dictionary.html');
  await page.goto(filePath);
  await page.waitForTimeout(300);
  await page.evaluate(() => { const w = document.getElementById("welcomeOverlay"); if (w && w.classList.contains("show")) document.getElementById("welcomeClose").click(); });

  console.log('=== Typing into search on the full 451-term unfiltered list: per-keystroke render time ===');
  const timings = await page.evaluate(async () => {
    const input = document.getElementById('searchInput');
    const results = [];
    const chars = ['m', 'e', 'w', 'i', 'n', 'g'];
    let value = '';
    for (const c of chars) {
      value += c;
      const t0 = performance.now();
      input.value = value;
      input.dispatchEvent(new Event('input'));
      const t1 = performance.now();
      results.push(Math.round((t1 - t0) * 100) / 100);
    }
    return results;
  });
  console.log('Per-keystroke render time (ms):', timings);
  console.log('Max:', Math.max(...timings), 'ms | Avg:', (timings.reduce((a,b)=>a+b,0)/timings.length).toFixed(2), 'ms');

  await browser.close();
})();
