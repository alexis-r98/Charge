/*
 * Suivi du poids : pesées, moyenne glissante 7 jours, rythme hebdomadaire
 * et ajustement de l'objectif calorique.
 *
 * Repères prise de masse « propre » : +0,25 à +0,5 % du poids de corps par semaine
 * (synthèses MacroFactor / Helms ; Garthe et al. : un rythme plus rapide ajoute
 * surtout du gras). Un débutant ectomorphe peut viser le haut de la fourchette.
 */
import { dayKey } from './generator.js';

const DAY = 86400000;
const RATE_LOW = 0.25; // % / semaine
const RATE_HIGH = 0.5;
const ADJUST_COOLDOWN_DAYS = 10;
const ui = { range: 90 };

const t = (d) => new Date(`${d}T12:00:00`).getTime();

/** Moyenne des pesées des 7 derniers jours (fenêtre glissante). */
export function rollingAvg(weights) {
  return weights.map((w) => {
    const win = weights.filter((x) => t(x.date) <= t(w.date) && t(x.date) > t(w.date) - 7 * DAY);
    return { date: w.date, kg: w.kg, avg: win.reduce((a, x) => a + x.kg, 0) / win.length };
  });
}

/** Rythme (kg / semaine) par régression linéaire sur les 21 derniers jours. */
export function weeklyRate(weights, now = Date.now()) {
  const pts = weights.filter((w) => t(w.date) > now - 21 * DAY);
  if (pts.length < 4) return null;
  const span = (t(pts[pts.length - 1].date) - t(pts[0].date)) / DAY;
  if (span < 10) return null;
  const xs = pts.map((p) => (t(p.date) - t(pts[0].date)) / DAY);
  const ys = pts.map((p) => p.kg);
  const mx = xs.reduce((a, b) => a + b, 0) / xs.length;
  const my = ys.reduce((a, b) => a + b, 0) / ys.length;
  let num = 0, den = 0;
  xs.forEach((x, i) => { num += (x - mx) * (ys[i] - my); den += (x - mx) ** 2; });
  return den ? (num / den) * 7 : null;
}

/** Verdict + ajustement conseillé de l'objectif calorique. */
export function verdict(rate, current) {
  if (rate === null || !current) return null;
  const pct = (rate / current) * 100;
  if (pct < 0.1) return { pct, level: 'low', title: 'Ça stagne', text: 'Ton métabolisme brûle tout : il faut manger plus.', delta: 250 };
  if (pct < RATE_LOW) return { pct, level: 'low', title: 'Un peu lent', text: 'Tu prends, mais sous le rythme visé.', delta: 150 };
  if (pct <= RATE_HIGH) return { pct, level: 'ok', title: 'Bon rythme', text: 'Prise de masse propre : continue comme ça.', delta: 0 };
  if (pct <= 0.75) return { pct, level: 'ok', title: 'Rythme soutenu', text: 'OK en début de prise de masse. Surveille ton tour de taille.', delta: 0 };
  return { pct, level: 'high', title: 'Trop rapide', text: 'Au-delà, l’excédent part surtout en gras.', delta: -200 };
}

export function renderWeight(view, h) {
  const { esc, fmt, icon, S } = h;
  const st = S();
  const weights = st.weights;
  const pts = rollingAvg(weights);
  const last = pts[pts.length - 1];
  const first = pts[0];
  const current = last ? last.avg : null;
  const rate = weeklyRate(weights);
  const v = verdict(rate, current);
  const goal = st.settings.goalWeight;
  const lastAdjust = st.settings.lastKcalAdjust;
  const cooling = lastAdjust && (Date.now() - t(lastAdjust)) / DAY < ADJUST_COOLDOWN_DAYS;
  const band = current ? [current * RATE_LOW / 100, current * RATE_HIGH / 100] : null;
  let eta = '';
  if (goal && current && rate && rate > 0 && goal > current) {
    const weeks = (goal - current) / rate;
    eta = `Au rythme actuel : ${fmt(Math.round(goal * 10) / 10)} kg vers le ${esc(new Date(Date.now() + weeks * 7 * DAY).toLocaleDateString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric' }))}.`;
  }
  const signed = (n, d = 2) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${fmt(Math.abs(Math.round(n * 10 ** d) / 10 ** d))}`;

  view.innerHTML = `
  <div class="wrap wrap-narrow">
    <p class="eyebrow">Prise de masse</p>
    <h1 class="h-xl">Mon poids</h1>

    <form class="card weigh-form" id="weight-form" method="dialog" style="margin-top:16px">
      <label class="field weigh-kg"><span>Poids du jour (kg)</span>
        <input class="input" name="kg" inputmode="decimal" autocomplete="off" required
          placeholder="${last ? esc(fmt(last.kg)) : '65,0'}" aria-describedby="weigh-tip"></label>
      <label class="field"><span>Date</span>
        <input class="input" type="date" name="date" value="${dayKey()}" max="${dayKey()}"></label>
      <button class="btn btn-primary" type="submit">${icon('check')} Enregistrer</button>
      <p class="hint" id="weigh-tip">Le matin, à jeun, après les toilettes, 3 à 7 fois par semaine : c’est la moyenne qui compte, pas la pesée du jour.</p>
    </form>

    <div class="wstats">
      <div class="card stat"><b>${current ? fmt(Math.round(current * 10) / 10) : '—'}</b><span>kg · moyenne 7 j</span></div>
      <div class="card stat"><b>${rate !== null ? signed(rate) : '—'}</b><span>kg / semaine</span></div>
      <div class="card stat"><b>${first && last && pts.length > 1 ? signed(last.avg - first.avg, 1) : '—'}</b><span>kg depuis le début</span></div>
    </div>

    ${v ? `
    <div class="card verdict v-${v.level}">
      <div class="verdict-head">
        <span class="verdict-icon" aria-hidden="true">${icon(v.level === 'ok' ? 'check' : 'info')}</span>
        <div><b>${v.title}</b> · ${signed(v.pct)} % / semaine
          <p class="small muted" style="margin:4px 0 0">${v.text} Cible : ${signed(band[0])} à ${signed(band[1])} kg / semaine.</p></div>
      </div>
      ${v.delta ? (cooling
        ? `<p class="small muted" style="margin:10px 0 0">Objectif ajusté le ${esc(new Date(t(lastAdjust)).toLocaleDateString('fr-BE', { day: 'numeric', month: 'short' }))} : attends ${ADJUST_COOLDOWN_DAYS}–14 jours avant de réévaluer.</p>`
        : `<button class="btn btn-sm ${v.delta > 0 ? 'btn-primary' : ''}" data-action="apply-kcal" data-d="${v.delta}" style="margin-top:12px">
            ${v.delta > 0 ? 'Monter' : 'Baisser'} l’objectif à ${fmt(st.settings.kcalTarget + v.delta)} kcal (${v.delta > 0 ? '+' : '−'}${Math.abs(v.delta)})</button>`) : ''}
    </div>` : `
    <div class="ctx-note" style="margin-top:12px">${icon('info')}<span>Pèse-toi au moins 4 fois sur 10 jours : l’app calcule ensuite ton rythme et te dit s’il faut manger plus.</span></div>`}

    <section class="section" aria-labelledby="h-curve">
      <div class="section-head">
        <h2 class="h-l" id="h-curve">Courbe</h2>
        <div class="seg" role="group" aria-label="Période">
          ${[[30, '30 j'], [90, '90 j'], [0, 'Tout']].map(([d, l]) => `<button data-action="w-range" data-d="${d}" aria-pressed="${ui.range === d}">${l}</button>`).join('')}
        </div>
      </div>
      <div class="card chart-card">
        <div class="legend" aria-hidden="true">
          <span><i class="lg-dot"></i>Pesée</span><span><i class="lg-line"></i>Moyenne 7 jours</span>
          ${goal ? '<span><i class="lg-goal"></i>Objectif</span>' : ''}
        </div>
        <div class="chart" id="w-chart" role="img" aria-label="Évolution du poids, ${pts.length} pesées"></div>
      </div>
    </section>

    <section class="section" aria-labelledby="h-goal">
      <div class="card settings" style="padding:16px">
        <label class="field"><span>Poids visé (kg, optionnel)</span>
          <input class="input" id="w-goal" inputmode="decimal" value="${goal ? esc(fmt(goal)) : ''}" placeholder="ex. 72"></label>
        ${eta ? `<p class="small" style="margin:0">${eta}</p>` : ''}
      </div>
    </section>

    <section class="section" aria-labelledby="h-wlist">
      <div class="section-head"><h2 class="h-l" id="h-wlist">Pesées</h2></div>
      ${pts.length ? `<div class="card wlist">
        ${[...pts].reverse().slice(0, 60).map((p, i, arr) => {
          const prev = arr[i + 1];
          const d = prev ? p.kg - prev.kg : null;
          return `<div class="wrow">
            <span>${esc(new Date(t(p.date)).toLocaleDateString('fr-BE', { weekday: 'short', day: 'numeric', month: 'short' }))}</span>
            <b>${fmt(p.kg)} kg</b>
            <span class="muted small">${d === null ? '' : signed(d, 1)}</span>
            <button class="icon-btn sm" data-action="del-weight" data-date="${p.date}" aria-label="Supprimer la pesée du ${p.date}">${icon('trash')}</button>
          </div>`;
        }).join('')}
      </div>` : '<div class="empty">Aucune pesée pour l’instant.</div>'}
    </section>
  </div>`;

  drawChart(document.getElementById('w-chart'), pts, goal, h);
}

/* ─── Graphique SVG (pesées + moyenne 7 j), avec réticule au survol / toucher ─── */
let resizeBound = false;
function drawChart(el, allPts, goal, h) {
  if (!el) return;
  const { fmt, esc } = h;
  const cutoff = ui.range ? Date.now() - ui.range * DAY : -Infinity;
  const pts = allPts.filter((p) => t(p.date) >= cutoff);
  if (pts.length < 2) {
    const gl = el.closest('.chart-card')?.querySelector('.lg-goal')?.parentElement;
    if (gl) gl.hidden = true;
    el.innerHTML = `<p class="muted small" style="margin:24px 0;text-align:center">${pts.length ? 'Encore une pesée et la courbe apparaît.' : 'Pas de pesée sur cette période.'}</p>`;
    return;
  }
  const W = Math.max(280, el.clientWidth);
  const H = 220;
  const m = { l: 40, r: 12, t: 12, b: 26 };
  const x0 = t(pts[0].date), x1 = t(pts[pts.length - 1].date);
  const vals = pts.flatMap((p) => [p.kg, p.avg]).concat(goal && ui.range === 0 ? [goal] : []);
  let lo = Math.min(...vals), hi = Math.max(...vals);
  const pad = Math.max(0.4, (hi - lo) * 0.15);
  lo = Math.floor((lo - pad) * 2) / 2; hi = Math.ceil((hi + pad) * 2) / 2;
  const X = (d) => m.l + ((t(d) - x0) / Math.max(1, x1 - x0)) * (W - m.l - m.r);
  const Y = (kg) => m.t + (1 - (kg - lo) / (hi - lo)) * (H - m.t - m.b);
  const step = [0.2, 0.5, 1, 2, 5, 10].find((s) => (hi - lo) / s <= 4) || 10;
  lo = Math.floor(lo / step) * step;
  hi = Math.ceil(hi / step) * step;
  const ticks = [];
  for (let v = lo; v <= hi + 1e-9; v += step) ticks.push(Math.round(v * 10) / 10);
  const fd = (d) => new Date(t(d)).toLocaleDateString('fr-BE', { day: 'numeric', month: 'short' });
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${X(p.date).toFixed(1)},${Y(p.avg).toFixed(1)}`).join('');
  const showGoal = goal && goal >= lo && goal <= hi;
  const goalLegend = el.closest('.chart-card')?.querySelector('.lg-goal')?.parentElement;
  if (goalLegend) goalLegend.hidden = !showGoal;

  el.innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" class="wsvg">
      ${ticks.map((v) => `<line x1="${m.l}" x2="${W - m.r}" y1="${Y(v)}" y2="${Y(v)}" class="grid"/>
        <text x="${m.l - 8}" y="${Y(v) + 4}" text-anchor="end" class="axis">${fmt(Math.round(v * 10) / 10)}</text>`).join('')}
      <text x="${m.l}" y="${H - 6}" class="axis">${fd(pts[0].date)}</text>
      <text x="${W - m.r}" y="${H - 6}" text-anchor="end" class="axis">${fd(pts[pts.length - 1].date)}</text>
      ${showGoal ? `<line x1="${m.l}" x2="${W - m.r}" y1="${Y(goal)}" y2="${Y(goal)}" class="goal"/>` : ''}
      ${pts.map((p) => `<circle cx="${X(p.date)}" cy="${Y(p.kg)}" r="4" class="wdot"/>`).join('')}
      <path d="${line}" class="wtrend"/>
      <g class="cross" visibility="hidden">
        <line y1="${m.t}" y2="${H - m.b}" class="crossline"/>
        <circle r="6" class="crossdot"/>
      </g>
      <rect x="${m.l}" y="0" width="${W - m.l - m.r}" height="${H}" fill="transparent" class="hit"/>
    </svg>
    <div class="wtip" hidden></div>`;

  const svg = el.querySelector('svg');
  const cross = svg.querySelector('.cross');
  const tip = el.querySelector('.wtip');
  const move = (ev) => {
    const r = svg.getBoundingClientRect();
    const x = ((ev.clientX - r.left) / r.width) * W;
    let best = pts[0];
    for (const p of pts) if (Math.abs(X(p.date) - x) < Math.abs(X(best.date) - x)) best = p;
    const cx = X(best.date);
    cross.setAttribute('visibility', 'visible');
    cross.querySelector('line').setAttribute('x1', cx);
    cross.querySelector('line').setAttribute('x2', cx);
    const dot = cross.querySelector('circle');
    dot.setAttribute('cx', cx);
    dot.setAttribute('cy', Y(best.kg));
    tip.hidden = false;
    tip.innerHTML = `<b>${esc(new Date(t(best.date)).toLocaleDateString('fr-BE', { weekday: 'short', day: 'numeric', month: 'short' }))}</b><br>
      Pesée ${fmt(best.kg)} kg<br>Moyenne 7 j ${fmt(Math.round(best.avg * 10) / 10)} kg`;
    const px = (cx / W) * r.width;
    tip.style.left = `${Math.min(Math.max(px - tip.offsetWidth / 2, 0), r.width - tip.offsetWidth)}px`;
  };
  const leave = () => { cross.setAttribute('visibility', 'hidden'); tip.hidden = true; };
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerdown', move);
  svg.addEventListener('pointerleave', leave);

  if (!resizeBound) {
    resizeBound = true;
    let tm;
    window.addEventListener('resize', () => {
      clearTimeout(tm);
      tm = setTimeout(() => {
        const c = document.getElementById('w-chart');
        if (c) drawChart(c, rollingAvg(h.S().weights), h.S().settings.goalWeight, h);
      }, 150);
    });
  }
}

export const weightActions = (h) => ({
  'save-weight': (form) => {
    const kg = h.num(form.elements.kg.value);
    const date = form.elements.date.value || dayKey();
    if (!kg || kg < 30 || kg > 250) return h.toast('Poids entre 30 et 250 kg');
    if (date > dayKey()) return h.toast('Pas de pesée dans le futur');
    h.store.update((s) => {
      s.weights = s.weights.filter((w) => w.date !== date);
      s.weights.push({ date, kg: Math.round(kg * 10) / 10 });
      s.weights.sort((a, b) => (a.date < b.date ? -1 : 1));
    });
    h.toast(`Pesée enregistrée : ${h.fmt(Math.round(kg * 10) / 10)} kg`);
  },
  'del-weight': (el) => h.confirmSheet({
    title: 'Supprimer cette pesée ?', text: el.dataset.date, ok: 'Supprimer', danger: true,
    onOk: () => h.store.update((s) => (s.weights = s.weights.filter((w) => w.date !== el.dataset.date))),
  }),
  'w-range': (el) => {
    ui.range = +el.dataset.d;
    h.store.update(() => {}); // re-rendu
  },
  'apply-kcal': (el) => {
    const d = +el.dataset.d;
    h.store.update((s) => {
      s.settings.kcalTarget = Math.max(1500, s.settings.kcalTarget + d);
      s.settings.lastKcalAdjust = dayKey();
    });
    h.toast(`Objectif : ${h.fmt(h.S().settings.kcalTarget)} kcal / jour`);
  },
});

/** Champs « change » du module ; renvoie true si traité. */
export function weightChange(el, h) {
  if (el.id !== 'w-goal') return false;
  const v = h.num(el.value);
  h.store.update((s) => (s.settings.goalWeight = v && v > 30 && v < 250 ? Math.round(v * 10) / 10 : null));
  return true;
}
