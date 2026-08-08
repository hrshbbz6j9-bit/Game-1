const { test, expect } = require('@playwright/test');
const path = require('path');

const GAME_URL = 'file://' + path.resolve(__dirname, '..', 'lifeplay_phase15.html');

test.describe('storage.js', () => {
  test('AI key/model roundtrip through loadStorage/saveStorage', async ({ page }) => {
    await page.goto(GAME_URL);
    const result = await page.evaluate(() => {
      setApiKeyP15('test-key-123');
      setApiModelP15('claude-opus-5');
      return {
        key: getApiKeyP15(),
        model: getApiModelP15(),
        rawKeyStorage: localStorage.getItem('lifeplay_api_key'),
      };
    });
    expect(result.key).toBe('test-key-123');
    expect(result.model).toBe('claude-opus-5');
    expect(result.rawKeyStorage).toBe('test-key-123');
  });

  test('discovered endings roundtrip as a Set through JSON storage', async ({ page }) => {
    await page.goto(GAME_URL);
    const result = await page.evaluate(() => {
      saveDiscoveredEndingsP89(new Set(['humanitarian', 'mars_pioneer']));
      const loaded = getDiscoveredEndingsP89();
      return {
        loaded: [...loaded].sort(),
        rawStorage: localStorage.getItem('lifeplay_endings_discovered'),
      };
    });
    expect(result.loaded).toEqual(['humanitarian', 'mars_pioneer']);
    expect(result.rawStorage).toBe(JSON.stringify(['humanitarian', 'mars_pioneer']));
  });

  test('defaults are returned when localStorage is empty', async ({ page }) => {
    await page.goto(GAME_URL);
    const result = await page.evaluate(() => {
      localStorage.clear();
      return {
        key: getApiKeyP15(),
        model: getApiModelP15(),
        endings: [...getDiscoveredEndingsP89()],
      };
    });
    expect(result.key).toBe('');
    expect(result.model).toBe('claude-sonnet-4-5-20250929');
    expect(result.endings).toEqual([]);
  });
});
