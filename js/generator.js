/*
 * Générateur de séances PPL — logique pure, sans DOM (testable sous Node).
 *
 * Règles de récupération pour un PPL enchaîné sur 3 jours consécutifs :
 *  1. Charge axiale : si la séance d'hier contenait un mouvement axial
 *     (squat libre, RDL, rowing barre, T-bar, OHP debout, squat Smith),
 *     la séance du jour n'en contient aucun → machines stables / unilatéral.
 *  2. Plafond axial dans une même séance : 1 en Push/Pull, 2 en Legs.
 *  3. 3ᵉ jour d'affilée : créneau optionnel retiré et séries à 4 ramenées à 3
 *     (≈ −15 % de volume), machines légèrement favorisées.
 *  4. Variété : les exercices de la dernière séance du même type sont moins probables.
 *
 * Lieux : 'gym' (catalogue Basic-Fit), 'street' et 'home' (poids du corps, filtrés par le
 * matériel disponible). Les échelles de progression (fam/lvl) choisissent la variante
 * de ton niveau et la font monter quand toutes les séries atteignent le haut de la fourchette.
 */
import { EXERCISES, EX, TEMPLATES, FAMILIES, FAMILY_START, PLACE_EQ } from './data-exercises.js';

const DAY = 86400000;
const STREET_IN_GYM = new Set(['bar', 'dips', 'lowbar', 'bench', 'floor']);

export function dayKey(d = new Date()) {
  const x = new Date(d);
  const m = String(x.getMonth() + 1).padStart(2, '0');
  const j = String(x.getDate()).padStart(2, '0');
  return `${x.getFullYear()}-${m}-${j}`;
}

const sessionDay = (s) => dayKey(s.endedAt || s.startedAt);
export const isAxial = (exId) => !!EX[exId]?.axial;
const num = (v) => {
  const n = parseFloat(String(v ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};

export const templateFor = (place, type) => TEMPLATES[place === 'gym' ? 'gym' : 'street'][type];

/** Matériel autorisé pour un lieu (null = salle, tout le catalogue salle). */
export function allowedEq(place, equipment) {
  if (place === 'gym' || !place) return null;
  return new Set(equipment?.[place] || PLACE_EQ[place]);
}

/** L'exercice est-il faisable ici ? */
export function isAvailable(ex, place = 'gym', eqSet = null, replacing = false) {
  if (place === 'gym' || !eqSet) {
    if (ex.gym !== false) return true;
    // en salle, les variantes street restent proposées en remplacement (barre fixe, dips, sol…)
    return replacing && !ex.filler && ex.eq.every((t) => STREET_IN_GYM.has(t));
  }
  return ex.street !== false && ex.eq.every((t) => eqSet.has(t));
}

/** Contexte de fatigue à partir de l'historique des séances terminées. */
export function fatigueContext(sessions = [], now = new Date()) {
  const byDay = new Map();
  for (const s of sessions) {
    const k = sessionDay(s);
    if (!byDay.has(k)) byDay.set(k, []);
    byDay.get(k).push(s);
  }
  const today = new Date(now);
  let consecutive = 0;
  for (let i = 1; i <= 6; i++) {
    if (byDay.has(dayKey(today.getTime() - i * DAY))) consecutive++;
    else break;
  }
  const yesterday = byDay.get(dayKey(today.getTime() - DAY)) || [];
  const axialYesterday = [];
  for (const s of yesterday) {
    for (const e of s.exercises) {
      if (isAxial(e.exId) && e.sets.some((st) => st.done)) axialYesterday.push(e.exId);
    }
  }
  return {
    consecutive,
    dayIndex: consecutive + 1,
    axialYesterday: [...new Set(axialYesterday)],
    yesterdayType: yesterday[0]?.type || null,
  };
}

/** Dernière performance enregistrée sur un exercice. */
export function lastPerformance(exId, sessions = []) {
  for (let i = sessions.length - 1; i >= 0; i--) {
    const s = sessions[i];
    const e = s.exercises.find((x) => x.exId === exId);
    if (!e) continue;
    const done = e.sets.filter((st) => st.done);
    if (done.length) return { date: s.endedAt || s.startedAt, sets: done, target: e.target };
  }
  return null;
}

/** Niveau actuel dans une échelle de progression. */
export function familyLevel(fam, sessions = []) {
  const ladder = FAMILIES[fam];
  if (!ladder) return null;
  for (let i = sessions.length - 1; i >= 0; i--) {
    for (const e of sessions[i].exercises) {
      const ex = EX[e.exId];
      if (ex?.fam !== fam) continue;
      const done = e.sets.filter((s) => s.done);
      if (!done.length) continue;
      const top = e.target?.reps?.[1];
      const maxed = top && done.length >= (e.target.sets || done.length) && done.every((s) => (num(s.reps) ?? 0) >= top);
      if (maxed) return (ladder.find((x) => x.lvl > ex.lvl) || ex).lvl;
      return ex.lvl;
    }
  }
  return FAMILY_START[fam] ?? ladder[0].lvl;
}

export const nextInFamily = (exId) => {
  const ex = EX[exId];
  return ex?.fam ? FAMILIES[ex.fam].find((x) => x.lvl > ex.lvl) || null : null;
};

/** Suggestion de charge (surcharge progressive) ou de variante plus dure. */
export function suggestLoad(exId, sessions, reps) {
  const last = lastPerformance(exId, sessions);
  if (!last) return null;
  const ex = EX[exId];
  const kgs = last.sets.map((s) => num(s.kg)).filter((n) => n !== null);
  const kg = kgs.length ? Math.max(...kgs) : null;
  const allTop = last.sets.every((s) => (num(s.reps) ?? 0) >= reps[1]);
  if (ex.k === 'bw' || ex.k === 'band') {
    if (!allTop) return { kg, up: false, last };
    const next = nextInFamily(exId);
    if (next) return { kg: null, up: false, last, hint: `Prochaine étape : ${next.n}` };
    if (ex.unit === 's') return { kg, up: false, last, hint: 'Allonge la durée de 10 s' };
    return { kg: kg ? round(kg + 2.5) : kg, up: !!kg, last, hint: kg ? null : 'Ajoute du lest (sac à dos)' };
  }
  let inc = ex.k === 'free' || ex.k === 'machine' ? 2.5 : 1.25;
  if (['shoulderI', 'biceps', 'triceps', 'rear'].includes(ex.g)) inc = 1;
  if (kg === null) return { kg: null, up: false, last };
  return { kg: allTop ? round(kg + inc) : kg, up: allTop, last };
}
const round = (n) => Math.round(n * 4) / 4;

function weightedPick(items, weightOf, rng) {
  const ws = items.map(weightOf);
  const total = ws.reduce((a, b) => a + b, 0);
  if (total <= 0) return null;
  let r = rng() * total;
  for (let i = 0; i < items.length; i++) {
    r -= ws[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

/** Ne garde, pour chaque échelle, que la variante la plus proche du niveau actuel. */
function collapseFamilies(pool, sessions) {
  const out = [];
  const byFam = new Map();
  for (const e of pool) {
    if (!e.fam) out.push(e);
    else (byFam.get(e.fam) || byFam.set(e.fam, []).get(e.fam)).push(e);
  }
  for (const [fam, list] of byFam) {
    const lvl = familyLevel(fam, sessions);
    list.sort((a, b) => Math.abs(a.lvl - lvl) - Math.abs(b.lvl - lvl) || a.lvl - b.lvl);
    out.push(list[0]);
  }
  return out;
}

/**
 * Candidats pour un créneau, avec la raison d'une éventuelle mise à l'écart (blocked)
 * ou une mention douce (note), triés par pertinence.
 */
export function slotCandidates(type, slotIndex, {
  place = 'gym', eqSet = null, taken = [], excluded = [], ctx, axialCount = 0, replacing = false, useAlt = false,
  sessions = [],
} = {}) {
  const slot = templateFor(place, type)[slotIndex];
  const cap = type === 'legs' ? 2 : 1;
  const groups = replacing || useAlt ? [...slot.groups, ...(slot.alt || [])] : slot.groups;
  return EXERCISES.filter((e) => groups.includes(e.g))
    .filter((e) => !taken.includes(e.id))
    .filter((e) => isAvailable(e, place, eqSet, replacing))
    .map((e) => {
      let blocked = null;
      let note = null;
      if (place === 'gym' && excluded.includes(e.id)) blocked = 'Absent de ton club';
      else if (e.axial && ctx?.axialYesterday?.length) blocked = 'Charge axiale hier';
      else if (e.axial && axialCount >= cap) blocked = 'Déjà un axial lourd';
      else if (slot.heavy && !e.main) {
        if (replacing || useAlt) note = 'Alternative plus légère';
        else blocked = 'Pas un mouvement de base';
      }
      if (!blocked && place === 'gym' && e.gym === false) note = 'Street workout';
      // variantes avancées : il faut d'abord maîtriser la base (ex. 3×10 tractions strictes)
      if (!blocked && e.req && familyLevel(e.req[0], sessions) < e.req[1]) {
        if (replacing) note = 'Demande d’abord la base';
        else blocked = 'Niveau à débloquer';
      }
      return { ex: e, blocked, note };
    })
    .sort((a, b) => (!!a.blocked - !!b.blocked) || (!!a.note - !!b.note));
}

/** Génère une séance complète pour le type demandé. */
export function generateSession(type, {
  sessions = [], excluded = [], now = new Date(), rng = Math.random, place = 'gym', equipment = null,
} = {}) {
  const ctx = fatigueContext(sessions, now);
  const day3 = ctx.dayIndex >= 3;
  const eqSet = allowedEq(place, equipment);
  const lastSame = [...sessions].reverse().find((s) => s.type === type);
  const recent = new Set(lastSame ? lastSame.exercises.map((e) => e.exId) : []);
  const tpl = templateFor(place, type);

  const picked = [];
  let axialCount = 0;
  tpl.forEach((slot, i) => {
    if (slot.optional && day3) return;
    const opts = { place, eqSet, taken: picked.map((p) => p.exId), excluded, ctx, axialCount, sessions };
    // familles déjà utilisées dans la séance : une seule variante par échelle
    const usedFams = new Set(picked.map((p) => EX[p.exId].fam).filter(Boolean));
    const usable = (list) => list.filter((c) => !c.blocked && !(c.ex.fam && usedFams.has(c.ex.fam))).map((c) => c.ex);
    let pool = usable(slotCandidates(type, i, opts));
    if (!pool.length) pool = usable(slotCandidates(type, i, { ...opts, useAlt: true })); // ex. maison sans barre
    if (!pool.length) {
      pool = slotCandidates(type, i, { ...opts, useAlt: true })
        .filter((c) => c.blocked !== 'Absent de ton club').map((c) => c.ex);
    }
    pool = collapseFamilies(pool, sessions);
    if (!pool.length) return;
    const ex = weightedPick(pool, (e) => {
      let w = e.pref || 1;
      if (recent.has(e.id)) w *= 0.35;
      if (day3 && (e.k === 'machine' || e.k === 'cable')) w *= 1.4;
      if (!slot.heavy && slot.groups.length > 1 && e.main) w *= 0.8;
      if (e.unit === 's' && slot.heavy) w *= 0.3;
      if (e.filler) w *= 0.15; // dépannage maison : seulement si rien de mieux
      return w;
    }, rng);
    if (ex.axial) axialCount++;
    picked.push(buildExercise(ex.id, i, slot, { day3, sessions }));
  });

  return {
    id: uid(),
    type,
    place,
    startedAt: new Date(now).toISOString(),
    ctx: { ...ctx, day3 },
    exercises: picked,
  };
}

export function buildExercise(exId, slotIndex, slot, { day3 = false, sessions = [] } = {}) {
  const ex = EX[exId];
  const reps = ex.unit === 's' ? ex.secs || [30, 45] : slot.reps;
  const sets = day3 && slot.sets >= 4 ? slot.sets - 1 : slot.sets;
  const sug = suggestLoad(exId, sessions, reps);
  return {
    uid: uid(),
    exId,
    slot: slotIndex,
    target: { sets, reps, rest: slot.rest, rir: slot.rir, heavy: !!slot.heavy },
    suggestion: sug ? { kg: sug.kg, up: sug.up, hint: sug.hint || null } : null,
    sets: Array.from({ length: sets }, () => ({
      kg: sug && sug.kg !== null && sug.kg !== undefined ? String(sug.kg).replace('.', ',') : '',
      reps: '',
      done: false,
    })),
  };
}

/** Prochain type conseillé dans la rotation. */
export function suggestedType(sessions = []) {
  const last = sessions[sessions.length - 1];
  if (!last) return 'push';
  return { push: 'pull', pull: 'legs', legs: 'push' }[last.type];
}

export function uid() {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
}
