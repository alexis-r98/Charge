import assert from 'node:assert/strict';
import { RECIPES } from '../js/data-recipes.js';
import { blockedBy, FOODS } from '../js/foods.js';

const ids = new Set(RECIPES.map((r) => r.id));
assert.equal(ids.size, RECIPES.length, 'ids uniques');
const by = (food) => RECIPES.filter((r) => blockedBy(r, [food]).length).map((r) => r.id);

// avocat : uniquement les 4 recettes qui en contiennent
assert.deepEqual(by('avocat').sort(), ['g-avocat-mct', 'm-brouillade-saumon', 'm-saumon-riz-avocat']);
for (const id of by('avocat')) assert.match(JSON.stringify(RECIPES.find((r) => r.id === id).ingredients), /avocat/);
assert.ok(by('avocat').length >= 3);
// œufs ≠ bœuf
assert.ok(!by('oeuf').includes('m-bowl-boeuf-patate-douce'));
assert.ok(by('oeuf').includes('m-pancakes-avoine-banane'));
assert.ok(by('boeuf').includes('m-bowl-boeuf-patate-douce'));
// crème de riz n'est pas un produit laitier, beurre de cacahuète non plus
assert.ok(!blockedBy({ ingredients: [['', 'crème de riz'], ['', 'beurre de cacahuète']] }, ['laitier']).length);
assert.ok(blockedBy({ ingredients: [['', 'beurre']] }, ['laitier']).length);
// lait de coco ≠ lait ; noix de coco ≠ noix
assert.ok(!blockedBy({ ingredients: [['', 'lait de coco']] }, ['laitier', 'fruits-coque']).length);
// aliment perso, insensible aux accents
assert.deepEqual(blockedBy({ ingredients: [['', 'Pépites de chocolat']] }, [], ['pepites']), ['pepites']);
// chaque créneau garde des recettes même avec avocat + poisson exclus
for (const slot of ['gainer', 'breakfast', 'main', 'snack']) {
  assert.ok(RECIPES.filter((r) => r.slot === slot && !blockedBy(r, ['avocat', 'poisson']).length).length >= 3, slot);
}
console.log('foods: OK —', RECIPES.length, 'recettes,', FOODS.length, 'aliments excluables, avocat dans', by('avocat').length);
