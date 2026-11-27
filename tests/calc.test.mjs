import assert from 'node:assert/strict';
import { bmr, energyTarget, macroTargets, scaleQty, fitFactor, platesPerSide, warmupSets, e1rm } from '../js/calc.js';

// Mifflin-St Jeor : homme 25 ans, 180 cm, 65 kg → 10*65 + 6.25*180 - 125 + 5 = 1655
assert.equal(bmr({ sex: 'm', age: 25, height: 180, weight: 65 }), 1655);
const e = energyTarget({ sex: 'm', age: 25, height: 180, activity: 1.55, surplus: 450 }, 65);
assert.equal(e.tdee, 2565);
assert.equal(e.target, 3000); // 2565 + 450 = 3015 → arrondi 50
const m = macroTargets(3000, 65);
assert.deepEqual(m, { p: 130, c: 433, f: 83 });
assert.ok(Math.abs(m.p * 4 + m.c * 4 + m.f * 9 - 3000) < 10);

assert.equal(scaleQty('350 ml', 1.25), '440 ml');
assert.equal(scaleQty('1', 1.5), '1,5');
assert.equal(scaleQty('1 (100 g)', 1.5), '1,5 (150 g)');
assert.equal(scaleQty('½ avocat', 1.5), '0,75 avocat');
assert.equal(scaleQty('', 2), '');
assert.equal(fitFactor(2000, 1600), 1.25);
assert.equal(fitFactor(5000, 1600), 1.5);
assert.equal(fitFactor(900, 1600), 0.75);

assert.deepEqual(platesPerSide(72.5), { per: [20, 5, 1.25], rest: 0, ok: true });
assert.deepEqual(platesPerSide(100).per, [20, 20]);
assert.equal(platesPerSide(20).per.length, 0);
assert.equal(platesPerSide(71).ok, false);

const w = warmupSets(80, { barbell: true });
assert.deepEqual(w, [{ kg: 20, reps: 10 }, { kg: 32.5, reps: 8 }, { kg: 47.5, reps: 5 }, { kg: 65, reps: 3 }]);
assert.ok(warmupSets(25, { barbell: true }).length === 1);
assert.deepEqual(warmupSets(60), [{ kg: 30, reps: 10 }, { kg: 45, reps: 5 }]);
assert.equal(Math.round(e1rm(100, 5)), 117);
assert.equal(e1rm(0, 10), 0);
console.log('calc: OK');
import { fitPortions } from '../js/calc.js';
{
  const k = [890, 960, 850, 1050];
  const f = fitPortions(k, 3050);
  const tot = k.reduce((a, x, i) => a + x * f[i], 0);
  assert.ok(Math.abs(tot - 3050) <= 150, `total ${tot}`);
  assert.ok(f.every((x) => x >= 0.75 && x <= 1.5 && (x * 4) % 1 === 0));
  const up = fitPortions([800, 800], 5000);
  assert.deepEqual(up, [1.5, 1.5]);
  console.log('fitPortions: OK', f, Math.round(tot));
}
