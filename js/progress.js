/*
 * Progression par exercice : une valeur par séance.
 *  - avec charge : 1RM estimé (Epley) de la meilleure série ;
 *  - poids du corps : meilleure série en répétitions (ou en secondes pour les tenues).
 * Graphique SVG mono-série (ligne + points), réticule et info-bulle au survol / toucher.
 */
import { EX } from './data-exercises.js';
import { e1rm } from './calc.js';

const num = (v) => {
  const n = parseFloat(String(v ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};

export function progressSeries(exId, sessions = []) {
  const ex = EX[exId];
  const out = [];
  for (const s of sessions) {
    for (const e of s.exercises) {
      if (e.exId !== exId) continue;
      const done = e.sets.filter((x) => x.done);
      if (!done.length) continue;
      let best = null;
      for (const x of done) {
        const kg = num(x.kg) || 0, reps = num(x.reps) || 0;
        const v = kg > 0 ? e1rm(kg, reps) : reps;
        if (!best || v > best.v || (kg > 0) > (best.kg > 0)) best = { v, kg, reps };
      }
      out.push({ date: s.endedAt || s.startedAt, value: Math.round(best.v * 10) / 10, kg: best.kg, reps: best.reps });
    }
  }
  const weighted = out.some((p) => p.kg > 0);
  const metric = weighted ? 'e1rm' : ex?.unit === 's' ? 'secs' : 'reps';
  // si l'exercice est passé du poids du corps au lesté, on ne mélange pas les unités
  return { metric, pts: weighted ? out.filter((p) => p.kg > 0) : out };
}

export const METRIC_LABEL = { e1rm: '1RM estimé (kg)', reps: 'Meilleure série (reps)', secs: 'Meilleure tenue (s)' };

export function drawProgress(el, { pts, metric }, h) {
  if (!el) return;
  const { fmt, esc } = h;
  if (pts.length < 2) {
    el.innerHTML = `<p class="muted small" style="margin:20px 0;text-align:center">${pts.length ? 'La courbe apparaît dès la 2ᵉ séance.' : 'Pas encore de séance sur cet exercice.'}</p>`;
    return;
  }
  const W = Math.max(260, el.clientWidth || 300), H = 200;
  const m = { l: 40, r: 12, t: 12, b: 26 };
  const t = (d) => new Date(d).getTime();
  const x0 = t(pts[0].date), x1 = t(pts[pts.length - 1].date);
  let lo = Math.min(...pts.map((p) => p.value)), hi = Math.max(...pts.map((p) => p.value));
  const pad = Math.max(1, (hi - lo) * 0.15);
  lo -= pad; hi += pad;
  const step = [1, 2, 2.5, 5, 10, 20, 25, 50].find((s) => (hi - lo) / s <= 4) || 50;
  lo = Math.floor(lo / step) * step; hi = Math.ceil(hi / step) * step;
  const X = (d) => m.l + ((t(d) - x0) / Math.max(1, x1 - x0)) * (W - m.l - m.r);
  const Y = (v) => m.t + (1 - (v - lo) / (hi - lo)) * (H - m.t - m.b);
  const ticks = [];
  for (let v = lo; v <= hi + 1e-9; v += step) ticks.push(v);
  const fd = (d) => new Date(d).toLocaleDateString('fr-BE', { day: 'numeric', month: 'short' });
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${X(p.date).toFixed(1)},${Y(p.value).toFixed(1)}`).join('');

  el.innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" class="wsvg" role="img" aria-label="${METRIC_LABEL[metric]}, ${pts.length} séances">
      ${ticks.map((v) => `<line x1="${m.l}" x2="${W - m.r}" y1="${Y(v)}" y2="${Y(v)}" class="grid"/>
        <text x="${m.l - 8}" y="${Y(v) + 4}" text-anchor="end" class="axis">${fmt(v)}</text>`).join('')}
      <text x="${m.l}" y="${H - 6}" class="axis">${fd(pts[0].date)}</text>
      <text x="${W - m.r}" y="${H - 6}" text-anchor="end" class="axis">${fd(pts[pts.length - 1].date)}</text>
      <path d="${line}" class="wtrend"/>
      ${pts.map((p) => `<circle cx="${X(p.date)}" cy="${Y(p.value)}" r="4" class="pdot"/>`).join('')}
      <g class="cross" visibility="hidden"><line y1="${m.t}" y2="${H - m.b}" class="crossline"/><circle r="6" class="crossdot pdot"/></g>
      <rect x="${m.l}" y="0" width="${W - m.l - m.r}" height="${H}" fill="transparent"/>
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
    cross.querySelector('circle').setAttribute('cx', cx);
    cross.querySelector('circle').setAttribute('cy', Y(best.value));
    tip.hidden = false;
    const set = best.kg > 0 ? `${fmt(best.kg)} kg × ${fmt(best.reps)}` : `${fmt(best.reps)} ${metric === 'secs' ? 's' : 'reps'}`;
    tip.innerHTML = `<b>${esc(new Date(best.date).toLocaleDateString('fr-BE', { weekday: 'short', day: 'numeric', month: 'short' }))}</b><br>
      Meilleure série ${set}${metric === 'e1rm' ? `<br>1RM estimé ${fmt(best.value)} kg` : ''}`;
    const px = (cx / W) * r.width;
    tip.style.left = `${Math.min(Math.max(px - tip.offsetWidth / 2, 0), r.width - tip.offsetWidth)}px`;
  };
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerdown', move);
  svg.addEventListener('pointerleave', () => { cross.setAttribute('visibility', 'hidden'); tip.hidden = true; });
}
