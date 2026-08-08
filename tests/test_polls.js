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

  console.log('=== Poll builder toggles open/closed ===');
  await page.click('#newThreadBtn');
  await page.waitForTimeout(200);
  const builderHiddenInitially = await page.evaluate(() => document.getElementById('newThreadPollBuilder').style.display === 'none');
  console.log('Poll builder hidden by default:', builderHiddenInitially);
  await page.click('#newThreadPollToggle');
  await page.waitForTimeout(150);
  const builderShown = await page.evaluate(() => document.getElementById('newThreadPollBuilder').style.display !== 'none');
  const defaultOptionRows = await page.evaluate(() => document.querySelectorAll('#newThreadPollOptions .poll-option-row').length);
  console.log('Poll builder shown after toggle:', builderShown, '| default option rows:', defaultOptionRows);

  console.log('=== Cannot remove below 2 options ===');
  await page.evaluate(() => document.querySelector('#newThreadPollOptions .poll-option-remove').click());
  await page.waitForTimeout(150);
  const rowsAfterFailedRemove = await page.evaluate(() => document.querySelectorAll('#newThreadPollOptions .poll-option-row').length);
  console.log('Rows still 2 after trying to remove down to 1:', rowsAfterFailedRemove === 2);

  console.log('=== Add a 3rd option, fill out poll, submit ===');
  await page.click('#newThreadPollAddOption');
  await page.waitForTimeout(100);
  await page.fill('#newThreadTitle', 'Which look should I go for?');
  await page.selectOption('#newThreadCategory', 'Questions');
  await page.fill('#newThreadBody', 'Torn between three directions, vote below.');
  await page.fill('#newThreadPollQuestion', 'Which direction should I commit to?');
  const optionInputs = await page.$$('#newThreadPollOptions input');
  await optionInputs[0].fill('Lean bulk + jaw training');
  await optionInputs[1].fill('Cut first, reassess');
  await optionInputs[2].fill('Focus on skin/grooming first');
  await page.screenshot({ path: `${SD}/poll_builder.png` });
  await page.click('#newThreadSubmit');
  await page.waitForTimeout(300);

  const tid = await page.evaluate(() => document.querySelector('[data-edit-thread]').closest('.thread-card').dataset.threadId);
  const sel = `.thread-card[data-thread-id="${tid}"]`;
  await page.evaluate((s) => document.querySelector(`${s} .thread-top`).click(), sel);
  await page.waitForTimeout(200);

  console.log('=== Poll renders with 3 options, no votes yet ===');
  const pollQuestionText = await page.evaluate((s) => document.querySelector(`${s} .poll-question`)?.textContent, sel);
  const optionCount = await page.evaluate((s) => document.querySelectorAll(`${s} .poll-option`).length, sel);
  const totalVotesText = await page.evaluate((s) => document.querySelector(`${s} .poll-total-votes`)?.textContent, sel);
  console.log('Poll question:', pollQuestionText, '| options:', optionCount, '| votes label:', totalVotesText);
  await page.screenshot({ path: `${SD}/poll_before_vote.png` });

  console.log('=== Vote on an option ===');
  await page.evaluate((s) => document.querySelector(`${s} [data-poll-vote="1"]`).click(), sel);
  await page.waitForTimeout(300);
  const votedForShown = await page.evaluate((s) => document.querySelector(`${s} .poll-option.voted-for`)?.textContent, sel);
  const pctShown = await page.evaluate((s) => document.querySelector(`${s} .poll-option-pct`)?.textContent, sel);
  const totalAfterVote = await page.evaluate((s) => document.querySelector(`${s} .poll-total-votes`)?.textContent, sel);
  console.log('Voted-for option text:', votedForShown, '| a percentage shown:', pctShown, '| total votes label:', totalAfterVote);
  await page.screenshot({ path: `${SD}/poll_after_vote.png` });

  console.log('=== Cannot vote twice ===');
  const votesBeforeSecondClick = await page.evaluate((s) => document.querySelector(`${s} .poll-total-votes`)?.textContent, sel);
  await page.evaluate((s) => document.querySelector(`${s} [data-poll-vote="0"]`).click(), sel);
  await page.waitForTimeout(200);
  const votesAfterSecondClick = await page.evaluate((s) => document.querySelector(`${s} .poll-total-votes`)?.textContent, sel);
  console.log('Vote count unchanged after clicking a different option post-vote:', votesBeforeSecondClick === votesAfterSecondClick);

  console.log('=== Persists across reload ===');
  await page.reload();
  await page.waitForTimeout(300);
  await page.evaluate(() => document.querySelector('.nav-tab[data-view="forum"]').click());
  await page.waitForTimeout(1700);
  await page.evaluate(() => { const o = document.getElementById('popupAdOverlay'); if (o.classList.contains('show')) document.getElementById('popupAdClose').click(); });
  await page.evaluate((s) => document.querySelector(`${s} .thread-top`).click(), sel);
  await page.waitForTimeout(200);
  const votedForAfterReload = await page.evaluate((s) => !!document.querySelector(`${s} .poll-option.voted-for`), sel);
  console.log('Still shows my vote after reload:', votedForAfterReload);

  console.log('=== Thread without poll (regular post) still works, no poll widget ===');
  await page.click('#newThreadBtn');
  await page.waitForTimeout(200);
  await page.fill('#newThreadTitle', 'Just a normal thread');
  await page.selectOption('#newThreadCategory', 'Fitness');
  await page.fill('#newThreadBody', 'No poll here.');
  await page.click('#newThreadSubmit');
  await page.waitForTimeout(300);
  const noPollWidget = await page.evaluate(() => {
    const card = document.querySelector('[data-edit-thread]').closest('.thread-card');
    return !card.querySelector('.poll-widget');
  });
  console.log('Regular thread has no poll widget:', noPollWidget);

  console.log('Errors:', errors.length ? errors : 'none');
  await browser.close();
})();
