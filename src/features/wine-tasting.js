/* ==========================================================================
   wine-tasting.js — Wine Tasting Club: a repeatable tasting activity,
   distinct from the general Hobbies system (hobbies/wine isn't one of
   its ten entries) and from the Genie/Fortune Teller novelty activities
   in that it builds a real "palate" skill over time, occasionally
   turning up a rare bottle worth real money. First feature written
   under the Option B module rules: data-* delegated events instead of
   inline onclick, static tasting list in data/wine-tasting.json instead
   of a JS literal, no inline style attributes.
   ========================================================================== */

function wineTier(tierNum) {
  return WINE_TASTING_DATA.find((w) => w.tier === tierNum) || WINE_TASTING_DATA[0];
}

function ensureWineTastingState() {
  if (!state.wineTasting) state.wineTasting = { tastings: 0, palate: 0, rareFinds: 0 };
  return state.wineTasting;
}

function tasteWine(wineName) {
  const wine = WINE_TASTING_DATA.find((w) => w.name === wineName);
  if (!wine) return;
  const wt = ensureWineTastingState();
  wt.tastings++;
  const identifyChance = clamp(20 + wt.palate * 2, 20, 85);
  if (chance(identifyChance)) {
    wt.palate = Math.min(wt.palate + 1, 50);
    state.stats.happiness = clamp(state.stats.happiness + rand(2, 6), 0, 100);
    log(`You correctly pick out the ${wine.region} notes in the ${wine.name}. Your palate is getting sharper.`, 'good');
    checkAchievement('sommelier_palate_ach');
  } else {
    state.stats.happiness = clamp(state.stats.happiness + rand(1, 3), 0, 100);
    log(`You enjoy the ${wine.name}, though you couldn't place the region if your life depended on it.`, 'neutral');
  }
  if (wine.tier >= 4 && chance(8)) {
    const payout = rand(500, 4000);
    state.money += payout;
    wt.rareFinds++;
    log(`This bottle turns out to be a rare, undervalued vintage. You sell your remaining case for ${fmtMoney(payout)}.`, 'good');
    checkAchievement('rare_vintage_ach');
  }
  if (wt.tastings >= 25) checkAchievement('wine_club_regular_ach');
  openWineTastingPanel();
}

function buildWineTastingHtml() {
  const wt = ensureWineTastingState();
  let html = `<div class="list-item"><div class="li-main"><b>Wine Tasting Club</b><span>Palate ${wt.palate}/50 · ${wt.tastings} tastings${wt.rareFinds ? ' · ' + wt.rareFinds + ' rare finds' : ''}</span></div></div>`;
  html += `<p style="color:var(--sub)">A sharper palate means you catch more of what's actually in the glass.</p>`;
  WINE_TASTING_DATA.forEach((wine) => {
    html += `<button class="btn btn-block" data-action="taste-wine" data-wine="${wine.name}">${wine.name} — ${wine.region}</button>`;
  });
  return html;
}

function openWineTastingPanel() {
  openPanel('Wine Tasting', buildWineTastingHtml());
}

registerAction('taste-wine', (el) => tasteWine(el.dataset.wine));
registerAction('open-wine-tasting', openWineTastingPanel);

const _origOpenActivitiesPanel_WineTasting = openActivitiesPanel;
openActivitiesPanel = function () {
  _origOpenActivitiesPanel_WineTasting();
  if (state.inPrison || state.age < 21) return;
  const body = $('panel-body');
  const btn = document.createElement('button');
  btn.className = 'btn btn-block';
  btn.dataset.action = 'open-wine-tasting';
  btn.textContent = '🍷 Wine Tasting Club' + (state.wineTasting ? ' (' + state.wineTasting.tastings + ')' : '');
  body.appendChild(btn);
};

Object.assign(ACHIEVEMENTS, {
  sommelier_palate_ach: 'Correctly identified a wine’s region',
  rare_vintage_ach: 'Found a rare, valuable vintage',
  wine_club_regular_ach: 'Attended 25+ wine tastings',
});
