/*
 * Calculs purs : besoins caloriques, cibles de macros, portions, échauffement, disques, 1RM.
 * (testés sous Node : tests/calc.test.mjs)
 */

/* ─── Besoins caloriques (Mifflin-St Jeor) ─── */
export const ACTIVITY = [
  { k: 1.375, label: 'Peu actif', hint: 'Bureau, < 6 000 pas, 3 séances / semaine' },
  { k: 1.55, label: 'Modéré', hint: '6 000 – 10 000 pas ou travail debout, 3 séances' },
  { k: 1.725, label: 'Très actif', hint: 'Travail physique ou > 12 000 pas, 3 séances' },
];
export const SURPLUS = [
  { k: 300, label: '+300', hint: 'Prise très propre, lente' },
  { k: 450, label: '+450', hint: 'Conseillé ectomorphe' },
  { k: 600, label: '+600', hint: 'Si la balance ne bouge pas' },
];

/** Métabolisme de base (kcal/j). sex: 'm' | 'f', age (ans), height (cm), weight (kg). */
export function bmr({ sex = 'm', age, height, weight }) {
  return 10 * weight + 6.25 * height - 5 * age + (sex === 'f' ? -161 : 5);
}

/** Objectif complet : maintenance, cible arrondie à 50 kcal. */
export function energyTarget(profile, weight) {
  const b = bmr({ ...profile, weight });
  const tdee = b * (profile.activity || 1.55);
  const target = Math.round((tdee + (profile.surplus ?? 450)) / 50) * 50;
  return { bmr: Math.round(b), tdee: Math.round(tdee), target };
}

/** Cibles de macros : 2 g/kg de protéines, 25 % des kcal en lipides, le reste en glucides. */
export function macroTargets(kcal, weight) {
  if (!kcal || !weight) return null;
  const p = Math.round(weight * 2);
  const f = Math.round((kcal * 0.25) / 9);
  const c = Math.max(0, Math.round((kcal - p * 4 - f * 9) / 4));
  return { p, c, f };
}

/* ─── Portions ─── */
export const PORTIONS = [0.75, 1, 1.25, 1.5];
const fr = (n) => String(n).replace('.', ',');

/** Met à l'échelle les nombres d'une quantité affichée (« 350 ml », « 1 (100 g) », « ½ »). */
export function scaleQty(q, f) {
  if (!q || f === 1) return q;
  return String(q)
    .replace(/½/g, '0.5')
    .replace(/\d+(?:[.,]\d+)?/g, (m) => {
      const v = parseFloat(m.replace(',', '.')) * f;
      if (v >= 20) return fr(Math.round(v / 5) * 5);
      if (v >= 5) return fr(Math.round(v));
      return fr(Math.round(v * 4) / 4);
    });
}

/** Facteur commun (arrondi au quart, borné) pour que les repas restants atteignent la cible. */
export function fitFactor(remainingKcal, baseRemaining, min = 0.75, max = 1.5) {
  if (baseRemaining <= 0) return 1;
  const raw = remainingKcal / baseRemaining;
  return Math.min(max, Math.max(min, Math.round(raw * 4) / 4));
}

/**
 * Portions par créneau (pas de 0,25, bornes [min, max]) pour que la somme des kcal
 * approche au mieux la cible : départ uniforme, puis retouches une à une.
 */
export function fitPortions(kcals, target, min = 0.75, max = 1.5) {
  if (!kcals.length) return [];
  const base = kcals.reduce((a, b) => a + b, 0);
  const f = fitFactor(target, base, min, max);
  const out = kcals.map(() => f);
  const total = () => kcals.reduce((a, k, i) => a + k * out[i], 0);
  for (let guard = 0; guard < 40; guard++) {
    const diff = target - total();
    let best = null;
    kcals.forEach((k, i) => {
      for (const d of [0.25, -0.25]) {
        const nf = out[i] + d;
        if (nf < min - 1e-9 || nf > max + 1e-9) continue;
        const nd = Math.abs(diff - k * d);
        if (nd < Math.abs(diff) - 1 && (!best || nd < best.nd)) best = { i, nf, nd };
      }
    });
    if (!best) break;
    out[best.i] = best.nf;
  }
  return out;
}

/* ─── Barre & disques ─── */
export const PLATES = [20, 15, 10, 5, 2.5, 1.25];
/** Exercices à la barre olympique chargée de disques. */
export const BARBELL = new Set(['bench-bb', 'squat', 'ohp', 'row-bb', 'rdl', 'hip-thrust']);

/** Disques par côté pour une charge totale. */
export function platesPerSide(total, bar = 20, plates = PLATES) {
  let side = (total - bar) / 2;
  if (!(side > 0)) return { per: [], rest: 0, ok: total >= bar };
  const per = [];
  for (const p of plates) {
    while (side >= p - 1e-9) { per.push(p); side -= p; }
  }
  return { per, rest: Math.round(side * 100) / 100, ok: side < 0.01 };
}

const r25 = (n) => Math.round(n / 2.5) * 2.5;

/** Séries d'échauffement avant la charge de travail. */
export function warmupSets(work, { barbell = false, bar = 20 } = {}) {
  if (!work || work <= 0) return [];
  if (barbell) {
    if (work < bar + 10) return [{ kg: bar, reps: 10 }];
    const out = [{ kg: bar, reps: 10 }];
    for (const [pct, reps] of [[0.4, 8], [0.6, 5], [0.8, 3]]) {
      const kg = r25(work * pct);
      if (kg > out[out.length - 1].kg && kg < work) out.push({ kg, reps });
    }
    return out;
  }
  const out = [];
  for (const [pct, reps] of [[0.5, 10], [0.75, 5]]) {
    const kg = r25(work * pct);
    if (kg > 0 && kg < work && (!out.length || kg > out[out.length - 1].kg)) out.push({ kg, reps });
  }
  return out;
}

/* ─── Force estimée ─── */
/** 1RM estimé (Epley), plafonné à 12 reps pour rester fiable. */
export const e1rm = (kg, reps) => (kg > 0 && reps > 0 ? kg * (1 + Math.min(reps, 12) / 30) : 0);
