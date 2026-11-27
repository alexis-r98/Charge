import assert from 'node:assert/strict';
import { generateSession, fatigueContext, suggestLoad, isAxial } from '../js/generator.js';
import { EX } from '../js/data-exercises.js';

const D = (s) => new Date(s + 'T18:00:00');
const fin = (type, date, exIds, kg = '60', reps = '8') => ({
  id: type + date, type, startedAt: D(date).toISOString(), endedAt: D(date).toISOString(),
  exercises: exIds.map((exId) => ({ exId, target: { reps: [6, 8] }, sets: [{ kg, reps, done: true }] })),
});

// 1. séance fraîche : 6 exercices, au plus 1 axial en push/pull, 2 en legs
for (let i = 0; i < 300; i++) {
  for (const t of ['push', 'pull', 'legs']) {
    const s = generateSession(t, { now: D('2026-11-23') });
    assert.equal(s.exercises.length, 6, t);
    assert.equal(new Set(s.exercises.map((e) => e.exId)).size, 6, 'pas de doublon');
    const ax = s.exercises.filter((e) => isAxial(e.exId)).length;
    assert.ok(ax <= (t === 'legs' ? 2 : 1), `${t} axial ${ax}`);
    assert.ok(EX[s.exercises[0].exId].main, 'créneau lourd = mouvement de base');
  }
}

// 2. règle d'or : Pull avec rowing barre la veille → Legs sans squat libre / RDL / Smith squat
const hist = [fin('push', '2026-11-23', ['bench-bb']), fin('pull', '2026-11-24', ['row-bb', 'pullup'])];
const ctx = fatigueContext(hist, D('2026-11-25'));
assert.equal(ctx.dayIndex, 3);
assert.deepEqual(ctx.axialYesterday, ['row-bb']);
for (let i = 0; i < 300; i++) {
  const s = generateSession('legs', { sessions: hist, now: D('2026-11-25') });
  assert.ok(s.exercises.every((e) => !isAxial(e.exId)), 'aucun axial le lendemain');
  assert.equal(s.exercises.length, 5, 'jour 3 : créneau optionnel retiré');
  assert.ok(s.exercises.every((e) => e.target.sets <= 3), 'jour 3 : séries plafonnées à 3');
}

// 3. après un jour de repos, l'axial redevient possible
let sawSquat = false;
for (let i = 0; i < 300; i++) {
  const s = generateSession('legs', { sessions: hist, now: D('2026-11-26') });
  if (s.exercises.some((e) => e.exId === 'squat')) sawSquat = true;
}
assert.ok(sawSquat);

// 4. club sans hack squat ni leg extension → jamais proposés
for (let i = 0; i < 200; i++) {
  const s = generateSession('legs', { excluded: ['hack', 'mx-leg-ext'], now: D('2026-11-23') });
  assert.ok(!s.exercises.some((e) => ['hack', 'mx-leg-ext'].includes(e.exId)));
}

// 5. surcharge progressive
const h2 = [fin('push', '2026-11-20', ['bench-bb'], '60', '8')];
assert.equal(suggestLoad('bench-bb', h2, [6, 8]).kg, 62.5);
const h3 = [fin('push', '2026-11-20', ['bench-bb'], '60', '7')];
assert.equal(suggestLoad('bench-bb', h3, [6, 8]).kg, 60);
console.log('generator: OK');

/* ─── Street workout & maison ─── */
import { FAMILIES, PLACE_EQ } from '../js/data-exercises.js';
import { familyLevel, isAvailable, allowedEq } from '../js/generator.js';

for (const place of ['street', 'home']) {
  for (const bands of [false, true]) {
    const equipment = { [place]: [...PLACE_EQ[place], ...(bands ? ['band'] : [])] };
    const eq = allowedEq(place, equipment);
    for (let i = 0; i < 200; i++) {
      for (const t of ['push', 'pull', 'legs']) {
        const s = generateSession(t, { place, equipment, now: D('2026-11-23') });
        assert.ok(s.exercises.length >= 5, `${place} ${t} : ${s.exercises.length} exos`);
        assert.equal(new Set(s.exercises.map((e) => e.exId)).size, s.exercises.length, 'pas de doublon');
        for (const e of s.exercises) {
          const ex = EX[e.exId];
          assert.ok(ex.eq.every((x) => eq.has(x)), `${place}: ${ex.id} demande ${ex.eq}`);
          assert.ok(!ex.eq.includes('gym'), `${ex.id} est un exo salle`);
          if (!bands) assert.ok(!ex.eq.includes('band'), 'pas d’élastique sans élastique');
        }
        const fams = s.exercises.map((e) => EX[e.exId].fam).filter(Boolean);
        assert.equal(new Set(fams).size, fams.length, 'une variante par échelle');
      }
    }
  }
}

// la salle ne pioche jamais d'exercice street/maison
for (let i = 0; i < 200; i++) {
  for (const t of ['push', 'pull', 'legs']) {
    const s = generateSession(t, { place: 'gym', now: D('2026-11-23') });
    assert.ok(s.exercises.every((e) => EX[e.exId].gym !== false));
  }
}
// … mais les propose en remplacement si faisables en salle (tractions négatives oui, table non)
assert.ok(isAvailable(EX['pullup-neg'], 'gym', null, true));
assert.ok(!isAvailable(EX['table-row'], 'gym', null, true));

// échelle de progression : pompes classiques maxées → pompes pieds surélevés
const maxed = [{
  id: 'p', type: 'push', startedAt: D('2026-11-20').toISOString(), endedAt: D('2026-11-20').toISOString(),
  exercises: [{ exId: 'pu-standard', target: { sets: 3, reps: [6, 12] }, sets: [1, 2, 3].map(() => ({ kg: '', reps: '12', done: true })) }],
}];
assert.equal(familyLevel('pushup', []), 2);
assert.equal(familyLevel('pushup', maxed), 3);
assert.match(suggestLoad('pu-standard', maxed, [6, 12]).hint, /Pompes pieds surélevés/);
let sawDecline = false, sawStandard = false;
for (let i = 0; i < 300; i++) {
  const s = generateSession('push', { place: 'street', sessions: maxed, now: D('2026-11-23') });
  if (s.exercises.some((e) => e.exId === 'pu-decline')) sawDecline = true;
  if (s.exercises.some((e) => e.exId === 'pu-standard')) sawStandard = true;
}
assert.ok(sawDecline && !sawStandard, 'la variante suit le niveau');
assert.ok(Object.values(FAMILIES).every((f) => f.length >= 2));
console.log('street/maison: OK');

// variantes avancées verrouillées tant que les tractions ne sont pas maîtrisées
for (let i = 0; i < 300; i++) {
  const s = generateSession('pull', { place: 'street', now: D('2026-11-23') });
  assert.ok(!s.exercises.some((e) => ['chinup', 'pullup-wide', 'pullup-commando', 'chinup-close'].includes(e.exId)), 'verrou tractions');
}
const pullMaxed = [{
  id: 'q', type: 'pull', startedAt: D('2026-11-20').toISOString(), endedAt: D('2026-11-20').toISOString(),
  exercises: [{ exId: 'pullup', target: { sets: 4, reps: [4, 10] }, sets: [1, 2, 3, 4].map(() => ({ kg: '', reps: '8', done: true })) }],
}];
let unlocked = false;
for (let i = 0; i < 300 && !unlocked; i++) {
  const s = generateSession('pull', { place: 'street', sessions: pullMaxed, now: D('2026-11-23') });
  unlocked = s.exercises.some((e) => ['chinup', 'pullup-wide', 'pullup-commando', 'chinup-close'].includes(e.exId));
}
assert.ok(unlocked, 'déverrouillé au niveau tractions');
console.log('verrous de niveau: OK');
