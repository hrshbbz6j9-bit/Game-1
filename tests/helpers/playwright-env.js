"use strict";
/**
 * Resolves Playwright (and, in this dev container, the pre-fetched Chromium
 * binary) so the test suite runs unmodified both here and in a normal local
 * checkout.
 *
 * This container ships a global Playwright install and a pre-fetched Chromium
 * binary at fixed paths, with no network access required to run tests. A
 * regular clone of this repo should instead run:
 *   npm install
 *   npx playwright install chromium
 * and this file will pick that up automatically — no test file needs editing.
 */
const KNOWN_PLAYWRIGHT_PATHS = ["playwright", "/opt/node22/lib/node_modules/playwright"];

let playwright = null;
let resolvedFrom = null;
for (const candidate of KNOWN_PLAYWRIGHT_PATHS) {
  try {
    playwright = require(candidate);
    resolvedFrom = candidate;
    break;
  } catch (e) {
    // try the next candidate
  }
}
if (!playwright) {
  throw new Error(
    'Could not resolve the "playwright" module. Run `npm install` (and ' +
      "`npx playwright install chromium`), or set PLAYWRIGHT_MODULE_PATH to a valid install."
  );
}

// Only this container's known global install has a pre-fetched Chromium at a
// fixed path outside the module itself; a normal `npm install` + `playwright
// install` setup manages its own browser binary and needs no override.
const DEFAULT_CHROMIUM_PATH =
  resolvedFrom === "/opt/node22/lib/node_modules/playwright"
    ? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"
    : undefined;

module.exports = {
  ...playwright,
  CHROMIUM_PATH: process.env.PLAYWRIGHT_CHROMIUM_PATH || DEFAULT_CHROMIUM_PATH,
};
