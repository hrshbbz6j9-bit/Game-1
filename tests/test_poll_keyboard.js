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
  await page.click('#welcomeClose');
  await page.waitForTimeout(200);

  await page.click('.nav-tab[data-view="forum"]');
  await page.waitForTimeout(1700);
  await page.evaluate(() => { const o = document.getElementById('popupAdOverlay'); if (o.classList.contains('show')) document.getElementById('popupAdClose').click(); });
  await page.waitForTimeout(200);

  console.log('=== Post a thread with a poll ===');
  await page.click('#newThreadBtn');
  await page.waitForTimeout(200);
  await page.fill('#newThreadTitle', 'Keyboard poll test thread');
  await page.fill('#newThreadBody', 'Testing keyboard voting.');
  await page.click('#newThreadPollToggle');
  await page.waitForTimeout(100);
  await page.fill('#newThreadPollQuestion', 'Which is better?');
  const optionInputs = await page.$$('#newThreadPollOptions input');
  await optionInputs[0].fill('Option A');
  await optionInputs[1].fill('Option B');
  await page.click('#newThreadSubmit');
  await page.waitForTimeout(300);

  console.log('=== Poll options are keyboard-focusable with correct aria-labels before voting ===');
  const beforeVote = await page.evaluate(() => {
    const opts = [...document.querySelectorAll('.poll-option')];
    return opts.map(o => ({ tabindex: o.getAttribute('tabindex'), role: o.getAttribute('role'), label: o.getAttribute('aria-label') }));
  });
  console.log(JSON.stringify(beforeVote));

  console.log('=== Pressing Enter on the first poll option votes and keeps focus on it after re-render ===');
  const opts = await page.$$('.poll-option');
  await opts[0].focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(200);
  const afterVote = await page.evaluate(() => {
    const opts = [...document.querySelectorAll('.poll-option')];
    const votedIdx = opts.findIndex(o => o.classList.contains('voted-for'));
    const focusedIdx = opts.indexOf(document.activeElement);
    return {
      votedIdx,
      focusedIdx,
      focusedLabel: document.activeElement.getAttribute('aria-label'),
      totalVotesText: document.querySelector('.poll-total-votes')?.textContent,
    };
  });
  console.log(JSON.stringify(afterVote));
  await page.screenshot({ path: `${SD}/modern/35_poll_voted_keyboard.png` });

  console.log('=== Pressing Enter again on a different option is a no-op (already voted) ===');
  const opts2 = await page.$$('.poll-option');
  await opts2[1].focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(200);
  const afterSecondAttempt = await page.evaluate(() => {
    const opts = [...document.querySelectorAll('.poll-option')];
    return { votedIdx: opts.findIndex(o => o.classList.contains('voted-for')), totalVotesText: document.querySelector('.poll-total-votes')?.textContent };
  });
  console.log('Should be unchanged (still option 0, still 1 vote):', JSON.stringify(afterSecondAttempt));

  console.log('Errors:', errors.length ? errors : 'none');
  await browser.close();
})();
