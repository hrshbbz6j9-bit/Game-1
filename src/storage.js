/* ==========================================================================
   storage.js — the ONLY file in this codebase that touches localStorage
   directly. Every persisted value has one entry in STORAGE_SCHEMA and is
   read/written through loadStorage()/saveStorage() below. Adding a new
   persisted field means adding one key here — never a new getX/setX pair
   reaching into localStorage on its own (see rule #10: that pattern is
   exactly how the pre-refactor codebase grew unmanageable).

   Concatenated as plain global-scope functions (no import/export) since
   the shipped artifact is one <script> tag with no module loader — module
   boundaries here are a source-organization/code-review convention, not
   something enforced by a bundler (Option B: no build step).
   ========================================================================== */

const STORAGE_SCHEMA = {
  aiApiKey: { key: 'lifeplay_api_key', type: 'string', default: '' },
  aiApiModel: { key: 'lifeplay_api_model', type: 'string', default: 'claude-sonnet-4-5-20250929' },
  discoveredEndings: { key: 'lifeplay_endings_discovered', type: 'json', default: [] },
};

function loadStorage(name) {
  const entry = STORAGE_SCHEMA[name];
  if (!entry) return undefined;
  try {
    const raw = localStorage.getItem(entry.key);
    if (raw == null) return entry.default;
    return entry.type === 'json' ? JSON.parse(raw) : raw;
  } catch (e) {
    return entry.default;
  }
}

function saveStorage(name, value) {
  const entry = STORAGE_SCHEMA[name];
  if (!entry) return;
  try {
    localStorage.setItem(entry.key, entry.type === 'json' ? JSON.stringify(value) : value);
  } catch (e) {
    // storage unavailable (private browsing, quota, etc.) — fail silently, same as prior call sites
  }
}
