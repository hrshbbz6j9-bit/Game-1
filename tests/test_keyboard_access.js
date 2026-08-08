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

  console.log('=== Dictionary term card: Enter key on focused term-top toggles it open ===');
  const firstTermTop = await page.$('.term-top');
  await firstTermTop.focus();
  const ariaExpandedBefore = await page.evaluate(() => document.querySelector('.term-top').getAttribute('aria-expanded'));
  await page.keyboard.press('Enter');
  await page.waitForTimeout(200);
  const bodyVisibleAfterEnter = await page.evaluate(() => !!document.querySelector('.term-card.open'));
  const ariaExpandedAfter = await page.evaluate(() => document.querySelector('.term-card.open .term-top')?.getAttribute('aria-expanded'));
  console.log('aria-expanded before:', ariaExpandedBefore, '-> after Enter:', ariaExpandedAfter, '| card open:', bodyVisibleAfterEnter);

  console.log('=== Space key toggles it closed again ===');
  const openTermTop = await page.$('.term-card.open .term-top');
  await openTermTop.focus();
  await page.keyboard.press(' ');
  await page.waitForTimeout(200);
  const stillOpenAfterSpace = await page.evaluate(() => !!document.querySelector('.term-card.open'));
  console.log('Card open after Space (should be false, toggled closed):', stillOpenAfterSpace);

  console.log('=== Tabbing reaches term-top (real keyboard focus order) ===');
  await page.evaluate(() => document.activeElement.blur());
  await page.keyboard.press('Tab');
  await page.waitForTimeout(100);
  const focusedIsSearchOrTermTop = await page.evaluate(() => document.activeElement.tagName + '.' + document.activeElement.className);
  console.log('First tab stop (some focusable element, sanity check):', focusedIsSearchOrTermTop);

  console.log('=== Forum thread-top: Enter key opens the thread ===');
  await page.evaluate(() => document.querySelector('.nav-tab[data-view="forum"]').click());
  await page.waitForTimeout(1700);
  await page.evaluate(() => { const o = document.getElementById('popupAdOverlay'); if (o.classList.contains('show')) document.getElementById('popupAdClose').click(); });
  await page.waitForTimeout(200);
  const firstThreadTop = await page.$('.thread-top');
  await firstThreadTop.focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(200);
  const threadOpenAfterEnter = await page.evaluate(() => !!document.querySelector('.thread-body .thread-preview'));
  console.log('Thread body visible after Enter on focused thread-top:', threadOpenAfterEnter);

  console.log('=== Focus-visible outline style applies (no crash, just checking computed style exists) ===');
  const outlineWidth = await page.evaluate(() => getComputedStyle(document.querySelector('.thread-top')).outlineWidth);
  console.log('Outline width defined (non-crashing check):', outlineWidth);

  console.log('=== Term of the Day card: keyboard Enter toggles expanded state ===');
  await page.evaluate(() => document.querySelector('.nav-tab[data-view="dictionary"]').click());
  await page.waitForTimeout(200);
  const totdAriaBefore = await page.evaluate(() => document.getElementById('totdCard').getAttribute('aria-expanded'));
  await page.focus('#totdCard');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(150);
  const totdAriaAfter = await page.evaluate(() => document.getElementById('totdCard').getAttribute('aria-expanded'));
  const totdExpandedClass = await page.evaluate(() => document.getElementById('totdCard').classList.contains('expanded'));
  console.log('totd aria-expanded before:', totdAriaBefore, '-> after Enter:', totdAriaAfter, '| expanded class present:', totdExpandedClass);

  console.log('Errors:', errors.length ? errors : 'none');
  await browser.close();
})();
