#!/usr/bin/env node
"use strict";
/**
 * Runs every test_*.js script in this directory against
 * ../looksmaxxing_dictionary.html and reports a pass/fail summary.
 *
 * These are plain Playwright scripts, not a test framework (no describe/it,
 * no built-in assertions) — each one launches the app, drives it, and prints
 * what it found. A script "passes" if it exits 0 (no uncaught error, no
 * thrown assertion). Read a script's own console output if you need to know
 * *what* it checked.
 *
 * Usage: npm test
 *        node tests/run-all.js [name-substring-filter]
 */
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const testsDir = __dirname;
const filter = process.argv[2];

let files = fs
  .readdirSync(testsDir)
  .filter((f) => f.startsWith("test_") && f.endsWith(".js"));
if (filter) files = files.filter((f) => f.includes(filter));
files.sort();

if (!files.length) {
  console.error(filter ? `No test_*.js files matched "${filter}".` : "No test_*.js files found in tests/.");
  process.exit(1);
}

console.log(`Running ${files.length} Playwright test script${files.length === 1 ? "" : "s"}...\n`);

const failed = [];
for (const file of files) {
  const full = path.join(testsDir, file);
  process.stdout.write(`===== ${file} =====\n`);
  try {
    const output = execFileSync(process.execPath, [full], { encoding: "utf8", stdio: "pipe" });
    process.stdout.write(output);
  } catch (err) {
    process.stdout.write(err.stdout || "");
    process.stderr.write(err.stderr || String(err.message || err));
    failed.push(file);
  }
}

console.log("\n=== Summary ===");
console.log(`${files.length - failed.length}/${files.length} passed.`);
if (failed.length) {
  console.log("Failed:");
  failed.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
}
process.exit(0);
