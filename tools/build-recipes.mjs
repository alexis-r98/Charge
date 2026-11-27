/*
 * Génère js/data-recipes-extra.js : recettes supplémentaires dont les macros sont
 * CALCULÉES à partir d'une table nutritionnelle (valeurs moyennes pour 100 g / 100 ml,
 * ordre de grandeur CIQUAL / étiquettes courantes).
 *
 *   node charge/tools/build-recipes.mjs
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// [kcal, protéines, glucides, lipides] pour 100 g (ou 100 ml)
const N = {
  avoine: [370, 13, 59, 7], laitEntier: [64, 3.3, 4.8, 3.6], laitDemi: [46, 3.3, 4.8, 1.6], laitAvoine: [45, 0.6, 7, 1.5],
  banane: [90, 1.1, 20, 0.3], whey: [380, 78, 8, 6], protPois: [380, 80, 3, 7], pb: [600, 25, 14, 50],
  fromageBlanc3: [75, 7.5, 4, 3], skyr: [62, 10.5, 4, 0.2], yaourtGrec: [120, 4, 4, 10], cottage: [100, 11, 3.5, 4.5],
  oeuf: [140, 12.5, 0.7, 9.8], painComplet: [240, 9, 42, 3], painMie: [255, 9, 45, 4], bagel: [250, 10, 48, 2],
  rizCru: [355, 8, 78, 0.8], pates: [355, 12.5, 70, 1.8], patesCompletes: [350, 13, 64, 2.5], nouilles: [360, 12, 72, 2],
  semoule: [360, 12, 72, 1.5], pdt: [77, 2, 17, 0.1], lentillesCorail: [340, 24, 50, 1.5],
  poulet: [110, 23, 0, 1.5], dinde: [105, 23, 0, 1.5], dindeTranches: [105, 21, 1, 1.5], boeuf5: [125, 21, 0, 5], boeuf15: [210, 18, 0, 15],
  thon: [110, 25, 0, 1], jambon: [115, 20, 1, 3.5], tofu: [145, 15, 2, 8.5],
  huile: [900, 0, 0, 100], beurre: [740, 0.7, 0.6, 82], miel: [320, 0.4, 80, 0], erable: [260, 0, 67, 0], confiture: [250, 0.4, 62, 0],
  dattes: [280, 2, 75, 0.2], cacao: [350, 20, 15, 21], chocoNoir: [570, 8, 33, 43], noix: [650, 15, 7, 65], amandes: [600, 21, 9, 50],
  beurreAmande: [620, 21, 8, 55], cacahuetes: [600, 26, 12, 49], granola: [450, 9, 62, 17],
  emmental: [400, 28, 0, 31], cheddar: [400, 25, 1, 33], mozzarella: [250, 18, 1, 19], parmesan: [400, 33, 0, 29], feta: [260, 17, 1, 21],
  fromageFrais: [250, 6, 4, 24], creme15: [160, 2.5, 4, 15], mayo: [680, 1, 1, 75], laitCoco: [180, 2, 3, 18],
  haricotsRouges: [115, 8, 15, 0.5], poisChiches: [140, 8, 18, 2.6], mais: [90, 3, 16, 1.5], petitsPois: [80, 5, 10, 0.5],
  legumes: [30, 2.5, 4, 0.4], epinards: [25, 3, 1.5, 0.4], pulpeTomate: [25, 1.2, 4, 0.2], sauceTomate: [50, 1.5, 8, 1.5],
  fruitsRouges: [45, 1, 8, 0.5], pomme: [52, 0.3, 12, 0.2], jusOrange: [45, 0.7, 10, 0.2], espresso: [2, 0.1, 0, 0],
  soja: [50, 6, 5, 0],
};

// i(clé, grammes, quantité affichée, nom affiché)
const i = (k, g, q, n) => ({ k, g, q, n });
const R = [
  /* ── Gainers ── */
  { id: 'g-moka', name: 'Moka protéiné', note: 'Le shake du matin pressé', slot: 'gainer', prep: 3, tags: ['Café'],
    items: [i('laitEntier', 300, '300 ml', 'lait entier'), i('espresso', 40, '1', 'espresso froid'), i('avoine', 70, '70 g', "flocons d'avoine mixés"),
      i('whey', 35, '35 g', 'whey chocolat'), i('banane', 120, '1', 'banane'), i('beurreAmande', 20, '20 g', "purée d'amandes")],
    steps: ["Mixer l'avoine à sec.", 'Ajouter le reste avec 3 glaçons, mixer 40 s.'] },
  { id: 'g-pbj', name: 'PB & J', note: 'Beurre de cacahuète – confiture', slot: 'gainer', prep: 3,
    items: [i('laitEntier', 350, '350 ml', 'lait entier'), i('avoine', 70, '70 g', "flocons d'avoine"), i('pb', 30, '30 g', 'beurre de cacahuète'),
      i('confiture', 25, '25 g', 'confiture de fraise'), i('whey', 30, '30 g', 'whey vanille'), i('fruitsRouges', 100, '100 g', 'fruits rouges surgelés')],
    steps: ['Tout mixer 45 s jusqu’à texture lisse.'] },
  { id: 'g-banana-bread', name: 'Banana bread liquide', note: 'Cannelle & noix', slot: 'gainer', prep: 3,
    items: [i('laitEntier', 350, '350 ml', 'lait entier'), i('avoine', 80, '80 g', "flocons d'avoine"), i('banane', 120, '1', 'banane bien mûre'),
      i('whey', 30, '30 g', 'whey vanille'), i('noix', 20, '20 g', 'cerneaux de noix'), i('erable', 15, '15 g', "sirop d'érable")],
    steps: ['Mixer avec une bonne pincée de cannelle.', 'Les noix donnent le côté « gâteau » : mixer longtemps.'] },
  { id: 'g-vegan-choco', name: 'Choco-banane végétal', note: 'Sans lactose, protéine de pois', slot: 'gainer', prep: 3, tags: ['Sans lactose', 'Végétal'],
    items: [i('laitAvoine', 400, '400 ml', "lait d'avoine"), i('avoine', 80, '80 g', "flocons d'avoine"), i('banane', 120, '1', 'banane'),
      i('protPois', 35, '35 g', 'protéine de pois chocolat'), i('pb', 30, '30 g', 'beurre de cacahuète'), i('cacao', 10, '10 g', 'cacao pur')],
    steps: ['Tout mixer 45 s.', 'Ajouter de l’eau si trop épais.'] },
  { id: 'g-apple-pie', name: 'Apple pie', note: 'Pomme-cannelle, très frais', slot: 'gainer', prep: 4,
    items: [i('laitDemi', 300, '300 ml', 'lait demi-écrémé'), i('skyr', 150, '150 g', 'skyr'), i('avoine', 70, '70 g', "flocons d'avoine"),
      i('pomme', 150, '1', 'pomme (avec la peau)'), i('whey', 30, '30 g', 'whey vanille'), i('amandes', 20, '20 g', 'amandes'), i('miel', 15, '15 g', 'miel')],
    steps: ['Couper la pomme en dés.', 'Mixer le tout avec cannelle et 2 glaçons.'] },

  /* ── Petits-déjeuners ── */
  { id: 'm-overnight-pb', name: 'Overnight oats cacahuète-banane', slot: 'breakfast', prep: 5, tags: ['À préparer la veille'],
    items: [i('avoine', 90, '90 g', "flocons d'avoine"), i('laitEntier', 250, '250 ml', 'lait entier'), i('skyr', 150, '150 g', 'skyr'),
      i('pb', 30, '30 g', 'beurre de cacahuète'), i('banane', 120, '1', 'banane'), i('miel', 10, '10 g', 'miel')],
    steps: ['Mélanger avoine, lait et skyr dans un bocal.', 'Frigo toute la nuit.', 'Le matin : banane en rondelles, beurre de cacahuète, miel.'] },
  { id: 'm-pain-perdu', name: 'Pain perdu protéiné & skyr', slot: 'breakfast', prep: 12,
    items: [i('painMie', 120, '4 tranches', 'pain de mie complet'), i('oeuf', 110, '2', 'œufs'), i('laitEntier', 100, '100 ml', 'lait entier'),
      i('beurre', 10, '10 g', 'beurre'), i('skyr', 150, '150 g', 'skyr'), i('fruitsRouges', 100, '100 g', 'fruits rouges'), i('erable', 20, '20 g', "sirop d'érable")],
    steps: ['Battre œufs et lait avec cannelle.', 'Tremper le pain, dorer au beurre 2 min par face.', 'Servir avec skyr, fruits rouges et sirop.'] },
  { id: 'm-omelette-pdt-feta', name: 'Omelette pommes de terre, feta & épinards', slot: 'breakfast', prep: 15, tags: ['Salé'],
    items: [i('oeuf', 220, '4', 'œufs'), i('pdt', 250, '250 g', 'pommes de terre (pesées crues)'), i('feta', 40, '40 g', 'feta'),
      i('epinards', 60, '1 poignée', 'épinards frais'), i('huile', 10, '10 ml', "huile d'olive"), i('painComplet', 50, '1 tranche', 'pain complet')],
    steps: ['Dorer les pommes de terre en fines rondelles 10 min à la poêle huilée.', 'Ajouter épinards puis œufs battus, couvrir 4 min.', 'Émietter la feta, servir avec le pain.'] },
  { id: 'm-bowl-skyr-granola', name: 'Bowl skyr, granola & noix', slot: 'breakfast', prep: 3, tags: ['Sans cuisson'],
    items: [i('skyr', 300, '300 g', 'skyr'), i('granola', 80, '80 g', 'granola'), i('banane', 120, '1', 'banane'),
      i('noix', 20, '20 g', 'noix'), i('miel', 15, '15 g', 'miel')],
    steps: ['Tout assembler dans un grand bol.'] },
  { id: 'm-porridge-choco', name: 'Porridge chaud choco-cacahuète', slot: 'breakfast', prep: 7,
    items: [i('avoine', 90, '90 g', "flocons d'avoine"), i('laitEntier', 300, '300 ml', 'lait entier'), i('banane', 120, '1', 'banane'),
      i('pb', 25, '25 g', 'beurre de cacahuète'), i('cacao', 10, '10 g', 'cacao pur'), i('whey', 25, '25 g', 'whey chocolat')],
    steps: ["Cuire l'avoine dans le lait 5 min en remuant.", 'Hors du feu : cacao et whey (sinon elle grumelle).', 'Banane et beurre de cacahuète par-dessus.'] },

  /* ── Déjeuners / dîners ── */
  { id: 'm-riz-cantonais', name: 'Riz cantonais poulet & œuf', slot: 'main', prep: 20, tags: ['Batch cooking'],
    items: [i('rizCru', 120, '120 g', 'riz (pesé cru)'), i('poulet', 150, '150 g', 'blanc de poulet'), i('oeuf', 110, '2', 'œufs'),
      i('petitsPois', 100, '100 g', 'petits pois'), i('jambon', 50, '50 g', 'jambon en dés'), i('huile', 15, '15 ml', 'huile neutre'), i('soja', 15, '1 c. à s.', 'sauce soja')],
    steps: ['Cuire le riz (idéalement la veille).', 'Sauter le poulet en dés, ajouter jambon et petits pois.', 'Pousser sur le côté, brouiller les œufs, mélanger avec le riz et le soja.'] },
  { id: 'm-bolognaise', name: 'Pâtes bolognaise express', slot: 'main', prep: 20, tags: ['Batch cooking'],
    items: [i('pates', 140, '140 g', 'pâtes (pesées crues)'), i('boeuf15', 180, '180 g', 'bœuf haché 15 %'), i('sauceTomate', 150, '150 g', 'sauce tomate'),
      i('parmesan', 25, '25 g', 'parmesan'), i('huile', 10, '10 ml', "huile d'olive")],
    steps: ['Cuire les pâtes.', "Saisir le bœuf dans l'huile, ajouter la sauce, mijoter 10 min.", 'Servir avec le parmesan.'] },
  { id: 'm-dahl-tofu', name: 'Dahl lentilles corail, tofu & riz', slot: 'main', prep: 25, tags: ['Végétal', 'Batch cooking'],
    items: [i('lentillesCorail', 100, '100 g', 'lentilles corail (crues)'), i('rizCru', 80, '80 g', 'riz basmati (cru)'), i('tofu', 150, '150 g', 'tofu ferme'),
      i('laitCoco', 100, '100 ml', 'lait de coco'), i('pulpeTomate', 150, '150 g', 'pulpe de tomate'), i('huile', 10, '10 ml', 'huile'),
      i('legumes', 0, '', 'curry, cumin, gingembre')],
    steps: ['Faire revenir les épices dans l’huile, ajouter lentilles, tomate, lait de coco et 300 ml d’eau.', 'Mijoter 15 min.', 'Dorer le tofu en dés à part, servir sur le riz.'] },
  { id: 'm-burrito-bowl', name: 'Burrito bowl poulet', slot: 'main', prep: 20,
    items: [i('rizCru', 120, '120 g', 'riz (pesé cru)'), i('poulet', 180, '180 g', 'blanc de poulet'), i('haricotsRouges', 100, '100 g', 'haricots rouges égouttés'),
      i('mais', 80, '80 g', 'maïs'), i('cheddar', 40, '40 g', 'cheddar râpé'), i('huile', 10, '10 ml', 'huile'), i('legumes', 80, '80 g', 'salsa / poivron')],
    steps: ['Cuire le riz.', 'Poêler le poulet aux épices mexicaines.', 'Dresser : riz, poulet, haricots, maïs, salsa, cheddar.'] },
  { id: 'm-wok-boeuf', name: 'Wok bœuf, nouilles & cacahuètes', slot: 'main', prep: 15,
    items: [i('nouilles', 120, '120 g', 'nouilles de blé (crues)'), i('boeuf5', 180, '180 g', 'bœuf en lanières (5 %)'), i('legumes', 200, '200 g', 'légumes wok surgelés'),
      i('huile', 15, '15 ml', 'huile de sésame'), i('cacahuetes', 20, '20 g', 'cacahuètes'), i('soja', 20, '2 c. à s.', 'sauce soja')],
    steps: ['Cuire les nouilles.', 'Saisir le bœuf à feu vif 2 min, réserver.', 'Sauter les légumes, remettre bœuf et nouilles, soja, cacahuètes concassées.'] },
  { id: 'm-semoule-harissa', name: 'Semoule, poulet harissa & pois chiches', slot: 'main', prep: 15,
    items: [i('semoule', 120, '120 g', 'semoule (crue)'), i('poulet', 180, '180 g', 'blanc de poulet'), i('poisChiches', 120, '120 g', 'pois chiches égouttés'),
      i('legumes', 150, '150 g', 'courgette, poivron'), i('huile', 15, '15 ml', "huile d'olive"), i('legumes', 0, '1 c. à c.', 'harissa')],
    steps: ['Verser la même quantité d’eau bouillante sur la semoule, couvrir 5 min.', 'Poêler le poulet avec la harissa, puis les légumes et pois chiches.', 'Arroser d’huile d’olive.'] },
  { id: 'm-pates-thon', name: 'Pâtes thon, tomate & mozzarella', slot: 'main', prep: 15, tags: ['Petit budget'],
    items: [i('pates', 140, '140 g', 'pâtes (pesées crues)'), i('thon', 140, '1 boîte', 'thon au naturel égoutté'), i('sauceTomate', 150, '150 g', 'sauce tomate'),
      i('mozzarella', 60, '60 g', 'mozzarella'), i('huile', 10, '10 ml', "huile d'olive")],
    steps: ['Cuire les pâtes.', 'Chauffer sauce et thon, mélanger aux pâtes.', 'Mozzarella en morceaux par-dessus, filet d’huile.'] },
  { id: 'm-hachis', name: 'Hachis parmentier', slot: 'main', prep: 35, tags: ['Batch cooking'],
    items: [i('pdt', 300, '300 g', 'pommes de terre (crues)'), i('boeuf15', 180, '180 g', 'bœuf haché 15 %'), i('laitEntier', 100, '100 ml', 'lait entier'),
      i('beurre', 15, '15 g', 'beurre'), i('emmental', 30, '30 g', 'emmental râpé')],
    steps: ['Cuire les pommes de terre 20 min, écraser avec lait et beurre.', 'Saisir le bœuf assaisonné.', 'Bœuf dans un plat, purée dessus, emmental, gratiner 10 min.'] },

  /* ── Collations ── */
  { id: 'm-tartines-pb', name: 'Tartines cacahuète, banane & miel + lait', slot: 'snack', prep: 4,
    items: [i('painComplet', 120, '3 tranches', 'pain complet'), i('pb', 40, '40 g', 'beurre de cacahuète'), i('banane', 120, '1', 'banane'),
      i('miel', 10, '10 g', 'miel'), i('laitEntier', 250, '250 ml', 'lait entier')],
    steps: ['Toaster, tartiner, rondelles de banane, filet de miel.', 'Avec un grand verre de lait.'] },
  { id: 'm-bagel-thon', name: 'Bagel thon & fromage frais', slot: 'snack', prep: 5, tags: ['À emporter'],
    items: [i('bagel', 100, '1', 'bagel'), i('thon', 100, '100 g', 'thon égoutté'), i('fromageFrais', 40, '40 g', 'fromage frais'),
      i('legumes', 50, '', 'concombre, oignon rouge')],
    steps: ['Mélanger thon et fromage frais, poivrer.', 'Garnir le bagel toasté avec les crudités.'] },
  { id: 'm-energy-balls', name: 'Energy balls avoine-cacahuète', note: '4 boules', slot: 'snack', prep: 10, tags: ['À emporter', 'Sans cuisson'],
    items: [i('avoine', 80, '80 g', "flocons d'avoine"), i('pb', 40, '40 g', 'beurre de cacahuète'), i('miel', 30, '30 g', 'miel'),
      i('whey', 30, '30 g', 'whey vanille'), i('chocoNoir', 20, '20 g', 'pépites de chocolat noir')],
    steps: ['Tout mélanger à la main.', 'Former 4 boules, 20 min au frigo.', 'Se gardent 5 jours en boîte.'] },
  { id: 'm-club-dinde', name: 'Club sandwich dinde & œuf', slot: 'snack', prep: 8, tags: ['À emporter'],
    items: [i('painMie', 90, '3 tranches', 'pain de mie complet'), i('dindeTranches', 100, '100 g', 'blanc de dinde en tranches'), i('oeuf', 55, '1', 'œuf dur'),
      i('emmental', 20, '20 g', 'emmental'), i('mayo', 20, '20 g', 'mayonnaise'), i('legumes', 40, '', 'salade, tomate')],
    steps: ['Toaster le pain, tartiner de mayonnaise.', 'Étage 1 : dinde, salade. Étage 2 : œuf en rondelles, emmental, tomate.', 'Couper en triangles.'] },
  { id: 'm-bowl-dattes', name: 'Fromage blanc, dattes, noix & granola', slot: 'snack', prep: 3, tags: ['Sans cuisson'],
    items: [i('fromageBlanc3', 300, '300 g', 'fromage blanc 3 %'), i('dattes', 72, '3', 'dattes Medjool'), i('noix', 25, '25 g', 'noix'),
      i('granola', 30, '30 g', 'granola')],
    steps: ['Dattes en morceaux sur le fromage blanc, noix et granola par-dessus.'] },
];

const out = R.map((r) => {
  const t = [0, 0, 0, 0];
  for (const it of r.items) {
    const v = N[it.k];
    if (!v) throw new Error(`Ingrédient inconnu : ${it.k}`);
    v.forEach((x, j) => (t[j] += (x * it.g) / 100));
  }
  const { items, ...rest } = r;
  return {
    ...rest,
    kcal: Math.round(t[0] / 10) * 10,
    p: Math.round(t[1]), c: Math.round(t[2]), f: Math.round(t[3]),
    ingredients: items.map((it) => [it.q, it.n]),
  };
});

const file = fileURLToPath(new URL('../js/data-recipes-extra.js', import.meta.url));
writeFileSync(file, `/* Généré par tools/build-recipes.mjs — ne pas éditer à la main (macros calculées). */\nexport const EXTRA_RECIPES = ${JSON.stringify(out, null, 2)};\n`);
console.table(out.map((r) => ({ id: r.id, slot: r.slot, kcal: r.kcal, p: r.p, c: r.c, f: r.f })));
