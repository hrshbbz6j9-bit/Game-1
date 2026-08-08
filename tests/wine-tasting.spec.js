const { test, expect } = require('@playwright/test');
const path = require('path');

const GAME_URL = 'file://' + path.resolve(__dirname, '..', 'lifeplay_phase15.html');

test.describe('wine-tasting.js', () => {
  test('the club button is hidden before age 21', async ({ page }) => {
    await page.goto(GAME_URL);
    await page.evaluate(() => {
      startNewLife();
      closeModal();
      state.age = 18;
      openActivitiesPanel();
    });
    const hasButton = await page.locator('[data-action="open-wine-tasting"]').count();
    expect(hasButton).toBe(0);
  });

  test('opening the panel and tasting a wine works via real delegated clicks', async ({ page }) => {
    await page.goto(GAME_URL);
    await page.evaluate(() => {
      startNewLife();
      closeModal();
      state.age = 25;
      openActivitiesPanel();
    });
    await page.locator('[data-action="open-wine-tasting"]').click();
    await expect(page.locator('#panel-title')).toHaveText('Wine Tasting');

    await page.locator('[data-action="taste-wine"][data-wine="House Red"]').click();
    const tastings = await page.evaluate(() => state.wineTasting.tastings);
    expect(tastings).toBe(1);
  });

  test('identify-rate and rare-vintage-windfall rates roughly match configuration', async ({ page }) => {
    await page.goto(GAME_URL);
    const identify = await page.evaluate(() => {
      startNewLife();
      state.age = 25;
      let identified = 0;
      const trials = 2000;
      for (let i = 0; i < trials; i++) {
        state.wineTasting = { tastings: 0, palate: 0, rareFinds: 0 };
        tasteWine('House Red');
        if (state.wineTasting.palate > 0) identified++;
      }
      return identified / trials;
    });
    expect(identify).toBeGreaterThan(0.15);
    expect(identify).toBeLessThan(0.25);

    const rareFinds = await page.evaluate(() => {
      let finds = 0;
      const trials = 2000;
      for (let i = 0; i < trials; i++) {
        state.wineTasting = { tastings: 0, palate: 0, rareFinds: 0 };
        tasteWine('Rare Grand Cru');
        if (state.wineTasting.rareFinds > 0) finds++;
      }
      return finds / trials;
    });
    expect(rareFinds).toBeGreaterThan(0.04);
    expect(rareFinds).toBeLessThan(0.13);
  });

  test('25 tastings unlocks the wine club regular achievement', async ({ page }) => {
    await page.goto(GAME_URL);
    const achievements = await page.evaluate(() => {
      startNewLife();
      state.age = 25;
      for (let i = 0; i < 25; i++) tasteWine('House Red');
      return [...state.achievements];
    });
    expect(achievements).toContain('wine_club_regular_ach');
  });
});
