# CLAUDE.md

## What this repo is
Looksmaxxing Dictionary — a mobile-first static web app (dictionary +
community forum + course marketplace). No backend; all state lives in
`localStorage`. Deployed as static files (GitHub Pages), entry point
`index.html` → `looksmaxxing_dictionary.html`.

`lifeplay_phase15.html` / `lifeplay_phase16.html` were an unrelated life-sim
project that used to share this repo — removed. This repo now contains only
the Looksmaxxing Dictionary.

## Two decisions this file used to flag as open — now resolved

1. **No build step.** Decided: stay single-file, enforce boundaries by
   convention + review, not tooling. `looksmaxxing_dictionary.html` continues
   to be committed and deployed as-is — no Vite, no bundler, no separate
   build output. This is a real tradeoff, not a free win: it means weaker
   guarantees than real `import`/`export` module boundaries would give.
   Section discipline (below) is how we compensate.
2. **LifePlay files: deleted**, not migrated elsewhere. Gone from this repo
   as of this decision.

## Current state vs. target state — be honest about which one you're in

`looksmaxxing_dictionary.html` is still a single ~9,700-line file (HTML + one
`<style>` block + one script IIFE), including a ~3,000-line hardcoded
dictionary-content array. That has NOT been fixed yet — the rules below
describe the target shape for that same single file, not a promise that it
already looks like this.

What *has* shipped: a real, git-tracked test suite (`/tests`, run via
`npm test`) — previously every regression check lived only in an ephemeral
session scratchpad and left no trace in the repo. That gap is closed.

## Target shape (still one file — organized by discipline, not tooling)

Since there's no build step, "module" isn't literal here — it means a
clearly-delimited, single-responsibility region of the same file, in a fixed
order, each held to the same size/purity rules a real file would have:

```
looksmaxxing_dictionary.html
  <style>                one stylesheet, organized by view domain (top to
                          bottom: tokens → base → dictionary → forum →
                          courses → modals), not a flat unordered dump
  <script> (one IIFE)
    STATE                one shared getState(key, fallback) / setState(key,
                          value) pair, used by every feature — not 17+ hand-
                          rolled loadX()/saveX() copies. Nothing outside this
                          region touches `localStorage` directly.
    RENDER                "data in, HTML string out" functions. No DOM
                          writes, no addEventListener calls in this region.
    DOM / EVENTS          DOM writes + event delegation. Listeners attached
                          ONCE per container via delegation, never
                          re-attached on re-render.
    FEATURES              self-contained features (scanner, achievements,
                          notifications, paywall) — each a clearly-banked
                          section, not interleaved with unrelated ones.
    INIT                  composition root — the only region allowed to call
                          across all the others above.
data/terms-data.js         dictionary content ONLY: `const TERMS = [...]`,
                          nothing else. Loaded via a plain <script> tag
                          before the main script, same as today's markup —
                          not `fetch()`/JSON, because fetching a local file
                          from a `file://` page (how this app is tested) hits
                          a browser CORS wall with no server in front of it.
                          A classic <script src> has no such restriction and
                          needs no build tooling. This is the one place a
                          second file is worth it even without a build step.
tests/                    Playwright test scripts + fixtures. Real,
                          committed, run via `npm test`.                     ✅ done
tests/README.md           how to run tests and how to write a new one.       ✅ done
index.html                entry point, deploys as-is
```

## Hard rules

1. **No new state without going through the shared `getState`/`setState`
   pair.** Before writing a new `loadX()`/`saveX()` pair, search for the
   shared helper first — this codebase has 17+ near-identical
   `try { JSON.parse(localStorage.getItem(...)) } catch {}` pairs because
   that search didn't happen. Consolidating them into one helper is the
   single highest-value cleanup available that doesn't touch rendering at all.
2. **No content mixed into the application logic.** Dictionary terms, course
   seed data, and similar static content live in their own file
   (`data/terms-data.js`, loaded via `<script src>`), never as a literal
   sitting in the middle of the app's script. ~3,000 lines move out of the
   logic file for free, no build step required.
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
6. **Region size ceiling: ~400 lines per named section** (STATE, RENDER,
   DOM/EVENTS, per-feature blocks under FEATURES). Crossing it is a signal to
   split the section further (e.g. one feature's state helpers get their own
   clearly-banked sub-region), not a target to write toward.
7. **Function size ceiling: ~40 lines.** A render function that also filters,
   sorts, and wires events is three functions wearing a trenchcoat.
8. **Every new stateful feature ships with a test file under `/tests`,
   committed in the same PR/commit, and `npm test` passing before you call it
   done.** "I ran the tests locally" is not evidence unless it's in the repo.
9. **One feature or one refactor step per commit.** Don't mix structural
   refactoring with new functionality in the same commit — makes both harder
   to review and impossible to bisect.
10. **Before adding a new `loadX`/`saveX`-shaped pair, stop and search first.**
    That exact pattern, copy-pasted, is how this codebase grew unmanageable
    the first time. This is rule 1 again because it's the rule most likely to
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
- If a change would push a section over its size ceiling, split it as part
  of the same change rather than filing a "refactor later" note. Later
  doesn't come on its own; it comes when someone schedules it.
- If you're adding a feature that touches `localStorage`, DOM rendering, and
  event wiring, write it as three things even inside the current single file
  (three clearly separated functions in their respective STATE/RENDER/DOM
  regions), not one function that does all three.
