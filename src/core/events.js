/* ==========================================================================
   events.js — delegated event wiring. Render functions return HTML
   strings and never call addEventListener themselves (rule #3). Instead,
   markup carries data-action (+ optional data-arg) attributes, and this
   file attaches exactly one click listener per container, once, at init.
   New features register their handlers with registerAction() rather than
   wiring their own listeners.
   ========================================================================== */

const ACTION_HANDLERS = {};

function registerAction(name, handler) {
  ACTION_HANDLERS[name] = handler;
}

function dispatchDelegatedClick(e) {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const handler = ACTION_HANDLERS[el.dataset.action];
  if (!handler) return;
  handler(el, e);
}

function initDelegatedEvents(containerIds) {
  containerIds.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', dispatchDelegatedClick);
  });
}
