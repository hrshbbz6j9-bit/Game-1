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
  await page.waitForTimeout(600);
  await page.evaluate(() => { const w = document.getElementById("welcomeOverlay"); if (w && w.classList.contains("show")) document.getElementById("welcomeClose").click(); });

  console.log('=== Banner shows with new modern layout ===');
  const iconText = await page.textContent('.ad-banner-icon');
  const sponsoredText = await page.textContent('.ad-banner-sponsored');
  const adText = await page.textContent('#adBannerText');
  console.log('Icon monogram:', iconText, '| Sponsored label:', sponsoredText, '| Ad text:', adText);

  console.log('=== Tapping the card opens Remove Ads paywall ===');
  await page.evaluate(() => document.getElementById('adBannerCard').click());
  await page.waitForTimeout(300);
  const removeAdsShown = await page.evaluate(() => document.getElementById('removeAdsOverlay').classList.contains('show'));
  console.log('Remove Ads overlay shown after tapping card:', removeAdsShown);
  await page.click('#removeAdsClose');
  await page.waitForTimeout(200);

  console.log('=== Dismiss (x) hides banner for the session without opening paywall ===');
  await page.evaluate(() => document.getElementById('adBannerDismiss').click());
  await page.waitForTimeout(400);
  const removeAdsShownAfterDismiss = await page.evaluate(() => document.getElementById('removeAdsOverlay').classList.contains('show'));
  const bannerHiddenAfterDismiss = await page.evaluate(() => document.getElementById('adBanner').classList.contains('hidden'));
  console.log('Paywall did NOT open from dismiss click:', !removeAdsShownAfterDismiss);
  console.log('Banner hidden after dismiss:', bannerHiddenAfterDismiss);
  await page.screenshot({ path: `${SD}/ad_banner_dismissed.png` });

  console.log('=== Content shifts up correctly after dismiss (no dead space) ===');
  const appPaddingTop = await page.evaluate(() => getComputedStyle(document.getElementById('app')).paddingTop);
  console.log('App padding-top after dismiss:', appPaddingTop);

  console.log('=== Dismiss is session-only: reload brings the banner back ===');
  await page.reload();
  await page.waitForTimeout(500);
  const bannerBackAfterReload = await page.evaluate(() => !document.getElementById('adBanner').classList.contains('hidden'));
  console.log('Banner visible again after reload (dismiss was not permanent):', bannerBackAfterReload);

  console.log('=== Permanent Remove Ads purchase still works and persists ===');
  await page.evaluate(() => document.getElementById('adBannerCard').click());
  await page.waitForTimeout(200);
  await page.click('#removeAdsCta');
  await page.waitForTimeout(300);
  const bannerHiddenAfterPurchase = await page.evaluate(() => document.getElementById('adBanner').classList.contains('hidden'));
  await page.reload();
  await page.waitForTimeout(400);
  const bannerStillHiddenAfterReload = await page.evaluate(() => document.getElementById('adBanner').classList.contains('hidden'));
  console.log('Banner hidden immediately after purchase:', bannerHiddenAfterPurchase, '| still hidden after reload:', bannerStillHiddenAfterReload);

  console.log('Errors:', errors.length ? errors : 'none');
  await browser.close();
})();
