# Tests

Plain Playwright scripts, not a test framework — no `describe`/`it`, no
built-in assertion library. Each `test_*.js` file launches the app from
`../looksmaxxing_dictionary.html`, drives it through a scenario, and prints
what it found. A script "passes" if it exits 0 (nothing thrown); read its own
console output to see *what* it actually checked and assert on.

This is a stopgap, not the target state — see `CLAUDE.md` at the repo root
for why, and what a real assertion-based runner should look like once the app
itself is modularized enough to unit-test pieces in isolation.

## Running

```
npm test                    # every test_*.js file
node tests/run-all.js NAME  # only files whose name contains NAME
node tests/test_foo.js      # a single file directly, full output
```

`npm test` prints each script's console output as it runs, then a pass/fail
summary. Non-zero exit ends the run with a failure summary.

## Environment

`tests/helpers/playwright-env.js` resolves Playwright and (in this project's
dev container) a pre-fetched Chromium binary at a fixed path, so tests run
here with no network access needed. On a normal machine, run:

```
npm install
npx playwright install chromium
```

and the same test files work unmodified — the helper falls back to a normal
`playwright` install automatically.

## Writing a new test

- Copy the shortest existing file that resembles your scenario (`test_alive.js`
  is close to a minimal template) rather than starting from scratch.
- `require('./helpers/playwright-env')` for `chromium` + `CHROMIUM_PATH`.
- Resolve the app with `path.resolve(__dirname, '..', 'looksmaxxing_dictionary.html')`.
- If you need to write files (screenshots, downloads), use
  `path.join(__dirname, '.artifacts', ...)` — gitignored, safe to write to,
  Playwright creates missing subdirectories for you.
- If you need a fixture file (e.g. an image to upload), put it in
  `tests/fixtures/` and reference it with `path.join(__dirname, 'fixtures', ...)`.
  Don't reference paths outside this repo — a test that only works in one
  specific container isn't a regression test, it's a demo.
- End with `console.log('Errors:', errors.length ? errors : 'none');` after
  collecting `pageerror`/console-`error` events, matching every existing file
  — it's not enforced by tooling, just the convention every other test uses.
