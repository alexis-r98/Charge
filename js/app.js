import * as store from './store.js';
import { RECIPES, SLOT_LABEL } from './data-recipes.js';
import { EX, TYPE_LABEL, TYPE_FOCUS, GROUP_LABEL, PLACES, EQ_LABEL, FAMILIES } from './data-exercises.js';
import {
  generateSession, fatigueContext, suggestedType, slotCandidates, buildExercise,
  lastPerformance, dayKey, uid, isAxial, templateFor, allowedEq, nextInFamily, isAvailable as canDo,
} from './generator.js';
import { renderWeight, weightActions, weightChange } from './weight.js';
import { FOODS, blockedBy } from './foods.js';
import { figureSVG, videoURL } from './figures.js';
import {
  ACTIVITY, SURPLUS, energyTarget, macroTargets, PORTIONS, scaleQty, fitPortions,
  BARBELL, platesPerSide, warmupSets, e1rm,
} from './calc.js';
import { progressSeries, drawProgress, METRIC_LABEL } from './progress.js';

/* ═════════════ Utilitaires ═════════════ */
const $ = (s, r = document) => r.querySelector(s);
const view = $('#view');
const sheet = $('#sheet');
const sheetBody = $('#sheet-body');
const S = () => store.get();

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);
const nf = new Intl.NumberFormat('fr-BE', { maximumFractionDigits: 2 });
const fmt = (n) => nf.format(n);
const num = (v) => {
  const n = parseFloat(String(v ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};
const mmss = (s) => {
  s = Math.max(0, Math.round(s));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};
const dateFR = (d, opts = { weekday: 'short', day: 'numeric', month: 'short' }) =>
  new Date(d).toLocaleDateString('fr-BE', opts);

const ICONS = {
  check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
  shuffle: '<path d="M16 3h5v5"/><path d="M4 20 21 3"/><path d="M21 16v5h-5"/><path d="m15 15 6 6"/><path d="m4 4 5 5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  swap: '<path d="M7 4 3 8l4 4"/><path d="M3 8h14"/><path d="m17 20 4-4-4-4"/><path d="M21 16H7"/>',
  timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  skip: '<circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/>',
  ban: '<circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/>',
  dice: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M9 9h.01M15 15h.01M15 9h.01M9 15h.01M12 12h.01"/>',
  flag: '<path d="M5 21V4h11l-2 4 2 4H5"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  upload: '<path d="M12 20V9M7 14l5-5 5 5M5 4h14"/>',
  play: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m10 9 5 3-5 3z"/>',
  scale: '<path d="M12 4v16M5 20h14M5 8h14M5 8l-3 6a3 3 0 0 0 6 0zM19 8l-3 6a3 3 0 0 0 6 0z"/>',
  calc: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01"/>',
  chart: '<path d="M4 20V4M4 20h16M7 15l4-5 3 3 5-6"/>',
  big: '<path d="M4 7V4h3M20 7V4h-3M4 17v3h3M20 17v3h-3M9 9h6v6H9z"/>',
  flame: '<path d="M12 21c4 0 7-2.5 7-6.5 0-3-2-5.5-4-7 0 2.5-1.5 4-3 4 0-3-1.5-5.5-4-7.5.5 3-3 5.5-3 10.5C5 18.5 8 21 12 21z"/>',
  bell: '<path d="M6 9a6 6 0 0 1 12 0c0 6 2 7 2 7H4s2-1 2-7M10 20a2 2 0 0 0 4 0"/>',
};
const icon = (n) => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[n]}</svg>`;

let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.hidden = true), 2600);
}

/* ═════════════ Feuille modale ═════════════ */
let sheetRenderer = null;
let sheetAfter = null;
function openSheet(render, after = null) {
  sheetRenderer = render;
  sheetAfter = after;
  sheetBody.innerHTML = `<div class="sheet-grip"></div>${render()}`;
  if (!sheet.open) sheet.showModal();
  sheetBody.scrollTop = 0;
  sheet.scrollTop = 0;
  after?.();
}
function refreshSheet() {
  if (sheet.open && sheetRenderer) {
    const y = sheet.scrollTop;
    sheetBody.innerHTML = `<div class="sheet-grip"></div>${sheetRenderer()}`;
    sheet.scrollTop = y;
    sheetAfter?.();
  }
}
function closeSheet() {
  if (sheet.open) sheet.close();
}
sheet.addEventListener('close', () => (sheetRenderer = null));
sheet.addEventListener('click', (e) => {
  if (e.target === sheet) closeSheet(); // clic sur le fond
});
const sheetHead = (title, eyebrow = '') => `
  <div class="sheet-head">
    <div>${eyebrow ? `<p class="eyebrow">${eyebrow}</p>` : ''}<h2 id="sheet-title">${title}</h2></div>
    <button class="icon-btn sm" data-action="close-sheet" aria-label="Fermer">${icon('x')}</button>
  </div>`;

function confirmSheet({ title, text, ok, danger = false, onOk }) {
  openSheet(() => `
    ${sheetHead(esc(title))}
    <p class="muted">${text}</p>
    <div class="btn-row" style="margin-top:20px">
      <button class="btn btn-ghost" data-action="close-sheet">Annuler</button>
      <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-action="confirm-ok">${esc(ok)}</button>
    </div>`);
  pendingConfirm = onOk;
}
let pendingConfirm = null;

/* ═════════════ Recettes & journée ═════════════ */
const DAY_SLOTS = [
  { key: 'breakfast', label: 'Petit-déj', pool: 'breakfast' },
  { key: 'lunch', label: 'Déjeuner', pool: 'main' },
  { key: 'gainer', label: 'Shake gainer', pool: 'gainer' },
  { key: 'dinner', label: 'Dîner', pool: 'main' },
  { key: 'snack', label: 'Collation', pool: 'snack' },
];
const SLOT_BY_KEY = Object.fromEntries(DAY_SLOTS.map((s) => [s.key, s]));
const COMPAT = { gainer: ['gainer', 'snack'], breakfast: ['breakfast'], main: ['lunch', 'dinner'], snack: ['snack'] };

const allRecipes = () => [...RECIPES, ...S().customRecipes];
const recipeById = (id) => allRecipes().find((r) => r.id === id);
/** Aliments exclus contenus dans la recette ([] = OK). */
const recipeBlocks = (r) => blockedBy(r, S().settings.excludedFoods, S().settings.customFoods);
const allowedRecipes = () => allRecipes().filter((r) => !recipeBlocks(r).length);

function pickRecipe(slotKey, picks, avoid = []) {
  const pool = allowedRecipes().filter((r) => r.slot === SLOT_BY_KEY[slotKey].pool);
  const others = Object.entries(picks).filter(([k]) => k !== slotKey).map(([, v]) => v);
  const tiers = [
    pool.filter((r) => !avoid.includes(r.id) && !others.includes(r.id) && r.id !== picks[slotKey]),
    pool.filter((r) => !others.includes(r.id) && r.id !== picks[slotKey]),
    pool.filter((r) => r.id !== picks[slotKey]),
    pool,
  ];
  const t = tiers.find((x) => x.length) || [];
  return t.length ? t[Math.floor(Math.random() * t.length)].id : null;
}

function ensureDay() {
  const today = dayKey();
  const st = S();
  if (st.day && st.day.date === today) {
    // recette perso supprimée ou contenant un aliment exclu (et pas encore mangée) : on repioche
    const broken = DAY_SLOTS.filter((s) => {
      const r = recipeById(st.day.picks[s.key]);
      return st.day.picks[s.key] && (!r || (recipeBlocks(r).length && !st.day.eaten[s.key]));
    });
    if (broken.length) store.update((s) => broken.forEach((b) => (s.day.picks[b.key] = pickRecipe(b.key, s.day.picks))), { silent: true });
    return;
  }
  store.update((s) => {
    const prev = s.day ? Object.values(s.day.picks) : [];
    s.recentPicks = [...prev, ...s.recentPicks].filter(Boolean).slice(0, 10);
    const picks = {};
    for (const slot of DAY_SLOTS) picks[slot.key] = pickRecipe(slot.key, picks, s.recentPicks);
    s.day = { date: today, picks, eaten: {}, off: {} };
    // plan trop copieux pour l'objectif : la collation démarre « sautée » (réactivable d'un tap)
    const total = Object.values(picks).reduce((a, id) => a + (recipeById(id)?.kcal || 0), 0);
    if (total > s.settings.kcalTarget + 400) s.day.off.snack = true;
  }, { silent: true });
}

const ui = { filter: 'all', q: '', showBlocked: false };

function macroBar(r) {
  const p = r.p * 4, c = r.c * 4, f = r.f * 9, t = p + c + f || 1;
  return `<div class="macrobar" role="img" aria-label="Répartition : protéines ${Math.round((p / t) * 100)} %, glucides ${Math.round((c / t) * 100)} %, lipides ${Math.round((f / t) * 100)} %">
    <span style="width:${(p / t) * 100}%"></span><span style="width:${(c / t) * 100}%"></span><span style="width:${(f / t) * 100}%"></span></div>`;
}
const macrosLine = (r) => `<div class="macros">
  <span><i class="dot-p"></i><b>${fmt(r.p)}</b> g P</span>
  <span><i class="dot-c"></i><b>${fmt(r.c)}</b> g G</span>
  <span><i class="dot-f"></i><b>${fmt(r.f)}</b> g L</span></div>`;

function renderNutrition() {
  ensureDay();
  const st = S();
  const { day, settings } = st;
  const active = DAY_SLOTS.filter((s) => !day.off[s.key] && recipeById(day.picks[s.key]));
  const portion = (k) => day.portions?.[k] || 1;
  const sum = (list, k) => Math.round(list.reduce((a, s) => a + (recipeById(day.picks[s.key])?.[k] || 0) * portion(s.key), 0));
  const planned = sum(active, 'kcal');
  const eatenSlots = active.filter((s) => day.eaten[s.key]);
  const eaten = sum(eatenSlots, 'kcal');
  const target = settings.kcalTarget;
  const scale = Math.max(target, planned) || 1;
  const gap = target - planned;
  const remaining = active.filter((s) => !day.eaten[s.key]);
  const canFit = remaining.length && Math.abs(gap) > 120;
  let advice = '';
  if (gap > 150) advice = `Il manque <b>${fmt(gap)} kcal</b> au plan pour atteindre l’objectif.`;
  else if (gap < -400) advice = `Plan ${fmt(-gap)} kcal au-dessus de l’objectif. Parfait si tu as faim.`;
  const weightNow = latestWeight();
  const mt = macroTargets(target, weightNow);

  view.innerHTML = `
  <div class="wrap">
    <div class="nutri-layout">
      <section class="section" aria-labelledby="day-title">
        <div class="section-head">
          <div><p class="eyebrow">${esc(dateFR(new Date(), { weekday: 'long', day: 'numeric', month: 'long' }))}</p>
          <h1 class="h-xl" id="day-title">Ma journée</h1></div>
          <button class="btn btn-sm" data-action="reroll-day">${icon('shuffle')} Tout repiocher</button>
        </div>
        <div class="card dayhead" style="padding:16px">
          <div class="daytotal">
            <span class="kcal">${fmt(eaten)}<small>/ ${fmt(target)} kcal</small></span>
          </div>
          <div class="gauge" aria-hidden="true">
            <div class="planned" style="width:${Math.min(100, (planned / scale) * 100)}%"></div>
            <div class="eaten" style="width:${Math.min(100, (eaten / scale) * 100)}%"></div>
          </div>
          <div class="gauge-legend">
            <span>Mangé · ${eatenSlots.length}/${active.length} repas</span>
            <span>Prévu ${fmt(planned)} kcal</span>
          </div>
          ${macrosLine({ p: sum(active, 'p'), c: sum(active, 'c'), f: sum(active, 'f') })}
          ${mt ? `<p class="small muted" style="margin:0">Cible du jour : ${mt.p} g P · ${mt.c} g G · ${mt.f} g L</p>` : ''}
          ${advice ? `<p class="small muted" style="margin:0">${advice}</p>` : ''}
          <div class="btn-row">
            ${canFit ? `<button class="btn btn-sm btn-primary" data-action="fit-portions">${icon('scale')} Ajuster les portions</button>` : ''}
            <button class="btn btn-sm btn-ghost" data-action="calc-target">${icon('calc')} ${settings.profile ? 'Recalculer mon objectif' : 'Calculer mon objectif'}</button>
          </div>
        </div>
        <div class="slots" style="margin-top:12px">
          ${DAY_SLOTS.map((s) => slotRow(s, day)).join('')}
        </div>
      </section>

      <section class="section" aria-labelledby="lib-title">
        <div class="section-head">
          <div><p class="eyebrow">Bibliothèque</p><h2 class="h-l" id="lib-title">Recettes & gainers</h2></div>
          <button class="btn btn-primary btn-sm" data-action="new-recipe">${icon('plus')} Ajouter</button>
        </div>
        <div class="filters">
          <div class="seg" role="group" aria-label="Filtrer les recettes">
            ${[['all', 'Tout'], ['gainer', 'Gainers'], ['meal', 'Repas solides'], ['mine', 'Perso']]
              .map(([k, l]) => `<button data-action="filter" data-f="${k}" aria-pressed="${ui.filter === k}">${l}</button>`).join('')}
          </div>
          <label class="searchbox">${icon('search')}
            <input class="input" type="search" id="recipe-q" placeholder="Chercher : avoine, saumon…" value="${esc(ui.q)}" aria-label="Chercher une recette">
          </label>
          <button class="btn btn-sm btn-ghost foods-btn" data-action="edit-foods">${icon('ban')} Aliments exclus${
            (settings.excludedFoods.length + settings.customFoods.length) ? ` · ${settings.excludedFoods.length + settings.customFoods.length}` : ''}</button>
        </div>
        <div class="recipes" id="recipe-grid">${recipeGrid()}</div>
      </section>
    </div>
  </div>`;
}

function slotRow(s, day) {
  const r = recipeById(day.picks[s.key]);
  const off = !!day.off[s.key];
  const eaten = !!day.eaten[s.key];
  const pf = day.portions?.[s.key] || 1;
  if (!r) {
    return `<div class="card slot is-off"><span></span><div class="slot-main"><span class="eyebrow">${s.label}</span>
      <span class="slot-meta">Aucune recette disponible pour ce créneau.</span></div><span></span></div>`;
  }
  return `
  <div class="card slot ${eaten && !off ? 'is-eaten' : ''} ${off ? 'is-off' : ''}">
    <button class="slot-check" data-action="eat" data-slot="${s.key}" aria-pressed="${eaten && !off}" ${off ? 'disabled' : ''}
      aria-label="${eaten ? 'Annuler : pas encore mangé' : 'Marquer comme mangé'} (${s.label})">${icon('check')}</button>
    <button class="slot-main" data-action="open-recipe" data-id="${r.id}" data-slot="${s.key}">
      <span class="eyebrow">${s.label}${off ? ' · sauté' : ''}${pf !== 1 ? ` · <span class="portion-tag">×${fmt(pf)}</span>` : ''}</span>
      <span class="slot-name" ${off ? 'style="text-decoration:line-through"' : ''}>${esc(r.name)}</span>
      <span class="slot-meta"><b>${fmt(Math.round(r.kcal * pf))} kcal</b> · ${fmt(Math.round(r.p * pf))} g prot.${r.prep ? ` · ${r.prep} min` : ''}</span>
    </button>
    <div class="slot-actions">
      <button class="icon-btn sm" data-action="reroll-slot" data-slot="${s.key}" aria-label="Piocher une autre recette (${s.label})" ${off ? 'disabled' : ''}>${icon('shuffle')}</button>
      <button class="icon-btn sm" data-action="toggle-off" data-slot="${s.key}" aria-label="${off ? 'Réactiver' : 'Sauter'} ce créneau (${s.label})">${icon(off ? 'plus' : 'skip')}</button>
    </div>
  </div>`;
}

function recipeGrid() {
  const q = ui.q.trim().toLowerCase();
  const matching = allRecipes().filter((r) => {
    if (ui.filter === 'gainer' && r.slot !== 'gainer') return false;
    if (ui.filter === 'meal' && r.slot === 'gainer') return false;
    if (ui.filter === 'mine' && !r.custom) return false;
    if (!q) return true;
    const hay = [r.name, r.note, ...(r.tags || []), ...r.ingredients.map((i) => i[1])].join(' ').toLowerCase();
    return hay.includes(q);
  });
  const hidden = matching.filter((r) => recipeBlocks(r).length);
  const list = ui.showBlocked ? matching : matching.filter((r) => !recipeBlocks(r).length);
  const hiddenNote = hidden.length
    ? `<p class="hidden-note">${hidden.length} recette${hidden.length > 1 ? 's' : ''} masquée${hidden.length > 1 ? 's' : ''} par tes exclusions ·
        <button class="linkish" data-action="toggle-blocked">${ui.showBlocked ? 'Les cacher' : 'Les afficher'}</button></p>`
    : '';
  if (!list.length) {
    return `${hiddenNote}<div class="empty">${ui.filter === 'mine' && !q
      ? 'Aucune recette perso pour l’instant.<br><br><button class="btn btn-primary btn-sm" data-action="new-recipe">' + icon('plus') + ' Ajouter ma recette</button>'
      : 'Aucune recette ne correspond.'}</div>`;
  }
  return hiddenNote + list.map((r) => {
    const blocks = recipeBlocks(r);
    return `
    <button class="recipe ${blocks.length ? 'is-blocked' : ''}" data-action="open-recipe" data-id="${r.id}">
      <span class="recipe-kind ${r.slot === 'gainer' ? 'k-gainer' : ''}"></span>
      <span class="recipe-top">
        <span><span class="recipe-name">${esc(r.name)}</span>${r.note ? `<span class="recipe-note" style="display:block">${esc(r.note)}</span>` : ''}</span>
        <span class="kcal">${fmt(r.kcal)}<small>kcal</small></span>
      </span>
      ${macroBar(r)}
      <span class="recipe-foot">
        ${macrosLine(r)}
        <span class="tags">${blocks.length ? `<span class="tag tag-axial">Contient : ${esc(blocks.join(', '))}</span>` : ''}<span class="tag ${r.slot === 'gainer' ? 'tag-plate' : ''}">${SLOT_LABEL[r.slot]}</span>${r.custom ? '<span class="tag">Perso</span>' : ''}</span>
      </span>
    </button>`;
  }).join('');
}

/* Feuille « Aliments exclus » */
function foodsSheet() {
  openSheet(() => {
    const st = S().settings;
    const count = allRecipes().filter((r) => recipeBlocks(r).length).length;
    return `
      ${sheetHead('Aliments exclus', 'Recettes')}
      <p class="muted" style="margin:0 0 16px">Les recettes qui en contiennent ne sont plus piochées dans ta journée.
        ${count ? `<b style="color:var(--text)">${count} recette${count > 1 ? 's' : ''} écartée${count > 1 ? 's' : ''}</b> sur ${allRecipes().length}.` : ''}</p>
      <div class="eq-grid">
        ${FOODS.map((f) => `
          <button class="eq-chip" data-action="toggle-food" data-food="${f.id}" aria-pressed="${st.excludedFoods.includes(f.id)}">
            ${icon('check')}<span>${f.label}</span></button>`).join('')}
      </div>
      <form class="field" id="food-form" style="margin-top:18px">
        <span>Autre aliment</span>
        <div style="display:flex;gap:8px">
          <input class="input" name="food" maxlength="30" placeholder="ex. champignon, kiwi" autocomplete="off">
          <button class="btn" type="submit">${icon('plus')}</button>
        </div>
      </form>
      ${st.customFoods.length ? `<div class="excluded-list" style="margin-top:10px">${st.customFoods.map((c) => `
        <span class="chip-x">${esc(c)}<button data-action="del-food" data-food="${esc(c)}" aria-label="Ne plus exclure ${esc(c)}">${icon('x')}</button></span>`).join('')}</div>` : ''}
      <button class="btn btn-primary btn-block" data-action="close-sheet" style="margin-top:20px">C’est bon</button>`;
  });
}

function recipeSheet(id, slotKey = null) {
  ui.preview = 1;
  openSheet(() => {
    const r = recipeById(id);
    if (!r) return sheetHead('Recette introuvable');
    const day = S().day;
    const targets = COMPAT[r.slot] || [];
    // depuis un créneau du jour : la portion est celle du jour ; sinon simple aperçu
    const inDay = slotKey && day.picks[slotKey] === r.id;
    const pf = inDay ? (day.portions?.[slotKey] || 1) : ui.preview;
    const sc = { kcal: Math.round(r.kcal * pf), p: Math.round(r.p * pf), c: Math.round(r.c * pf), f: Math.round(r.f * pf) };
    return `
      ${sheetHead(esc(r.name), `${SLOT_LABEL[r.slot]}${r.prep ? ` · ${r.prep} min` : ''}`)}
      ${r.note ? `<p class="muted" style="margin:-4px 0 14px">${esc(r.note)}</p>` : ''}
      ${recipeBlocks(r).length ? `<div class="ctx-note" style="margin-bottom:12px;border-left-color:var(--danger)">${icon('ban')}
        <span>Contient <b>${esc(recipeBlocks(r).join(', '))}</b> : exclue de tes tirages.</span></div>` : ''}
      <div class="detail-kcal">
        <span class="kcal">${fmt(sc.kcal)}<small>kcal</small></span>
        ${macrosLine(sc)}
      </div>
      <div style="margin-top:10px">${macroBar(r)}</div>
      <div class="field" style="margin-top:14px"><span>Portion${inDay ? ` · ${SLOT_BY_KEY[slotKey].label.toLowerCase()}` : ''}</span>
        <div class="seg" role="group" aria-label="Portion">
          ${PORTIONS.map((x) => `<button data-action="portion" data-f="${x}" ${inDay ? `data-slot="${slotKey}"` : ''} data-id="${r.id}" aria-pressed="${pf === x}">×${fmt(x)}</button>`).join('')}
        </div></div>
      ${r.tags?.length ? `<div class="tags" style="margin-top:12px">${r.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>` : ''}
      <div class="section">
        <h3 class="h-m eyebrow" style="margin-bottom:6px">Ingrédients${pf !== 1 ? ` · ×${fmt(pf)}` : ''}</h3>
        <ul class="ing">${r.ingredients.map(([q, n]) => `<li><b>${esc(scaleQty(q, pf)) || '—'}</b><span>${esc(n)}</span></li>`).join('')}</ul>
      </div>
      <div class="section">
        <h3 class="eyebrow" style="margin-bottom:6px">Préparation</h3>
        <ol class="steps">${r.steps.map((s) => `<li><span>${esc(s)}</span></li>`).join('')}</ol>
      </div>
      <div class="section stack">
        ${targets.map((k, i) => {
          const current = day.picks[k] === r.id && !day.off[k];
          return `<button class="btn btn-block ${i === 0 ? 'btn-primary' : ''}" data-action="use-recipe" data-id="${r.id}" data-slot="${k}" ${current ? 'disabled' : ''}>
            ${current ? `Déjà au ${SLOT_BY_KEY[k].label.toLowerCase()}` : `Mettre au menu · ${SLOT_BY_KEY[k].label}`}</button>`;
        }).join('')}
        ${r.custom ? `<div class="btn-row">
          <button class="btn" data-action="edit-recipe" data-id="${r.id}">${icon('edit')} Modifier</button>
          <button class="btn btn-danger" data-action="delete-recipe" data-id="${r.id}">${icon('trash')} Supprimer</button></div>` : ''}
      </div>`;
  });
}

/** Dernier poids connu : dernière pesée, sinon poids du profil. */
function latestWeight() {
  const w = S().weights;
  return w.length ? w[w.length - 1].kg : S().settings.profile?.weight || null;
}

/* Feuille « Calculer mon objectif » (Mifflin-St Jeor + surplus prise de masse) */
function calcSheet() {
  const p = { sex: 'm', age: '', height: '', activity: 1.55, surplus: 450, ...(S().settings.profile || {}) };
  const w = latestWeight() || '';
  openSheet(() => `
    ${sheetHead('Mon objectif calorique', 'Calcul')}
    <form class="form" id="calc-form" novalidate>
      <div class="field"><span>Sexe</span>
        <div class="seg" role="radiogroup" aria-label="Sexe">
          ${[['m', 'Homme'], ['f', 'Femme']].map(([v, l]) => `<label class="seg-radio"><input type="radio" name="sex" value="${v}" ${p.sex === v ? 'checked' : ''}><span>${l}</span></label>`).join('')}
        </div></div>
      <div class="grid-3">
        <label class="field"><span>Âge</span><input class="input" name="age" inputmode="numeric" value="${esc(p.age)}" placeholder="25"></label>
        <label class="field"><span>Taille cm</span><input class="input" name="height" inputmode="numeric" value="${esc(p.height)}" placeholder="180"></label>
        <label class="field"><span>Poids kg</span><input class="input" name="weight" inputmode="decimal" value="${esc(w ? fmt(w) : '')}" placeholder="65"></label>
      </div>
      <fieldset class="choice"><legend>Activité hors séances</legend>
        ${ACTIVITY.map((a) => `<label class="choice-row"><input type="radio" name="activity" value="${a.k}" ${p.activity === a.k ? 'checked' : ''}>
          <span><b>${a.label}</b><small>${a.hint}</small></span></label>`).join('')}
      </fieldset>
      <fieldset class="choice"><legend>Surplus prise de masse</legend>
        ${SURPLUS.map((x) => `<label class="choice-row"><input type="radio" name="surplus" value="${x.k}" ${p.surplus === x.k ? 'checked' : ''}>
          <span><b>${x.label} kcal</b><small>${x.hint}</small></span></label>`).join('')}
      </fieldset>
      <div class="calc-result" id="calc-result" aria-live="polite">${calcResultHTML(readCalcForm(null, p, w))}</div>
      <button class="btn btn-primary btn-block" type="submit">Appliquer cet objectif</button>
      <p class="hint">Formule de Mifflin-St Jeor. C’est un point de départ : l’onglet Poids ajuste ensuite selon ta vraie prise (+0,25 à 0,5 %/semaine).</p>
    </form>`);
}
function readCalcForm(form, fallback = {}, w = null) {
  const g = (n) => (form ? form.elements[n]?.value : fallback[n]);
  const radio = (n) => (form ? form.querySelector(`[name="${n}"]:checked`)?.value : fallback[n]);
  return {
    sex: radio('sex') || 'm',
    age: num(g('age')), height: num(g('height')),
    weight: form ? num(form.elements.weight.value) : w,
    activity: num(radio('activity')) || 1.55, surplus: num(radio('surplus')) ?? 450,
  };
}
function calcResultHTML(v) {
  if (!v.age || !v.height || !v.weight || v.age < 14 || v.height < 120 || v.weight < 35) {
    return '<p class="muted small" style="margin:0">Renseigne âge, taille et poids.</p>';
  }
  const e = energyTarget(v, v.weight);
  const m = macroTargets(e.target, v.weight);
  return `<div class="calc-grid">
      <div><small>Métabolisme de base</small><b>${fmt(e.bmr)}</b></div>
      <div><small>Maintenance</small><b>${fmt(e.tdee)}</b></div>
      <div class="hl"><small>Objectif</small><b>${fmt(e.target)}</b></div>
    </div>
    <p class="small muted" style="margin:8px 0 0">Soit ${m.p} g de protéines (2 g/kg), ${m.f} g de lipides, ${m.c} g de glucides.</p>`;
}

function recipeForm(id = null) {
  const r = id ? recipeById(id) : null;
  const ings = r ? r.ingredients : [['', ''], ['', ''], ['', '']];
  openSheet(() => `
    ${sheetHead(r ? 'Modifier la recette' : 'Ajouter ma recette', 'Recette perso')}
    <form class="form" id="recipe-form" method="dialog" novalidate>
      <label class="field"><span>Nom</span><input class="input" name="name" required maxlength="80" value="${esc(r?.name)}" placeholder="Ex. Overnight oats beurre de cacahuète"></label>
      <div class="grid-2">
        <label class="field"><span>Catégorie</span>
          <select class="input" name="slot">
            ${[['gainer', 'Gainer (shake)'], ['breakfast', 'Petit-déjeuner'], ['main', 'Déjeuner / dîner'], ['snack', 'Collation']]
              .map(([v, l]) => `<option value="${v}" ${r?.slot === v ? 'selected' : ''}>${l}</option>`).join('')}
          </select></label>
        <label class="field"><span>Préparation (min)</span><input class="input" name="prep" inputmode="numeric" value="${esc(r?.prep ?? '')}" placeholder="10"></label>
      </div>
      <div class="field"><span>Valeurs nutritionnelles</span>
        <div class="grid-4">
          <label class="field"><span>kcal</span><input class="input" name="kcal" inputmode="numeric" value="${esc(r?.kcal ?? '')}" placeholder="auto" id="f-kcal"></label>
          <label class="field"><span>Prot. g</span><input class="input" name="p" inputmode="decimal" value="${esc(r?.p ?? '')}" required></label>
          <label class="field"><span>Gluc. g</span><input class="input" name="c" inputmode="decimal" value="${esc(r?.c ?? '')}" required></label>
          <label class="field"><span>Lip. g</span><input class="input" name="f" inputmode="decimal" value="${esc(r?.f ?? '')}" required></label>
        </div>
        <p class="hint" id="kcal-hint">kcal vides = calculées (4 × P + 4 × G + 9 × L).</p>
      </div>
      <div class="field"><span>Ingrédients</span>
        <div class="ing-rows" id="ing-rows">${ings.map(ingRow).join('')}</div>
        <button type="button" class="btn btn-ghost btn-sm" data-action="add-ing" style="justify-self:start">${icon('plus')} Ingrédient</button>
      </div>
      <label class="field"><span>Étapes (une par ligne)</span>
        <textarea class="input" name="steps" placeholder="Mixer l'avoine à sec&#10;Ajouter le reste, mixer 45 s">${esc(r?.steps.join('\n'))}</textarea></label>
      <p class="form-error" id="form-error" hidden></p>
      <input type="hidden" name="rid" value="${esc(r?.id || '')}">
      <button class="btn btn-primary btn-block" type="submit">${r ? 'Enregistrer' : 'Ajouter à ma liste'}</button>
    </form>`);
}
const ingRow = ([q, n] = ['', '']) => `
  <div class="ing-row">
    <input class="input" name="ing-q" value="${esc(q)}" placeholder="80 g" aria-label="Quantité">
    <input class="input" name="ing-n" value="${esc(n)}" placeholder="flocons d'avoine" aria-label="Ingrédient">
    <button type="button" class="icon-btn sm" data-action="del-ing" aria-label="Retirer l'ingrédient">${icon('x')}</button>
  </div>`;

function submitRecipe(form) {
  const fd = new FormData(form);
  const err = (m) => { const e = $('#form-error'); e.textContent = m; e.hidden = false; };
  const name = String(fd.get('name') || '').trim();
  const p = num(fd.get('p')), c = num(fd.get('c')), f = num(fd.get('f'));
  let kcal = num(fd.get('kcal'));
  const qs = fd.getAll('ing-q'), ns = fd.getAll('ing-n');
  const ingredients = ns.map((n, i) => [String(qs[i] || '').trim(), String(n).trim()]).filter(([, n]) => n);
  const steps = String(fd.get('steps') || '').split('\n').map((s) => s.trim()).filter(Boolean);
  if (!name) return err('Donne un nom à la recette.');
  if ([p, c, f].some((x) => x === null || x < 0)) return err('Renseigne les protéines, glucides et lipides (en grammes).');
  if (!ingredients.length) return err('Ajoute au moins un ingrédient.');
  if (kcal === null) kcal = Math.round(p * 4 + c * 4 + f * 9);
  const id = String(fd.get('rid') || '') || `u-${uid()}`;
  const recipe = {
    id, custom: true, name, slot: String(fd.get('slot')), prep: num(fd.get('prep')) || null,
    kcal: Math.round(kcal), p, c, f, ingredients, steps: steps.length ? steps : ['—'],
  };
  store.update((s) => {
    const i = s.customRecipes.findIndex((x) => x.id === id);
    if (i >= 0) s.customRecipes[i] = recipe; else s.customRecipes.push(recipe);
  });
  toast(fd.get('rid') ? 'Recette mise à jour' : 'Recette ajoutée à ta liste');
  recipeSheet(id);
}

/* ═════════════ Sport : accueil ═════════════ */
function contextNotes(ctx, { compact = false } = {}) {
  const notes = [];
  if (ctx.axialYesterday?.length) {
    const names = ctx.axialYesterday.map((id) => EX[id]?.n).filter(Boolean).join(', ');
    notes.push(`<b>Hier : ${esc(names)}</b> (charge axiale). ${compact ? 'Séance sans mouvement axial lourd.' : 'Aujourd’hui la séance évite tout mouvement axial lourd : machines stables et unilatéral.'}`);
  }
  if (ctx.dayIndex >= 3) {
    notes.push(`<b>${ctx.dayIndex}ᵉ jour d’affilée</b> : volume réduit (≈ −15 %, 5 exercices). Garde 1–2 reps en réserve.`);
  } else if (ctx.dayIndex === 2 && !compact) {
    notes.push('<b>2ᵉ jour d’affilée</b> : volume normal, évite l’échec sur les mouvements de base.');
  }
  return notes.map((n) => `<div class="ctx-note">${icon('info')}<span>${n}</span></div>`).join('');
}

const plateArt = `<svg class="plate-art" viewBox="0 0 100 100" aria-hidden="true">
  <circle cx="50" cy="50" r="44" stroke-width="10"/><circle cx="50" cy="50" r="28" stroke-width="2" opacity=".5"/>
  <circle cx="50" cy="50" r="9" stroke-width="5"/></svg>`;

function renderSportHome() {
  const st = S();
  const ctx = fatigueContext(st.sessions);
  const reco = suggestedType(st.sessions);
  const todayDone = st.sessions.filter((s) => dayKey(s.endedAt) === dayKey());
  const place = st.settings.place || 'gym';
  const eqList = st.settings.equipment[place] || [];

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000);
    const k = dayKey(d);
    const s = st.sessions.filter((x) => dayKey(x.endedAt) === k).pop();
    return { d, k, s };
  });

  view.innerHTML = `
  <div class="wrap wrap-narrow">
    <p class="eyebrow">Séance PPL express</p>
    <h1 class="h-xl">${place === 'gym' ? 'J’arrive à la salle' : place === 'street' ? 'J’arrive au parc' : 'Séance à la maison'}</h1>
    <div class="seg place-seg" role="group" aria-label="Où t’entraînes-tu ?" style="margin-top:14px">
      ${Object.entries(PLACES).map(([k, p]) => `<button data-action="place" data-v="${k}" aria-pressed="${place === k}">${p.label}</button>`).join('')}
    </div>
    <p class="place-hint">${place === 'gym'
      ? 'Catalogue Basic-Fit / Matrix. Machine prise ? « Remplacer » propose aussi des variantes street.'
      : `Matériel : ${eqList.map((t) => EQ_LABEL[t]).join(', ')}. <button class="linkish" data-action="edit-equipment">Modifier</button>`}</p>
    <div class="ppl">
      ${['push', 'pull', 'legs'].map((t) => `
        <button class="ppl-btn" data-action="start" data-type="${t}">
          <span>${t === reco ? '<span class="ppl-reco">Au programme</span>' : ''}<span class="ppl-word">${TYPE_LABEL[t]}</span><span class="ppl-focus">${TYPE_FOCUS[t]}</span></span>
          ${plateArt}
        </button>`).join('')}
    </div>
    <div class="stack" style="margin-top:16px">
      ${todayDone.length ? `<div class="ctx-note">${icon('check')}<span><b>Séance ${TYPE_LABEL[todayDone[todayDone.length - 1].type]} déjà faite aujourd’hui.</b> Récupère, mange, dors.</span></div>` : ''}
      ${contextNotes(ctx)}
      ${!st.sessions.length ? `<div class="ctx-note">${icon('info')}<span>Un tap : l’app génère 5–6 exercices et s’adapte ensuite à tes enchaînements Push → Pull → Legs.</span></div>` : ''}
    </div>

    <section class="section" aria-labelledby="week-title">
      <div class="section-head"><h2 class="eyebrow" id="week-title">7 derniers jours</h2>
        <a class="small muted" href="#/journal">Journal complet</a></div>
      <div class="week">
        ${days.map(({ d, k, s }) => `
          <div class="week-day ${k === dayKey() ? 'is-today' : ''}">
            <span>${esc(dateFR(d, { weekday: 'short' }).replace('.', ''))}</span>
            <span class="pip ${s ? 't-' + s.type : ''}" ${s ? `title="${TYPE_LABEL[s.type]}"` : ''}>${s ? TYPE_LABEL[s.type] : ''}</span>
            <span>${d.getDate()}</span>
          </div>`).join('')}
      </div>
    </section>
  </div>`;
}

const genOptions = (st, place = st.settings.place || 'gym') => ({
  sessions: st.sessions, excluded: st.settings.excluded, place, equipment: st.settings.equipment,
});

const EQ_ORDER = ['floor', 'bar', 'dips', 'lowbar', 'bench', 'table', 'door', 'band'];
function equipmentSheet() {
  openSheet(() => {
    const st = S();
    const place = st.settings.place;
    const list = st.settings.equipment[place] || [];
    return `
      ${sheetHead('Mon matériel', PLACES[place].label)}
      <p class="muted" style="margin:0 0 16px">Coche ce que tu as sous la main : la séance ne proposera que des exercices faisables.</p>
      <div class="eq-grid">
        ${EQ_ORDER.map((t) => `
          <button class="eq-chip" data-action="toggle-eq" data-eq="${t}" aria-pressed="${list.includes(t)}" ${t === 'floor' ? 'disabled' : ''}>
            ${icon('check')}<span>${EQ_LABEL[t]}</span></button>`).join('')}
      </div>
      <button class="btn btn-primary btn-block" data-action="close-sheet" style="margin-top:20px">C’est bon</button>`;
  });
}

/* ═════════════ Sport : en séance ═════════════ */
const sessionStats = (sess) => {
  let done = 0, total = 0, volume = 0;
  for (const e of sess.exercises) {
    for (const s of e.sets) {
      total++;
      if (s.done) {
        done++;
        volume += (num(s.kg) || 0) * (num(s.reps) || 0);
      }
    }
  }
  return { done, total, volume: Math.round(volume) };
};

function renderSession() {
  const sess = S().activeSession;
  const st = sessionStats(sess);
  const anyDone = st.done > 0;
  view.innerHTML = `
  <div class="wrap wrap-narrow">
    <div class="session-head">
      <div class="session-title">
        <span class="type-badge t-${sess.type}">${TYPE_LABEL[sess.type]}</span>
        ${sess.place && sess.place !== 'gym' ? `<span class="tag">${PLACES[sess.place].label}</span>` : ''}
        <h1 class="h-m">${TYPE_FOCUS[sess.type]}</h1>
        <button class="icon-btn sm big-toggle" data-action="toggle-big" aria-pressed="${!!S().settings.bigNumbers}"
          aria-label="Gros chiffres">${icon('big')}</button>
      </div>
      <div class="session-stats">
        <span><b id="elapsed">${mmss((Date.now() - new Date(sess.startedAt)) / 1000)}</b> écoulé</span>
        <span><b>${st.done}/${st.total}</b> séries</span>
        <span><b>${fmt(st.volume)}</b> kg soulevés</span>
      </div>
      <div class="progress" aria-hidden="true"><span style="width:${(st.done / (st.total || 1)) * 100}%"></span></div>
      ${contextNotes(sess.ctx, { compact: true })}
    </div>

    ${sess.exercises.map((e, i) => exoCard(e, i, sess)).join('')}

    <div class="stack" style="margin-top:24px">
      <button class="btn btn-primary btn-block" data-action="finish">${icon('flag')} Terminer la séance</button>
      <div class="btn-row">
        ${!anyDone ? `<button class="btn btn-ghost" data-action="regen">${icon('dice')} Autre tirage</button>` : ''}
        <button class="btn btn-danger" data-action="abandon">${icon('x')} Abandonner</button>
      </div>
    </div>
  </div>`;
}

/* ─── Échauffement & disques ─── */
const barKg = () => S().settings.barKg || 20;
/** Charge de travail de référence : 1re série non validée renseignée, sinon série 1. */
function workKg(e) {
  const s = e.sets.find((x) => !x.done && num(x.kg) > 0) || e.sets.find((x) => num(x.kg) > 0);
  return s ? num(s.kg) : null;
}
function platesText(e) {
  const kg = workKg(e);
  if (!kg) return `Disques : entre une charge (barre ${fmt(barKg())} kg)`;
  const { per, ok } = platesPerSide(kg, barKg());
  if (kg < barKg()) return `Plus léger que la barre (${fmt(barKg())} kg)`;
  if (!per.length) return `Barre seule · ${fmt(barKg())} kg`;
  return `Par côté : <b>${per.map(fmt).join(' + ')}</b>${ok ? '' : ' <span class="muted">(≈ arrondi)</span>'}`;
}
function updatePlates(uidv) {
  const e = findExo(uidv);
  if (!e) return;
  const el = document.querySelector(`[data-plates="${uidv}"]`);
  if (el) el.innerHTML = platesText(e);
  // l'échauffement suit la charge saisie, sans re-rendre la carte (le focus reste dans le champ)
  const card = document.querySelector(`.exo[data-uid="${uidv}"]`);
  const old = card?.querySelector('details.warmup');
  if (old) {
    const wasOpen = old.open;
    old.outerHTML = warmupBlock(e, EX[e.exId]);
    const fresh = card.querySelector('details.warmup');
    if (fresh) fresh.open = wasOpen;
  }
}
const haptic = (ms = 12) => {
  try { if (navigator.userActivation?.hasBeenActive !== false) navigator.vibrate?.(ms); } catch { /* pas de vibreur */ }
};
function warmupBlock(e, ex) {
  if (!e.target.heavy || !['free', 'machine'].includes(ex.k)) return '';
  const work = workKg(e);
  const barbell = BARBELL.has(e.exId);
  const sets = warmupSets(work, { barbell, bar: barKg() });
  const started = e.sets.some((s) => s.done);
  const done = (e.warm || []).filter(Boolean).length;
  return `
    <details class="warmup" ${started ? '' : 'open'}>
      <summary>${icon('flame')} Échauffement ${sets.length ? `· ${done}/${sets.length}` : ''}</summary>
      ${work ? `<div class="wu-list">${sets.map((w, j) => `
        <button class="wu-row" data-action="toggle-wu" data-uid="${e.uid}" data-i="${j}" aria-pressed="${!!e.warm?.[j]}">
          ${icon('check')}<b>${fmt(w.kg)} kg × ${w.reps}</b>
          ${barbell ? `<span>${w.kg <= barKg() ? 'barre seule' : platesPerSide(w.kg, barKg()).per.map(fmt).join(' + ') + ' / côté'}</span>` : ''}
        </button>`).join('')}</div>
        <p class="hint" style="margin:6px 0 0">Repos court (45–60 s), aucune fatigue : ça ne compte pas dans le volume.</p>`
      : '<p class="hint" style="margin:6px 0 0">Entre ta charge de travail en série 1 : l’échauffement se calcule tout seul.</p>'}
    </details>`;
}

/** Faisable dans le lieu de la séance ? */
function isAvailable(ex, sess) {
  const place = sess.place || 'gym';
  return canDo(ex, place, allowedEq(place, S().settings.equipment), true);
}

function exoCard(e, i, sess) {
  const ex = EX[e.exId];
  const bw = ex.k === 'bw' || ex.k === 'band';
  const secs = ex.unit === 's';
  const ladder = ex.fam ? FAMILIES[ex.fam] : null;
  const next = nextInFamily(e.exId);
  const levelUp = e.suggestion?.hint?.startsWith('Prochaine étape') && next
    && !e.sets.some((s) => s.done) && isAvailable(next, sess);
  const allDone = e.sets.length && e.sets.every((s) => s.done);
  const last = lastPerformance(e.exId, S().sessions);
  const range = `${e.target.reps[0]}–${e.target.reps[1]}`;
  let lastTxt = '';
  if (last) {
    const kgs = last.sets.map((s) => num(s.kg));
    const sameKg = kgs.every((k) => k === kgs[0]);
    const sets = last.sets.map((s) => (sameKg ? '' : `${fmt(num(s.kg) || 0)}×`) + (s.reps || '?')).join(' · ');
    const head = sameKg && kgs[0] !== null && !(bw && !kgs[0]) ? `${fmt(kgs[0])} kg × ` : '';
    const sug = e.suggestion;
    let up = '';
    if (sug?.up && sug.kg !== null && sug.kg > 0 && sug.kg !== kgs[0]) up = ` — <span class="up">monte à ${fmt(sug.kg)} kg</span>`;
    else if (sug?.hint) up = ` — <span class="up">${esc(sug.hint)}</span>`;
    lastTxt = `<p class="exo-last">Dernière fois (${esc(dateFR(last.date, { day: 'numeric', month: 'short' }))}) : ${head}${sets}${up}</p>`;
  }
  return `
  <article class="card exo ${allDone ? 'is-done' : ''}" data-uid="${e.uid}">
    <div class="exo-head has-fig">
      <span class="exo-num">${allDone ? icon('check') : i + 1}</span>
      <div style="min-width:0">
        <h2 class="exo-name">${esc(ex.n)}</h2>
        <p class="exo-equip" style="margin:3px 0 0">${esc(ex.e)}</p>
        <div class="tags" style="margin-top:8px">
          ${e.target.heavy ? '<span class="tag tag-heavy">Mouvement de base</span>' : ''}
          ${ex.axial ? '<span class="tag tag-axial">Charge axiale</span>' : ''}
          ${ladder ? `<span class="tag tag-plate">Niveau ${ladder.indexOf(ex) + 1}/${ladder.length}</span>` : ''}
          <span class="tag">${esc(GROUP_LABEL[ex.g])}</span>
        </div>
      </div>
      <button class="exo-fig" data-action="ex-info" data-ex="${e.exId}" aria-label="Comment faire : ${esc(ex.n)}">${figureSVG(ex, { label: false, crop: true })}</button>
    </div>
    <div class="exo-target">
      <span><b>${e.sets.length}</b> séries</span>
      <span><b>${range}</b> ${secs ? 's' : 'reps'}${ex.uni ? ' / côté' : ''}</span>
      <span>repos <b>${mmss(e.target.rest)}</b></span>
      <span>RIR <b>${e.target.rir}</b></span>
    </div>
    ${lastTxt}
    ${levelUp ? `<button class="btn btn-sm btn-primary levelup" data-action="replace-pick" data-uid="${e.uid}" data-ex="${next.id}">
      Passer à : ${esc(next.n)}</button>` : ''}
    ${BARBELL.has(e.exId) ? `<p class="plates" data-plates="${e.uid}">${platesText(e)}</p>` : ''}
    ${warmupBlock(e, ex)}
    <div class="sets">
      <div class="sets-head"><span>#</span><span>${bw ? 'Lest kg' : 'Charge kg'}</span><span>${secs ? 'Secondes' : 'Reps'}</span><span></span></div>
      ${e.sets.map((s, j) => `
        <div class="set ${s.done ? 'is-done' : ''} ${ui.justDone === `${e.uid}:${j}` ? 'just-done' : ''}">
          <span class="set-n">${j + 1}</span>
          <input class="input" inputmode="decimal" enterkeyhint="next" autocomplete="off" aria-label="Série ${j + 1} : ${bw ? 'lest' : 'charge'} en kg"
            data-set="kg" data-uid="${e.uid}" data-i="${j}" value="${esc(s.kg)}" placeholder="${bw ? '0' : '—'}">
          <input class="input" inputmode="numeric" enterkeyhint="done" autocomplete="off" aria-label="Série ${j + 1} : ${secs ? 'secondes' : 'répétitions'}"
            data-set="reps" data-uid="${e.uid}" data-i="${j}" value="${esc(s.reps)}" placeholder="${range}">
          <button class="set-check" data-action="toggle-set" data-uid="${e.uid}" data-i="${j}" aria-pressed="${s.done}"
            aria-label="${s.done ? 'Annuler la validation' : 'Valider'} la série ${j + 1}">${icon('check')}</button>
        </div>`).join('')}
    </div>
    <div class="exo-actions">
      <button class="btn btn-sm" data-action="add-set" data-uid="${e.uid}" aria-label="Ajouter une série">${icon('plus')} Série</button>
      ${e.sets.length > 1 ? `<button class="btn btn-sm btn-ghost" data-action="del-set" data-uid="${e.uid}" aria-label="Retirer la dernière série">${icon('minus')}</button>` : ''}
      <button class="btn btn-sm" data-action="rest" data-uid="${e.uid}">${icon('timer')} Repos</button>
      <button class="btn btn-sm" data-action="replace" data-uid="${e.uid}">${icon('swap')} Remplacer</button>
    </div>
  </article>`;
}

const findExo = (uidv) => S().activeSession?.exercises.find((e) => e.uid === uidv);

function replaceSheet(uidv) {
  openSheet(() => {
    const sess = S().activeSession;
    const e = findExo(uidv);
    if (!sess || !e) return sheetHead('Exercice introuvable');
    const cands = replaceOptions(sess, e);
    const cur = EX[e.exId];
    const gym = (sess.place || 'gym') === 'gym';
    return `
      ${sheetHead('Remplacer', `${gym ? 'Machine prise ?' : 'Pas le bon matériel ?'} · ${esc(GROUP_LABEL[cur.g])}`)}
      <p class="muted" style="margin:0 0 14px">Actuel : <b style="color:var(--text)">${esc(cur.n)}</b></p>
      <div class="btn-row" style="margin-bottom:18px">
        <button class="btn btn-primary" data-action="replace-random" data-uid="${uidv}">${icon('dice')} Au hasard</button>
        ${gym ? `<button class="btn" data-action="replace-exclude" data-uid="${uidv}">${icon('ban')} Absent du club</button>` : ''}
      </div>
      <div class="alt-list">
        ${cands.length ? cands.map(({ ex, blocked, note }) => {
          const last = lastPerformance(ex.id, S().sessions);
          const lastKg = last ? Math.max(...last.sets.map((s) => num(s.kg) || 0)) : null;
          return `
          <div class="alt has-fig ${blocked ? 'is-blocked' : ''}">
            <button class="alt-fig" data-action="ex-info" data-ex="${ex.id}" data-back="${uidv}" aria-label="Comment faire : ${esc(ex.n)}">${figureSVG(ex, { label: false, crop: true })}</button>
            <button class="alt-pick" data-action="replace-pick" data-uid="${uidv}" data-ex="${ex.id}">
              ${blocked ? `<span class="why">${blocked}</span>` : note ? `<span class="why why-soft">${note}</span>` : ''}
              <b>${esc(ex.n)}</b>
              <span>${esc(ex.e)}${lastKg ? ` · dernière charge ${fmt(lastKg)} kg` : ''}</span>
            </button>
            ${!gym || ex.gym === false ? '<span></span>' : blocked === 'Absent de ton club'
              ? `<button class="icon-btn sm" data-action="include-ex" data-ex="${ex.id}" aria-label="Remettre ${esc(ex.n)} dans mon club">${icon('plus')}</button>`
              : `<button class="icon-btn sm" data-action="exclude-ex" data-ex="${ex.id}" aria-label="${esc(ex.n)} absent de mon club">${icon('ban')}</button>`}
          </div>`;
        }).join('') : '<div class="empty">Aucune alternative pour ce créneau.</div>'}
      </div>
      <p class="hint" style="margin-top:14px">${gym
        ? '« Absent du club » retire l’exercice des prochains tirages (gérable dans Journal › Réglages). Les variantes « Street workout » se font à la barre fixe, aux dips ou au sol.'
        : 'Il manque du matériel ? Ajuste-le depuis l’écran Séance (« Modifier »).'}</p>`;
  });
}

/** Fiche progression d'un exercice : courbe + séances. */
function progressSheet(exId) {
  const ex = EX[exId];
  const series = progressSeries(exId, S().sessions);
  const { pts, metric } = series;
  const first = pts[0], last = pts[pts.length - 1];
  const best = pts.reduce((b, p) => (!b || p.value > b.value ? p : b), null);
  const delta = first && last && pts.length > 1 ? ((last.value - first.value) / first.value) * 100 : null;
  const unit = metric === 'e1rm' ? ' kg' : metric === 'secs' ? ' s' : '';
  openSheet(() => `
    ${sheetHead(esc(ex?.n || exId), 'Progression')}
    <div class="wstats" style="margin-top:0">
      <div class="card stat"><b>${best ? fmt(best.value) + unit : '—'}</b><span>record ${metric === 'e1rm' ? '1RM est.' : ''}</span></div>
      <div class="card stat"><b>${last ? fmt(last.value) + unit : '—'}</b><span>dernière séance</span></div>
      <div class="card stat"><b>${delta === null ? '—' : `${delta >= 0 ? '+' : '−'}${fmt(Math.abs(Math.round(delta)))} %`}</b><span>depuis le début</span></div>
    </div>
    <div class="card chart-card" style="margin-top:12px">
      <div class="legend"><span><i class="lg-line"></i>${METRIC_LABEL[metric]}</span></div>
      <div class="chart" id="p-chart"></div>
    </div>
    ${metric === 'e1rm' ? '<p class="hint" style="margin-top:8px">1RM estimé = charge × (1 + reps / 30) sur ta meilleure série : compare des séances faites avec des reps différentes.</p>' : ''}
    <div class="section"><h3 class="eyebrow" style="margin-bottom:6px">Séances</h3>
      <div class="card wlist">${[...pts].reverse().map((p) => `<div class="wrow" style="grid-template-columns:1fr auto">
        <span>${esc(dateFR(p.date, { weekday: 'short', day: 'numeric', month: 'short' }))}</span>
        <b>${p.kg > 0 ? `${fmt(p.kg)} kg × ${fmt(p.reps)}` : `${fmt(p.reps)}${metric === 'secs' ? ' s' : ' reps'}`}</b></div>`).join('') || '<p class="muted">Aucune.</p>'}</div>
    </div>`,
  () => drawProgress(document.getElementById('p-chart'), series, helpers));
}

/** Fiche « comment faire » : figurine animée, consignes, échelle de progression, vidéo. */
function exInfoSheet(exId, backUid = null) {
  openSheet(() => {
    const ex = EX[exId];
    if (!ex) return sheetHead('Exercice introuvable');
    const ladder = ex.fam ? FAMILIES[ex.fam] : null;
    const last = lastPerformance(exId, S().sessions);
    return `
      ${sheetHead(esc(ex.n), esc(GROUP_LABEL[ex.g]))}
      <div class="fig-stage">${figureSVG(ex, { crop: 1.35 })}</div>
      <p style="margin:14px 0 0">${esc(ex.e)}.</p>
      <div class="tags" style="margin-top:10px">
        ${ex.axial ? '<span class="tag tag-axial">Charge axiale : pas deux jours de suite</span>' : ''}
        ${ex.uni ? '<span class="tag">Unilatéral : reps par côté</span>' : ''}
        ${ex.unit === 's' ? '<span class="tag">Tenue en secondes</span>' : ''}
        ${ex.eq.filter((t) => t !== 'gym').map((t) => `<span class="tag">${esc(EQ_LABEL[t])}</span>`).join('')}
      </div>
      ${last ? `<p class="small muted" style="margin:12px 0 0">Dernière fois : ${last.sets.map((s) => `${num(s.kg) > 0 ? fmt(num(s.kg)) + ' kg × ' : ''}${esc(s.reps)}`).join(' · ')}</p>` : ''}
      ${ladder ? `<div class="section"><h3 class="eyebrow" style="margin-bottom:8px">Progression</h3>
        <ol class="ladder">${ladder.map((x, i) => `<li class="${x.id === ex.id ? 'is-current' : ''}"><b>${i + 1}</b><span>${esc(x.n)}</span></li>`).join('')}</ol>
        <p class="hint" style="margin-top:8px">Quand toutes tes séries atteignent le haut de la fourchette, l’app te propose le niveau suivant.</p></div>` : ''}
      <div class="section stack">
        <a class="btn btn-block" href="${videoURL(ex)}" target="_blank" rel="noopener noreferrer">${icon('play')} Voir des démos vidéo</a>
        ${backUid ? `<button class="btn btn-block btn-ghost" data-action="replace" data-uid="${backUid}">Retour aux alternatives</button>` : ''}
      </div>`;
  });
}

/** Alternatives pour un exercice en cours, avec mentions de niveau pour les échelles. */
function replaceOptions(sess, e) {
  const st = S();
  const place = sess.place || 'gym';
  const others = sess.exercises.filter((x) => x.uid !== e.uid);
  const cur = EX[e.exId];
  return slotCandidates(sess.type, e.slot, {
    place,
    eqSet: allowedEq(place, st.settings.equipment),
    taken: [...others.map((x) => x.exId), e.exId],
    excluded: st.settings.excluded,
    ctx: sess.ctx,
    axialCount: others.filter((x) => isAxial(x.exId)).length,
    replacing: true,
    sessions: st.sessions,
  }).map((c) => {
    if (!c.blocked && cur.fam && c.ex.fam === cur.fam) {
      c.note = c.ex.lvl < cur.lvl ? 'Variante plus facile' : 'Variante plus dure';
    }
    return c;
  });
}

function doReplace(uidv, newId) {
  store.update((s) => {
    const sess = s.activeSession;
    const i = sess.exercises.findIndex((x) => x.uid === uidv);
    if (i < 0) return;
    const old = sess.exercises[i];
    const slot = templateFor(sess.place || 'gym', sess.type)[old.slot];
    const fresh = buildExercise(newId, old.slot, slot, { day3: sess.ctx.day3, sessions: s.sessions });
    // même nombre de séries que l'exercice remplacé
    while (fresh.sets.length < old.sets.length) fresh.sets.push({ ...fresh.sets[0], done: false });
    fresh.sets.length = old.sets.length;
    sess.exercises[i] = fresh;
  });
  closeSheet();
  toast(`Remplacé par : ${EX[newId].n}`);
}

/* ═════════════ Minuteur de repos ═════════════ */
const restbar = $('#restbar');
let audioCtx = null;
let restNotified = null;

function unlockAudio() {
  if (audioCtx) return;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  } catch { /* pas d'audio */ }
}
function beep() {
  navigator.vibrate?.([250, 120, 250]);
  if (!S().settings.sound || !audioCtx) return;
  try {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const t0 = audioCtx.currentTime;
    [0, 0.22, 0.44].forEach((dt, i) => {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.frequency.value = i === 2 ? 1320 : 880;
      g.gain.setValueAtTime(0.0001, t0 + dt);
      g.gain.exponentialRampToValueAtTime(0.35, t0 + dt + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dt + 0.18);
      o.connect(g).connect(audioCtx.destination);
      o.start(t0 + dt);
      o.stop(t0 + dt + 0.2);
    });
  } catch { /* ignore */ }
}

function startRest(seconds, label) {
  unlockAudio();
  store.update((s) => {
    if (!s.activeSession) return;
    s.activeSession.rest = { endsAt: Date.now() + seconds * 1000, total: seconds, label };
  }, { silent: true });
  restNotified = null;
  tickRest();
  scheduleRestNotif();
}

function tickRest() {
  const rest = S().activeSession?.rest;
  if (!rest || location.hash !== '#/seance') {
    restbar.hidden = true;
    document.body.classList.remove('has-rest');
    return;
  }
  const left = (rest.endsAt - Date.now()) / 1000;
  const over = left <= 0;
  if (over && restNotified !== rest.endsAt) {
    restNotified = rest.endsAt;
    beep();
  }
  if (left < -12) { // auto-masquage 12 s après la fin
    store.update((s) => s.activeSession && (s.activeSession.rest = null), { silent: true });
    return tickRest();
  }
  restbar.hidden = false;
  document.body.classList.add('has-rest');
  restbar.classList.toggle('is-over', over);
  const pct = over ? 100 : (1 - left / rest.total) * 100;
  const html = `
    <div class="restbar-in">
      <span class="restbar-fill" style="width:${pct}%"></span>
      <div style="min-width:0">
        <div class="restbar-time">${over ? 'Go !' : mmss(left)}</div>
        <div class="restbar-label">${over ? 'Repos terminé · ' : 'Repos · '}${esc(rest.label || '')}</div>
      </div>
      <div class="restbar-btns">
        ${over ? '' : `<button class="btn btn-ghost" data-action="rest-add" data-d="-15" aria-label="Retirer 15 secondes">−15</button>
        <button class="btn btn-ghost" data-action="rest-add" data-d="15" aria-label="Ajouter 15 secondes">+15</button>`}
        <button class="btn" data-action="rest-stop">${over ? 'OK' : 'Passer'}</button>
      </div>
    </div>`;
  if (restbar.dataset.sig !== html) { // évite de reconstruire le DOM sous le doigt
    restbar.innerHTML = html;
    restbar.dataset.sig = html;
  }
}

/* ═════════════ Notification de fin de repos (écran verrouillé) ═════════════ */
let restNotifTimer = null;
const notifOn = () => S().settings.restNotif && 'Notification' in window && Notification.permission === 'granted';

async function toggleRestNotif(input) {
  const off = (msg) => {
    input.checked = false;
    store.update((s) => (s.settings.restNotif = false), { silent: true });
    if (msg) toast(msg);
  };
  if (!input.checked) return off();
  if (!('Notification' in window)) return off('Notifications non disponibles sur ce navigateur');
  if (!window.isSecureContext) return off('Les notifications demandent l’app en HTTPS');
  const perm = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
  if (perm !== 'granted') return off('Notifications refusées par le navigateur');
  store.update((s) => (s.settings.restNotif = true), { silent: true });
  toast('Notification de fin de repos activée');
}
async function notify(title, opts = {}) {
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    const o = { tag: 'rest', icon: 'icon-192.png', badge: 'icon-192.png', lang: 'fr', ...opts };
    if (reg) await reg.showNotification(title, o);
    else new Notification(title, o);
  } catch { /* refusé ou indisponible */ }
}
async function clearRestNotif() {
  clearTimeout(restNotifTimer);
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    (await reg?.getNotifications({ tag: 'rest' }))?.forEach((n) => n.close());
  } catch { /* rien */ }
}
function scheduleRestNotif() {
  clearTimeout(restNotifTimer);
  const rest = S().activeSession?.rest;
  if (!rest || !notifOn()) return;
  restNotifTimer = setTimeout(() => {
    if (document.visibilityState === 'hidden') {
      notify('Repos terminé', { body: `C’est reparti : ${rest.label || 'série suivante'}`, renotify: true, vibrate: [250, 120, 250] });
    }
  }, Math.max(0, rest.endsAt - Date.now()));
}
document.addEventListener('visibilitychange', () => {
  const rest = S().activeSession?.rest;
  if (!notifOn() || !rest) return;
  if (document.visibilityState === 'hidden' && rest.endsAt > Date.now()) {
    const at = new Date(rest.endsAt).toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    notify('Repos en cours', { body: `Reprise à ${at} · ${rest.label || ''}`, silent: true });
    scheduleRestNotif();
  } else if (document.visibilityState === 'visible') {
    clearRestNotif();
  }
});

/* ═════════════ Écran allumé pendant la séance ═════════════ */
let wakeLock = null;
async function keepAwake(on) {
  try {
    if (on && !wakeLock && 'wakeLock' in navigator && document.visibilityState === 'visible') {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => (wakeLock = null));
    } else if (!on && wakeLock) {
      await wakeLock.release();
      wakeLock = null;
    }
  } catch { /* refusé : pas grave */ }
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    keepAwake(!!S().activeSession && route() === 'seance');
    if (route() === 'repas') ensureDayAndRender();
  }
});
function ensureDayAndRender() {
  if (S().day?.date !== dayKey()) render();
}

/* ═════════════ Journal & réglages ═════════════ */
function renderJournal() {
  const st = S();
  const since = Date.now() - 30 * 86400000;
  const recent = st.sessions.filter((s) => new Date(s.endedAt) >= since);
  const stats = recent.reduce((a, s) => {
    const x = sessionStats(s);
    a.sets += x.done; a.vol += x.volume;
    return a;
  }, { sets: 0, vol: 0 });

  // historique des charges par exercice
  const lifts = new Map();
  for (const s of st.sessions) {
    for (const e of s.exercises) {
      const done = e.sets.filter((x) => x.done);
      if (!done.length) continue;
      const top = done.reduce((b, x) => ((num(x.kg) || 0) > (num(b.kg) || 0) ? x : b), done[0]);
      const prev = lifts.get(e.exId) || { best: 0, n: 0 };
      lifts.set(e.exId, {
        last: { kg: num(top.kg) || 0, reps: top.reps, date: s.endedAt },
        best: Math.max(prev.best, num(top.kg) || 0),
        n: prev.n + 1,
      });
    }
  }
  const liftRows = [...lifts.entries()].sort((a, b) => new Date(b[1].last.date) - new Date(a[1].last.date));

  view.innerHTML = `
  <div class="wrap wrap-narrow">
    <p class="eyebrow">Suivi</p>
    <h1 class="h-xl">Journal</h1>

    <div class="stats" style="margin-top:16px">
      <div class="card stat"><b>${recent.length}</b><span>séances · 30 j</span></div>
      <div class="card stat"><b>${stats.sets}</b><span>séries validées</span></div>
      <div class="card stat"><b>${fmt(Math.round(stats.vol / 100) / 10)}</b><span>tonnes soulevées</span></div>
    </div>

    <section class="section" aria-labelledby="h-hist">
      <div class="section-head"><h2 class="h-l" id="h-hist">Séances</h2></div>
      <div class="hist">
        ${st.sessions.length ? [...st.sessions].reverse().map((s) => {
          const x = sessionStats(s);
          const dur = Math.round((new Date(s.endedAt) - new Date(s.startedAt)) / 60000);
          return `
          <details class="card hist-item">
            <summary>
              <span class="type-badge t-${s.type}">${TYPE_LABEL[s.type]}</span>
              <span><b>${esc(dateFR(s.endedAt, { weekday: 'long', day: 'numeric', month: 'short' }))}</b><br>
                <span class="small muted">${dur} min · ${x.done} séries · ${fmt(x.volume)} kg</span></span>
              <span class="muted" aria-hidden="true">+</span>
            </summary>
            <div class="hist-body">
              ${s.exercises.map((e) => `<div class="hist-ex"><span>${esc(EX[e.exId]?.n || e.exId)}</span>
                <span>${e.sets.filter((z) => z.done).map((z) => `${num(z.kg) > 0 ? fmt(num(z.kg)) + '×' : ''}${esc(z.reps)}`).join(' · ')}</span></div>`).join('')}
              <button class="btn btn-sm btn-danger" style="justify-self:start;margin-top:6px" data-action="delete-session" data-id="${s.id}">${icon('trash')} Supprimer</button>
            </div>
          </details>`;
        }).join('') : '<div class="empty">Aucune séance enregistrée. Lance ta première depuis l’onglet Séance.</div>'}
      </div>
    </section>

    ${liftRows.length ? `
    <section class="section" aria-labelledby="h-lifts">
      <div class="section-head"><h2 class="h-l" id="h-lifts">Charges</h2></div>
      <div class="card" style="padding:4px 14px">
        ${liftRows.map(([id, l]) => `
          <button class="hist-ex lift-row" data-action="ex-progress" data-ex="${id}">
            <span>${esc(EX[id]?.n || id)}<br><span class="small muted">${l.n} séance${l.n > 1 ? 's' : ''}${l.best > 0 ? ` · record ${fmt(l.best)} kg` : ''}</span></span>
            <span><b style="color:var(--text)">${l.last.kg > 0 ? `${fmt(l.last.kg)} kg × ` : ''}${esc(l.last.reps)}${l.last.kg > 0 ? '' : ' reps'}</b><br><span class="small">${esc(dateFR(l.last.date, { day: 'numeric', month: 'short' }))}</span></span>
            <span class="lift-go" aria-hidden="true">${icon('chart')}</span>
          </button>`).join('')}
      </div>
    </section>` : ''}

    <section class="section" aria-labelledby="h-set">
      <div class="section-head"><h2 class="h-l" id="h-set">Réglages</h2></div>
      <div class="card settings" style="padding:16px">
        <label class="field"><span>Objectif calorique (kcal / jour)</span>
          <input class="input" id="set-kcal" inputmode="numeric" value="${st.settings.kcalTarget}"></label>
        <button class="btn btn-sm" data-action="calc-target" style="justify-self:start">${icon('calc')} Calculer à partir de mon profil</button>
        <label class="field"><span>Poids de la barre olympique (kg)</span>
          <input class="input" id="set-bar" inputmode="decimal" value="${fmt(st.settings.barKg || 20)}"></label>
        <label class="switch"><span>Gros chiffres en séance</span>
          <input type="checkbox" id="set-big" ${st.settings.bigNumbers ? 'checked' : ''} style="width:26px;height:26px;accent-color:var(--plate)"></label>
        <label class="switch"><span>Notification de fin de repos<br><small class="muted">Utile écran verrouillé</small></span>
          <input type="checkbox" id="set-notif" ${st.settings.restNotif ? 'checked' : ''} style="width:26px;height:26px;accent-color:var(--plate)"></label>
        <div class="field"><span>Thème</span>
          <div class="seg" role="group" aria-label="Thème">
            <button data-action="theme" data-v="dark" aria-pressed="${st.settings.theme !== 'light'}">Sombre</button>
            <button data-action="theme" data-v="light" aria-pressed="${st.settings.theme === 'light'}">Clair</button>
          </div></div>
        <label class="switch"><span>Bip de fin de repos</span>
          <input type="checkbox" id="set-sound" ${st.settings.sound ? 'checked' : ''} style="width:26px;height:26px;accent-color:var(--plate)"></label>
        <div class="field"><span>Absents de mon club</span>
          ${st.settings.excluded.length ? `<div class="excluded-list">${st.settings.excluded.map((id) => `
            <span class="chip-x">${esc(EX[id]?.n || id)}<button data-action="include-ex" data-ex="${id}" aria-label="Remettre ${esc(EX[id]?.n || id)}">${icon('x')}</button></span>`).join('')}</div>`
            : '<p class="hint" style="margin:0">Aucun. Utilise « Absent du club » pendant une séance.</p>'}
        </div>
        <div class="field"><span>Données (stockées sur ce téléphone)</span>
          <div class="btn-row">
            <button class="btn btn-sm" data-action="export">${icon('download')} Sauvegarder</button>
            <label class="btn btn-sm">${icon('upload')} Restaurer<input type="file" id="import-file" accept="application/json" hidden></label>
          </div>
          <button class="btn btn-sm btn-danger" data-action="reset" style="justify-self:start;margin-top:6px">${icon('trash')} Tout effacer</button>
        </div>
      </div>
    </section>
  </div>`;
}

/* Outils partagés avec le module poids */
const helpers = { esc, fmt, num, icon, toast, dateFR, confirmSheet, store, S, openSheet, sheetHead, closeSheet };

/* ═════════════ Routage & rendu ═════════════ */
const ROUTES = ['repas', 'seance', 'poids', 'journal'];
const route = () => {
  const r = location.hash.replace(/^#\/?/, '');
  return ROUTES.includes(r) ? r : 'repas';
};

function render() {
  const r = route();
  document.querySelectorAll('.tabbar a').forEach((a) => {
    if (a.dataset.tab === r) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  $('#topbar-date').textContent = dateFR(new Date(), { weekday: 'short', day: 'numeric', month: 'short' });
  if (r === 'repas') renderNutrition();
  else if (r === 'seance') S().activeSession ? renderSession() : renderSportHome();
  else if (r === 'poids') renderWeight(view, helpers);
  else renderJournal();
  tickRest();
  keepAwake(r === 'seance' && !!S().activeSession);
  ui.justDone = null; // l'animation de validation ne joue qu'une fois
}

let lastRoute = null;
window.addEventListener('hashchange', () => {
  closeSheet();
  render();
  if (lastRoute !== route()) {
    window.scrollTo(0, 0);
    view.focus({ preventScroll: true });
    view.classList.remove('view-enter');
    void view.offsetWidth; // relance l'animation d'entrée
    view.classList.add('view-enter');
  }
  lastRoute = route();
});
document.body.classList.toggle('big-num', !!S().settings.bigNumbers);
store.subscribe(() => {
  render();
  refreshSheet();
});

/* ═════════════ Actions ═════════════ */
const actions = {
  'close-sheet': closeSheet,
  'confirm-ok': () => {
    const fn = pendingConfirm;
    pendingConfirm = null;
    closeSheet();
    fn?.();
  },

  /* nutrition */
  eat: (el) => store.update((s) => (s.day.eaten[el.dataset.slot] = !s.day.eaten[el.dataset.slot])),
  'reroll-slot': (el) => store.update((s) => {
    const k = el.dataset.slot;
    s.day.picks[k] = pickRecipe(k, s.day.picks, s.recentPicks);
    s.day.eaten[k] = false;
  }),
  'reroll-day': () => store.update((s) => {
    const picks = {};
    for (const slot of DAY_SLOTS) {
      picks[slot.key] = s.day.eaten[slot.key] ? s.day.picks[slot.key] : pickRecipe(slot.key, { ...picks, [slot.key]: s.day.picks[slot.key] }, s.recentPicks);
    }
    s.day.picks = picks;
  }),
  'toggle-off': (el) => store.update((s) => {
    const k = el.dataset.slot;
    s.day.off[k] = !s.day.off[k];
    if (s.day.off[k]) s.day.eaten[k] = false;
  }),
  filter: (el) => {
    ui.filter = el.dataset.f;
    document.querySelectorAll('[data-action="filter"]').forEach((b) => b.setAttribute('aria-pressed', b === el));
    $('#recipe-grid').innerHTML = recipeGrid();
  },
  'open-recipe': (el) => recipeSheet(el.dataset.id, el.dataset.slot || null),
  portion: (el) => {
    const f = +el.dataset.f;
    if (el.dataset.slot) {
      store.update((s) => {
        s.day.portions ||= {};
        if (f === 1) delete s.day.portions[el.dataset.slot]; else s.day.portions[el.dataset.slot] = f;
      });
    } else {
      ui.preview = f;
      refreshSheet();
    }
  },
  'fit-portions': () => {
    const st = S();
    const day = st.day;
    const act = DAY_SLOTS.filter((s) => !day.off[s.key] && recipeById(day.picks[s.key]));
    const pf = (k) => day.portions?.[k] || 1;
    const eatenK = act.filter((s) => day.eaten[s.key]).reduce((a, s) => a + recipeById(day.picks[s.key]).kcal * pf(s.key), 0);
    const rest = act.filter((s) => !day.eaten[s.key]);
    const kc = rest.map((s) => recipeById(day.picks[s.key]).kcal);
    const fs = fitPortions(kc, st.settings.kcalTarget - eatenK);
    store.update((s) => {
      s.day.portions ||= {};
      rest.forEach((r, i) => { if (fs[i] === 1) delete s.day.portions[r.key]; else s.day.portions[r.key] = fs[i]; });
    });
    const total = Math.round(eatenK + kc.reduce((a, k, i) => a + k * fs[i], 0));
    const left = st.settings.kcalTarget - total;
    toast(Math.abs(left) <= 150 ? `Portions ajustées : ${fmt(total)} kcal prévues`
      : left > 0 ? `Même en ×1,5, il manque ${fmt(left)} kcal : réactive un créneau`
        : `Même en ×0,75, ${fmt(-left)} kcal de trop : saute un créneau`);
  },
  'calc-target': () => calcSheet(),
  'edit-foods': () => foodsSheet(),
  'toggle-food': (el) => store.update((s) => {
    const f = el.dataset.food;
    const l = s.settings.excludedFoods;
    s.settings.excludedFoods = l.includes(f) ? l.filter((x) => x !== f) : [...l, f];
  }),
  'del-food': (el) => store.update((s) => (s.settings.customFoods = s.settings.customFoods.filter((x) => x !== el.dataset.food))),
  'toggle-blocked': () => {
    ui.showBlocked = !ui.showBlocked;
    $('#recipe-grid').innerHTML = recipeGrid();
  },
  'use-recipe': (el) => {
    store.update((s) => {
      s.day.picks[el.dataset.slot] = el.dataset.id;
      s.day.off[el.dataset.slot] = false;
      s.day.eaten[el.dataset.slot] = false;
    });
    closeSheet();
    toast(`Au menu : ${SLOT_BY_KEY[el.dataset.slot].label.toLowerCase()}`);
  },
  'new-recipe': () => recipeForm(),
  'edit-recipe': (el) => recipeForm(el.dataset.id),
  'delete-recipe': (el) => {
    const r = recipeById(el.dataset.id);
    confirmSheet({
      title: 'Supprimer la recette ?', text: `« ${esc(r?.name)} » sera retirée de ta liste.`, ok: 'Supprimer', danger: true,
      onOk: () => {
        store.update((s) => (s.customRecipes = s.customRecipes.filter((x) => x.id !== el.dataset.id)));
        ensureDay();
        render();
        toast('Recette supprimée');
      },
    });
  },
  'add-ing': () => {
    $('#ing-rows').insertAdjacentHTML('beforeend', ingRow());
    $('#ing-rows').lastElementChild.querySelector('input').focus();
  },
  'del-ing': (el) => {
    const rows = $('#ing-rows');
    if (rows.children.length > 1) el.closest('.ing-row').remove();
    else rows.querySelectorAll('input').forEach((i) => (i.value = ''));
  },

  /* sport */
  start: (el) => {
    unlockAudio();
    const st = S();
    const sess = generateSession(el.dataset.type, genOptions(st));
    store.update((s) => (s.activeSession = sess));
    window.scrollTo(0, 0);
  },
  regen: () => {
    const st = S();
    const sess = generateSession(st.activeSession.type, genOptions(st, st.activeSession.place));
    store.update((s) => (s.activeSession = sess));
    toast('Nouveau tirage');
  },
  place: (el) => store.update((s) => (s.settings.place = el.dataset.v)),
  'edit-equipment': () => equipmentSheet(),
  'toggle-eq': (el) => store.update((s) => {
    const p = s.settings.place;
    const list = s.settings.equipment[p] || [];
    s.settings.equipment[p] = list.includes(el.dataset.eq) ? list.filter((x) => x !== el.dataset.eq) : [...list, el.dataset.eq];
  }),
  ...weightActions(helpers),
  'toggle-set': (el) => {
    unlockAudio();
    const i = +el.dataset.i;
    const e = findExo(el.dataset.uid);
    if (!e) return;
    const ex = EX[e.exId];
    const willDo = !e.sets[i].done;
    let autoReps = false;
    ui.justDone = willDo ? `${el.dataset.uid}:${i}` : null;
    if (willDo) haptic(18);
    store.update((s) => {
      const x = s.activeSession.exercises.find((z) => z.uid === el.dataset.uid);
      const set = x.sets[i];
      set.done = willDo;
      if (willDo && !String(set.reps).trim()) {
        set.reps = String(x.target.reps[0]);
        autoReps = true;
      }
      // la charge validée est reportée sur la série suivante si elle est vide
      const next = x.sets[i + 1];
      if (willDo && next && !String(next.kg).trim() && String(set.kg).trim()) next.kg = set.kg;
    });
    if (!willDo) return;
    if (autoReps) toast(`Reps notées : ${e.target.reps[0]} (modifiable)`);
    const sess = S().activeSession;
    const idx = sess.exercises.findIndex((z) => z.uid === e.uid);
    const remaining = e.sets.findIndex((z, j) => j > i && !z.done) !== -1;
    const nextExo = sess.exercises.slice(idx + 1).find((z) => z.sets.some((st) => !st.done));
    if (remaining) startRest(e.target.rest, `${ex.n} · série ${i + 2}`);
    else if (nextExo) startRest(e.target.rest, `ensuite : ${EX[nextExo.exId].n}`);
  },
  'add-set': (el) => store.update((s) => {
    const x = s.activeSession.exercises.find((z) => z.uid === el.dataset.uid);
    const lastSet = x.sets[x.sets.length - 1];
    x.sets.push({ kg: lastSet?.kg || '', reps: '', done: false });
  }),
  'del-set': (el) => store.update((s) => {
    const x = s.activeSession.exercises.find((z) => z.uid === el.dataset.uid);
    if (x.sets.length > 1) x.sets.pop();
  }),
  rest: (el) => {
    const e = findExo(el.dataset.uid);
    if (e) startRest(e.target.rest, EX[e.exId].n);
  },
  'rest-add': (el) => {
    store.update((s) => {
      const r = s.activeSession?.rest;
      if (r) {
        r.endsAt = Math.max(Date.now() + 1000, r.endsAt + +el.dataset.d * 1000);
        r.total = Math.max(r.total, (r.endsAt - Date.now()) / 1000);
      }
    }, { silent: true });
    tickRest();
    scheduleRestNotif();
  },
  'rest-stop': () => {
    store.update((s) => s.activeSession && (s.activeSession.rest = null), { silent: true });
    tickRest();
    clearRestNotif();
  },
  replace: (el) => replaceSheet(el.dataset.uid),
  'ex-info': (el) => exInfoSheet(el.dataset.ex, el.dataset.back || null),
  'ex-progress': (el) => progressSheet(el.dataset.ex),
  'toggle-big': () => {
    store.update((s) => (s.settings.bigNumbers = !s.settings.bigNumbers));
    document.body.classList.toggle('big-num', !!S().settings.bigNumbers);
    toast(S().settings.bigNumbers ? 'Gros chiffres activés' : 'Taille normale');
  },
  'toggle-wu': (el) => {
    haptic(10);
    store.update((s) => {
      const x = s.activeSession.exercises.find((z) => z.uid === el.dataset.uid);
      x.warm ||= [];
      x.warm[+el.dataset.i] = !x.warm[+el.dataset.i];
    });
  },
  'replace-pick': (el) => doReplace(el.dataset.uid, el.dataset.ex),
  'replace-random': (el) => {
    const sess = S().activeSession;
    const e = findExo(el.dataset.uid);
    const ok = replaceOptions(sess, e).filter((c) => !c.blocked);
    if (!ok.length) return toast('Aucune alternative disponible');
    const best = ok.filter((c) => !c.note);
    const pool = best.length ? best : ok;
    doReplace(e.uid, pool[Math.floor(Math.random() * pool.length)].ex.id);
  },
  'replace-exclude': (el) => {
    const e = findExo(el.dataset.uid);
    store.update((s) => s.settings.excluded.includes(e.exId) || s.settings.excluded.push(e.exId), { silent: true });
    actions['replace-random'](el);
  },
  'exclude-ex': (el) => store.update((s) => s.settings.excluded.includes(el.dataset.ex) || s.settings.excluded.push(el.dataset.ex)),
  'include-ex': (el) => store.update((s) => (s.settings.excluded = s.settings.excluded.filter((x) => x !== el.dataset.ex))),
  finish: () => {
    const sess = S().activeSession;
    const st = sessionStats(sess);
    if (!st.done) {
      return confirmSheet({
        title: 'Aucune série validée', text: 'Rien à enregistrer. Abandonner cette séance ?', ok: 'Abandonner', danger: true,
        onOk: () => { store.update((s) => (s.activeSession = null)); keepAwake(false); },
      });
    }
    const left = st.total - st.done;
    confirmSheet({
      title: 'Terminer la séance ?',
      text: `${st.done} série${st.done > 1 ? 's' : ''} · ${fmt(st.volume)} kg soulevés.${left ? ` ${left} série${left > 1 ? 's' : ''} non validée${left > 1 ? 's' : ''} ne ser${left > 1 ? 'ont' : 'a'} pas enregistrée${left > 1 ? 's' : ''}.` : ''}`,
      ok: 'Enregistrer',
      onOk: () => {
        store.update((s) => {
          const a = s.activeSession;
          const done = {
            id: a.id, type: a.type, startedAt: a.startedAt, endedAt: new Date().toISOString(),
            ctx: a.ctx,
            exercises: a.exercises
              .map((e) => ({ exId: e.exId, slot: e.slot, target: e.target, sets: e.sets.filter((x) => x.done) }))
              .filter((e) => e.sets.length),
          };
          s.sessions.push(done);
          s.activeSession = null;
        });
        keepAwake(false);
        window.scrollTo(0, 0);
        toast('Séance enregistrée. Va manger !');
      },
    });
  },
  abandon: () => confirmSheet({
    title: 'Abandonner la séance ?', text: 'Les séries notées ne seront pas enregistrées.', ok: 'Abandonner', danger: true,
    onOk: () => { store.update((s) => (s.activeSession = null)); keepAwake(false); },
  }),

  /* journal */
  'delete-session': (el) => confirmSheet({
    title: 'Supprimer cette séance ?', text: 'Elle disparaîtra de l’historique et des charges.', ok: 'Supprimer', danger: true,
    onOk: () => store.update((s) => (s.sessions = s.sessions.filter((x) => x.id !== el.dataset.id))),
  }),
  theme: (el) => {
    document.documentElement.dataset.theme = el.dataset.v;
    $('meta[name="theme-color"]').content = el.dataset.v === 'light' ? '#efece5' : '#121211';
    store.update((s) => (s.settings.theme = el.dataset.v));
  },
  export: () => {
    const blob = new Blob([store.exportJSON()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `charge-sauvegarde-${dayKey()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  },
  reset: () => confirmSheet({
    title: 'Tout effacer ?', text: 'Recettes perso, séances et réglages seront supprimés de ce téléphone. Pense à sauvegarder avant.',
    ok: 'Tout effacer', danger: true, onOk: () => { store.reset(); toast('Données effacées'); },
  }),
};

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el || el.disabled) return;
  const fn = actions[el.dataset.action];
  if (fn) {
    e.preventDefault();
    fn(el, e);
  }
});

document.addEventListener('input', (e) => {
  const t = e.target;
  if (t.dataset.set) {
    // saisie en séance : sauvegarde silencieuse pour ne pas perdre le focus
    store.update((s) => {
      const x = s.activeSession?.exercises.find((z) => z.uid === t.dataset.uid);
      if (x) x.sets[+t.dataset.i][t.dataset.set] = t.value.replace(/[^\d.,]/g, '');
    }, { silent: true });
    if (t.dataset.set === 'kg') updatePlates(t.dataset.uid);
  } else if (t.closest('#calc-form')) {
    $('#calc-result').innerHTML = calcResultHTML(readCalcForm(t.closest('#calc-form')));
  } else if (t.id === 'recipe-q') {
    ui.q = t.value;
    $('#recipe-grid').innerHTML = recipeGrid();
  } else if (t.closest('#recipe-form') && ['p', 'c', 'f'].includes(t.name)) {
    const f = t.form;
    const v = ['p', 'c', 'f'].map((n) => num(f.elements[n].value) || 0);
    $('#f-kcal').placeholder = String(Math.round(v[0] * 4 + v[1] * 4 + v[2] * 9) || 'auto');
  }
});

document.addEventListener('change', (e) => {
  const t = e.target;
  if (t.id === 'set-kcal') {
    const v = num(t.value);
    if (v && v >= 1200 && v <= 8000) {
      store.update((s) => (s.settings.kcalTarget = Math.round(v)), { silent: true });
      toast(`Objectif : ${fmt(Math.round(v))} kcal / jour`);
    } else {
      t.value = S().settings.kcalTarget;
      toast('Objectif entre 1 200 et 8 000 kcal');
    }
  } else if (weightChange(t, helpers)) {
    /* géré par le module poids */
  } else if (t.id === 'set-bar') {
    const v = num(t.value);
    if (v && v >= 5 && v <= 30) store.update((s) => (s.settings.barKg = v), { silent: true });
    else t.value = fmt(S().settings.barKg || 20);
  } else if (t.id === 'set-big') {
    store.update((s) => (s.settings.bigNumbers = t.checked), { silent: true });
    document.body.classList.toggle('big-num', t.checked);
  } else if (t.id === 'set-notif') {
    toggleRestNotif(t);
  } else if (t.id === 'set-sound') {
    store.update((s) => (s.settings.sound = t.checked), { silent: true });
  } else if (t.id === 'import-file' && t.files[0]) {
    t.files[0].text().then((txt) => {
      try {
        store.importJSON(txt);
        toast('Données restaurées');
      } catch {
        toast('Fichier invalide');
      }
    });
  }
});

document.addEventListener('submit', (e) => {
  if (e.target.getAttribute('id') === 'recipe-form') {
    e.preventDefault();
    submitRecipe(e.target);
  } else if (e.target.getAttribute('id') === 'calc-form') {
    e.preventDefault();
    const v = readCalcForm(e.target);
    if (!v.age || !v.height || !v.weight) return toast('Renseigne âge, taille et poids');
    const res = energyTarget(v, v.weight);
    store.update((s) => {
      s.settings.profile = { sex: v.sex, age: v.age, height: v.height, weight: v.weight, activity: v.activity, surplus: v.surplus };
      s.settings.kcalTarget = res.target;
      s.settings.lastKcalAdjust = dayKey();
    });
    closeSheet();
    toast(`Objectif : ${fmt(res.target)} kcal / jour`);
  } else if (e.target.getAttribute('id') === 'food-form') {
    e.preventDefault();
    const v = String(e.target.elements.food.value || '').trim().toLowerCase();
    if (v) store.update((s) => s.settings.customFoods.includes(v) || s.settings.customFoods.push(v));
  } else if (e.target.getAttribute('id') === 'weight-form') {
    e.preventDefault();
    actions['save-weight'](e.target);
  }
});

// « Entrée » dans un champ de série : passe au champ suivant
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' || !e.target.dataset?.set) return;
  e.preventDefault();
  const inputs = [...document.querySelectorAll('[data-set]')];
  const i = inputs.indexOf(e.target);
  if (inputs[i + 1]) inputs[i + 1].focus();
  else e.target.blur();
});

setInterval(() => {
  const el = $('#elapsed');
  const sess = S().activeSession;
  if (el && sess) el.textContent = mmss((Date.now() - new Date(sess.startedAt)) / 1000);
  tickRest();
}, 250);

/* ═════════════ Hors ligne ═════════════ */
// Le service worker exige HTTPS (ou localhost). ?nosw désactive pour le debug.
if ('serviceWorker' in navigator && window.isSecureContext && !location.search.includes('nosw')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}

/* ═════════════ Démarrage ═════════════ */
if (!location.hash) history.replaceState(null, '', S().activeSession ? '#/seance' : '#/repas');
lastRoute = route();
ensureDay();
render();
