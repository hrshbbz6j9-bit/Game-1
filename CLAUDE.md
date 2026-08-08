# CLAUDE.md

## What this repo is
Looksmaxxing Dictionary — a mobile-first static web app (dictionary +
community forum + course marketplace). No backend; all state lives in
`localStorage`. Deployed as static files (GitHub Pages), entry point
`index.html` → `looksmaxxing_dictionary.html`.

`[DECISION NEEDED]` `lifeplay_phase15.html` / `lifeplay_phase16.html` are a
different, unrelated project (a life-sim game) that happens to live in this
repo. Until resolved: do not add to them, do not reference them from the
dictionary app, do not delete them without the repo owner's say-so. Target:
moved to their own repo.

## Current state vs. target state — be honest about which one you're in

As of this file's creation, `looksmaxxing_dictionary.html` is still a single
~9,700-line file (HTML + one `<style>` block + one script IIFE), including a
~3,000-line hardcoded dictionary-content array. That has NOT been fixed yet.
What *has* shipped: a real, git-tracked test suite (`/tests`, run via
`npm test`) — previously every regression check lived only in an ephemeral
session scratchpad and left no trace in the repo. That gap is closed; the
file-structure gap is still open pending the decision below.

`[DECISION NEEDED]` Whether to introduce a build step (Vite, vanilla JS, no
framework) to enable real `import`/`export` module boundaries, bundled back
to static output for deploy — vs. staying single-file and enforcing
boundaries by convention + review only. Recommended: take the build step —
9,700 lines in one shared closure is past where discipline alone holds the
line. But it changes the deploy model (build output instead of committing
raw HTML directly), so it's a call for the repo owner, not an assumption to
bake into tooling silently.

Until that's decided, treat every rule below marked "(module)" as aspirational
for the eventual split, and every rule NOT marked that way as binding right now,
inside the current single file.

## Target architecture

```
/data/                    static JSON content (terms.json, courses-seed.json)     (module)
/src/state/storage.js     the ONLY module allowed to call localStorage directly   (module)
/src/state/*.js           one file per state domain (favorites, forum, courses,
                           moderation, profile) — imports storage.js, exports
                           typed get/set + a single `toggleX`-style helper factory (module)
/src/render/*.js          one file per view domain — pure "data in, HTML string
                           out" functions. No DOM writes, no event listeners.      (module)
/src/dom/*.js             DOM writes + event delegation. Listeners attached ONCE
                           via delegation on a stable ancestor, never re-attached
                           per re-render.                                          (module)
/src/features/*.js        self-contained features (scanner, achievements,
                           notifications, paywall)                                 (module)
/src/main.js              composition root — the only file allowed to import
                           from every layer above                                  (module)
/src/styles/               tokens.css + one file per view domain, mirroring /render (module)
/tests/                   Playwright test scripts + fixtures. Real, committed,
                           run via `npm test`.                                     ✅ done
/tests/README.md          how to run tests and how to write a new one.             ✅ done
index.html                entry point, deploys as-is (or as build output, if
                           the build-step decision above lands on "yes")
```

## Hard rules (binding today, single-file or not)

1. **No new state without going through the shared persistence pattern.**
   Today that means: before writing a new `loadX()`/`saveX()` pair, search for
   an existing one shaped like what you need — this codebase has 17+ near-
   identical `try { JSON.parse(localStorage.getItem(...)) } catch {}` pairs
   because that check didn't happen. Once `src/state/storage.js` exists
   (module), this becomes: never call `localStorage` outside that file.
2. **No content in `.js`.** Dictionary terms, course seed data, and similar
   static content belong in JSON, never as JS literals inside a script file —
   this is the single highest-value cleanup available (~3,000 lines) and
   doesn't require the build-step decision to start.
3. **A function that returns/builds an HTML string must not call
   `addEventListener`.** Rendering and event-wiring are different
   responsibilities; today's render functions (`renderThreads()` and similar)
   violate this and are the top refactor targets, not a pattern to extend.
4. **`data-*` attributes for behavior, classes for styling — never both from
   the same identifier.** If JS needs to find an element, use `data-*` or an
   `id`. If CSS needs to style it, use a class. Don't `querySelector` a class
   that's also a visual styling hook.
5. **No inline `style=""` in markup or template strings**, except values
   genuinely computed at runtime (a dynamic gradient, a percentage width).
   Anything static belongs in the stylesheet.
6. **File size ceiling: 400 lines.** Crossing it is a signal to split by
   responsibility, not a target to write toward. (The current monolith
   predates this rule — it's the reason the rule exists, not an exception to it.)
7. **Function size ceiling: ~40 lines.** A render function that also filters,
   sorts, and wires events is three functions wearing a trenchcoat.
8. **Every new stateful feature ships with a test file under `/tests`,
   committed in the same PR/commit, and `npm test` passing before you call it
   done.** "I ran the tests locally" is not evidence unless it's in the repo —
   this was true and unenforced before; now it's enforced by the fact the
   suite actually lives here.
9. **One feature or one refactor step per commit.** Don't mix structural
   refactoring with new functionality in the same commit — makes both harder
   to review and impossible to bisect.
10. **Before adding a new `loadX`/`saveX`-shaped pair, stop and search first.**
    That exact pattern, copy-pasted, is how the pre-refactor state grew
    unmanageable. This is rule 1 again because it's the rule most likely to
    get skipped under deadline pressure — it's the one that matters most.

## Code style
- 2-space indent, double quotes, semicolons — matches existing code; don't
  introduce a second style into the same file.
- Prefer `const`; `let` only for values that are actually reassigned.
- Name `data-*` attributes and CSS classes for what they *are*
  (`data-thread-id`, `.thread-card`), not for what they currently do.
- No abbreviated/cryptic names for anything touching state (`blockedUsers`,
  not `bU`).

## Before you write code
- Check whether the state key, render pattern, or helper you're about to add
  already exists. Duplicated near-identical helpers are this codebase's
  single biggest historical problem — search first, every time.
- If a change would push a file over the 400-line ceiling, split it as part
  of the same change rather than filing a "refactor later" note. Later
  doesn't come on its own; it comes when someone schedules it.
- If you're adding a feature that touches `localStorage`, DOM rendering, and
  event wiring, write it as three things even inside the current single file
  (three clearly separated functions/sections), not one function that does
  all three — so the eventual module split is a copy-paste, not a rewrite.
