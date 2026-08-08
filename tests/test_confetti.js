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

  console.log('=== First-ever load seeds baseline, no confetti fires ===');
  const seededStored = await page.evaluate(() => localStorage.getItem('looksmax_unlocked_achievements'));
  console.log('Seeded unlocked-achievements storage:', seededStored);
  await page.waitForTimeout(2600);
  const canvasAfterSeed = await page.evaluate(() => !!document.querySelector('canvas'));
  console.log('No confetti canvas after initial seed (should be false):', canvasAfterSeed);

  console.log('=== Posting first thread unlocks "First Steps" -> confetti + toast ===');
  await page.click('#newThreadBtn');
  await page.waitForTimeout(200);
  await page.fill('#newThreadTitle', 'My first thread ever');
  await page.selectOption('#newThreadCategory', 'Fitness');
  await page.fill('#newThreadBody', 'Testing achievement celebration.');
  await page.click('#newThreadSubmit');
  await page.waitForTimeout(400);
  const immediateToast = await page.evaluate(() => document.getElementById('toast')?.textContent);
  console.log('Immediate toast:', immediateToast);

  // Wait for the queued celebration (2400ms after the queue starts processing)
  await page.waitForTimeout(2300);
  const achievementToast = await page.evaluate(() => document.getElementById('toast')?.textContent);
  const achievementToastVisible = await page.evaluate(() => document.getElementById('toast')?.classList.contains('show'));
  console.log('Achievement toast:', achievementToast, '| visible:', achievementToastVisible);
  const canvasDuringConfetti = await page.evaluate(() => !!document.querySelector('canvas'));
  console.log('Confetti canvas present during celebration:', canvasDuringConfetti);
  await page.screenshot({ path: `${SD}/confetti_burst.png` });

  console.log('=== Storage updated to include the new achievement ===');
  await page.waitForTimeout(2500);
  const storedAfter = await page.evaluate(() => JSON.parse(localStorage.getItem('looksmax_unlocked_achievements')));
  console.log('Stored unlocked achievements now includes First Steps:', storedAfter.includes('First Steps'));

  console.log('=== Canvas cleans itself up after the animation ends ===');
  await page.waitForTimeout(2500);
  const canvasAfterAnim = await page.evaluate(() => !!document.querySelector('canvas'));
  console.log('Canvas removed after animation completes:', !canvasAfterAnim);

  console.log('=== Reduced motion: toast still fires, no canvas ===');
  await page.evaluate(() => { localStorage.clear(); });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  await page.waitForTimeout(300);
  await page.evaluate(() => { const w = document.getElementById("welcomeOverlay"); if (w && w.classList.contains("show")) document.getElementById("welcomeClose").click(); });
  await page.evaluate(() => document.querySelector('.nav-tab[data-view="forum"]').click());
  await page.waitForTimeout(1700);
  await page.evaluate(() => { const o = document.getElementById('popupAdOverlay'); if (o.classList.contains('show')) document.getElementById('popupAdClose').click(); });
  await page.click('#newThreadBtn');
  await page.waitForTimeout(200);
  await page.fill('#newThreadTitle', 'Reduced motion test thread');
  await page.selectOption('#newThreadCategory', 'Fitness');
  await page.fill('#newThreadBody', 'Testing reduced motion.');
  await page.click('#newThreadSubmit');
  await page.waitForTimeout(2700);
  const toastUnderReducedMotion = await page.evaluate(() => document.getElementById('toast')?.textContent);
  const canvasUnderReducedMotion = await page.evaluate(() => !!document.querySelector('canvas'));
  console.log('Toast still shows under reduced motion:', toastUnderReducedMotion);
  console.log('No confetti canvas under reduced motion:', !canvasUnderReducedMotion);

  console.log('Errors:', errors.length ? errors : 'none');
  await browser.close();
})();
