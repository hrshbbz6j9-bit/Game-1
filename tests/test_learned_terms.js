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

  console.log('=== Progress bar starts at 0 ===');
  const initialLabel = await page.textContent('.learned-progress-label');
  console.log('Initial label:', initialLabel);
  await page.screenshot({ path: `${SD}/learned_initial.png` });

  console.log('=== Mark 3 terms as learned ===');
  for (let i = 0; i < 3; i++) {
    await page.evaluate((idx) => document.querySelectorAll('.learned-btn')[idx].click(), i);
    await page.waitForTimeout(100);
  }
  const labelAfter3 = await page.textContent('.learned-progress-label');
  console.log('Label after marking 3:', labelAfter3);
  const activeCount = await page.evaluate(() => document.querySelectorAll('.learned-btn.active').length);
  console.log('Active checkmarks shown:', activeCount);
  await page.screenshot({ path: `${SD}/learned_marked.png` });

  console.log('=== Filter by Learned chip ===');
  await page.evaluate(() => {
    const chips = [...document.querySelectorAll('.index-chip')];
    chips.find(c => c.textContent === '✓ Learned').click();
  });
  await page.waitForTimeout(200);
  const cardsInLearnedView = await page.evaluate(() => document.querySelectorAll('.term-card').length);
  console.log('Terms shown in Learned filter (expect 3):', cardsInLearnedView);
  await page.screenshot({ path: `${SD}/learned_filtered.png` });

  console.log('=== Persists across reload ===');
  await page.reload();
  await page.waitForTimeout(300);
  const labelAfterReload = await page.textContent('.learned-progress-label');
  console.log('Label after reload:', labelAfterReload);

  console.log('=== Unmark reverts ===');
  await page.evaluate(() => document.querySelector('.learned-btn.active').click());
  await page.waitForTimeout(200);
  const labelAfterUnmark = await page.textContent('.learned-progress-label');
  console.log('Label after unmarking one:', labelAfterUnmark);

  console.log('=== Empty state for Learned filter when empty ===');
  await page.evaluate(() => document.querySelectorAll('.learned-btn.active').forEach(b => b.click()));
  await page.waitForTimeout(200);
  await page.evaluate(() => {
    const chips = [...document.querySelectorAll('.index-chip')];
    chips.find(c => c.textContent === '✓ Learned').click();
  });
  await page.waitForTimeout(200);
  const emptyStateText = await page.evaluate(() => document.querySelector('.empty-state p')?.textContent);
  console.log('Empty state text:', emptyStateText);

  console.log('=== Scholar achievement unlocks at 50 ===');
  await page.evaluate(() => {
    // fast-forward: directly seed 50 learned terms via localStorage + reload, matching real TERMS
  });
  const fiftyTerms = await page.evaluate(() => {
    const script = [...document.querySelectorAll('script')].map(s => s.textContent).join('');
    return null; // placeholder, we'll read TERMS differently
  });
  await page.evaluate(() => {
    // Grab term names directly from the rendered "All" list after switching back
  });
  await page.evaluate(() => {
    const chips = [...document.querySelectorAll('.index-chip')];
    chips.find(c => c.textContent === 'All').click();
  });
  await page.waitForTimeout(200);
  const names = await page.evaluate(() => [...document.querySelectorAll('.term-name')].slice(0, 50).map(el => el.textContent));
  await page.evaluate((names) => {
    localStorage.setItem('looksmax_learned_terms', JSON.stringify(names));
  }, names);
  await page.reload();
  await page.waitForTimeout(300);
  await page.evaluate(() => document.querySelector('.nav-tab[data-view="forum"]').click());
  await page.waitForTimeout(1700);
  await page.evaluate(() => { const o = document.getElementById('popupAdOverlay'); if (o.classList.contains('show')) document.getElementById('popupAdClose').click(); });
  await page.click('#achievementsBtn');
  await page.waitForTimeout(300);
  const scholarUnlocked = await page.evaluate(() => {
    const items = [...document.querySelectorAll('.achievement-item')];
    const scholar = items.find(i => i.textContent.includes('Scholar'));
    return scholar ? scholar.classList.contains('unlocked') : null;
  });
  console.log('Scholar achievement unlocked after 50 learned:', scholarUnlocked);

  console.log('Errors:', errors.length ? errors : 'none');
  await browser.close();
})();
