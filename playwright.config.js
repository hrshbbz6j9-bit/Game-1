// @ts-check
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30000,
  fullyParallel: true,
  reporter: 'list',
  use: {
    launchOptions: {
      executablePath: process.env.PW_CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    },
  },
});
