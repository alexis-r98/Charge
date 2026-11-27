/*
 * Base de recettes prise de masse (profil ectomorphe).
 * slot : 'gainer' | 'breakfast' | 'main' (déjeuner ou dîner) | 'snack'
 * Macros en grammes, kcal annoncées (≈ 4P + 4G + 9L).
 */

export const SLOT_LABEL = {
  gainer: 'Gainer',
  breakfast: 'Petit-déj',
  main: 'Repas',
  snack: 'Collation',
};

import { EXTRA_RECIPES } from './data-recipes-extra.js';

export const RECIPES = [
  /* ───────── Gainers maison ───────── */
  {
    id: 'g-choco-cacahuete',
    name: 'Le Classique Choco-Cacahuète',
    note: "L'indétrônable",
    slot: 'gainer', prep: 3,
    kcal: 920, p: 52, c: 98, f: 34,
    ingredients: [
      ['350 ml', 'lait entier'],
      ['80 g', "flocons d'avoine (mixés en poudre avant)"],
      ['120 g', '1 grosse banane'],
      ['35 g', 'whey chocolat'],
      ['30 g', 'beurre de cacahuète 100 %'],
      ['10 g', 'cacao pur non sucré'],
      ['2', 'glaçons'],
    ],
    steps: [
      "Mixer l'avoine à sec en farine fine.",
      'Ajouter le reste et les 2 glaçons, mixer 45 secondes.',
    ],
  },
  {
    id: 'g-avoine-amande-miel',
    name: 'Avoine-Amande & Miel',
    note: 'Digestion facile',
    slot: 'gainer', prep: 3,
    kcal: 850, p: 48, c: 105, f: 25,
    ingredients: [
      ['350 ml', "lait d'amande ou demi-écrémé"],
      ['80 g', 'crème de riz (ou avoine instantanée)'],
      ['35 g', 'whey vanille'],
      ['25 g', "purée d'amandes blanches"],
      ['20 g', 'miel liquide'],
      ['150 g', 'fromage blanc 3 %'],
    ],
    steps: [
      'Tout mélanger au blender.',
      "La crème de riz évite l'effet pâteux au fond du shaker.",
    ],
  },
  {
    id: 'g-tropical-coco-mangue',
    name: 'Tropical Coco-Mangue',
    note: 'Frais & sans lactose',
    slot: 'gainer', prep: 4,
    kcal: 880, p: 45, c: 110, f: 28,
    tags: ['Sans lactose'],
    ingredients: [
      ['250 ml', 'eau de coco'],
      ['150 ml', 'lait de coco (conserve)'],
      ['150 g', 'mangue surgelée'],
      ['1', 'banane'],
      ['40 g', 'whey isolate vanille'],
      ['60 g', "flocons d'avoine"],
    ],
    steps: [
      'Mixer la mangue surgelée avec les liquides.',
      "Incorporer l'avoine et la whey, mixer à nouveau.",
    ],
  },
  {
    id: 'g-snickers',
    name: 'Le « Snickers » liquide',
    note: 'Post-training massif',
    slot: 'gainer', prep: 7,
    kcal: 1050, p: 56, c: 115, f: 38,
    tags: ['Post-training'],
    ingredients: [
      ['400 ml', 'lait entier'],
      ['100 g', "flocons d'avoine"],
      ['35 g', 'whey caramel ou chocolat'],
      ['30 g', 'beurre de cacahuète'],
      ['3', 'dattes Medjool dénoyautées'],
      ['1 pincée', 'fleur de sel'],
    ],
    steps: [
      'Blender peu puissant : faire tremper les dattes 5 min dans le lait tiède.',
      'Mixer tous les ingrédients ensemble.',
    ],
  },
  {
    id: 'g-berry-cheesecake',
    name: 'Berry-Cheesecake',
    note: 'Ultra-dense en protéines',
    slot: 'gainer', prep: 3,
    kcal: 790, p: 58, c: 85, f: 22,
    ingredients: [
      ['250 g', 'fromage blanc entier (ou skyr + 1 c. à s. huile de lin)'],
      ['200 ml', 'lait entier'],
      ['150 g', 'fruits rouges surgelés'],
      ['70 g', "flocons d'avoine"],
      ['30 g', 'whey vanille'],
      ['15 g', 'miel'],
    ],
    steps: ['Mixer le tout jusqu’à une texture milkshake épaisse.'],
  },
  {
    id: 'g-avocat-mct',
    name: 'Mass-Avocat & huile MCT',
    note: 'Spécial gros métabolisme',
    slot: 'gainer', prep: 4,
    kcal: 980, p: 46, c: 88, f: 48,
    ingredients: [
      ['350 ml', 'lait entier'],
      ['70 g', '½ avocat bien mûr'],
      ['1', 'banane'],
      ['70 g', 'avoine en poudre'],
      ['35 g', 'whey chocolat'],
      ['15 ml', 'huile MCT (ou colza / noix neutre)'],
    ],
    steps: [
      'Mixer longuement.',
      "L'avocat donne une onctuosité de mousse au chocolat, sans goût.",
    ],
  },

  /* ───────── Petits-déjeuners ───────── */
  {
    id: 'm-pancakes-avoine-banane',
    name: 'Pancakes anaboliques avoine-banane',
    slot: 'breakfast', prep: 15,
    kcal: 890, p: 50, c: 102, f: 29,
    ingredients: [
      ['3', 'œufs entiers'],
      ['90 g', "flocons d'avoine"],
      ['1', 'banane écrasée'],
      ['30 g', 'whey'],
      ['100 ml', 'lait'],
      ['20 g', 'beurre de cacahuète (topping)'],
      ['15 g', "sirop d'érable"],
    ],
    steps: [
      'Mixer œufs, avoine, banane, whey et lait.',
      'Cuire à la poêle huilée en 3–4 pancakes épais.',
      'Napper de beurre de cacahuète et de sirop.',
    ],
  },
  {
    id: 'm-brouillade-saumon',
    name: 'Brouillade avocat, saumon & pain complet',
    slot: 'breakfast', prep: 10,
    kcal: 860, p: 48, c: 68, f: 42,
    tags: ['Salé'],
    ingredients: [
      ['4', 'œufs entiers'],
      ['100 g', 'pain complet au levain (2 grandes tranches)'],
      ['75 g', '½ avocat'],
      ['60 g', 'saumon ou truite fumé(e)'],
      ['10 g', "beurre ou huile d'olive"],
    ],
    steps: [
      'Brouiller les œufs doucement au beurre.',
      'Toaster le pain, le garnir d’avocat écrasé.',
      'Servir avec les œufs et le saumon.',
    ],
  },
  {
    id: 'm-bagel-oeuf-cheddar',
    name: 'Bagel œuf, cheddar & jambon + jus',
    slot: 'breakfast', prep: 8,
    kcal: 790, p: 46, c: 70, f: 36,
    tags: ['Salé', 'À emporter'],
    ingredients: [
      ['1 (100 g)', 'bagel complet'],
      ['3', 'œufs entiers'],
      ['30 g', 'cheddar en tranche'],
      ['50 g', 'jambon blanc'],
      ['10 g', 'beurre'],
      ['200 ml', "jus d'orange"],
    ],
    steps: [
      'Toaster le bagel, beurrer les deux faces.',
      'Cuire les œufs en omelette pliée à la taille du bagel.',
      'Monter : omelette, cheddar (il fond au contact), jambon.',
    ],
  },

  /* ───────── Déjeuners / dîners ───────── */
  {
    id: 'm-bowl-boeuf-patate-douce',
    name: "Bowl bœuf, patate douce & huile d'olive",
    slot: 'main', prep: 25,
    kcal: 940, p: 54, c: 96, f: 36,
    ingredients: [
      ['200 g', 'steak haché 15 % MG'],
      ['300 g', 'patate douce (pesée crue)'],
      ['150 g', 'haricots verts ou brocolis'],
      ['15 ml', "huile d'olive vierge extra"],
      ['', 'épices cajun'],
    ],
    steps: [
      'Rôtir la patate douce en cubes au four / Airfryer, 20 min à 200 °C.',
      'Cuire les légumes verts à la vapeur.',
      'Saisir le bœuf à la poêle avec les épices.',
      "Arroser le tout d'huile d'olive crue à la fin.",
    ],
  },
  {
    id: 'm-pates-poulet-pesto',
    name: 'Pâtes crémeuses poulet, pesto & parmesan',
    slot: 'main', prep: 15,
    kcal: 1020, p: 62, c: 112, f: 34,
    ingredients: [
      ['140 g', 'pâtes complètes (pesées crues)'],
      ['200 g', 'blanc de poulet'],
      ['30 g', 'pesto vert (basilic / pignons)'],
      ['25 g', 'parmesan râpé'],
      ['50 ml', 'crème liquide 15 %'],
    ],
    steps: [
      'Cuire les pâtes.',
      'Dorer le poulet en dés.',
      'Hors du feu : déglacer avec la crème et le pesto.',
      'Mélanger aux pâtes, saupoudrer de parmesan.',
    ],
  },
  {
    id: 'm-saumon-riz-avocat',
    name: 'Saumon, riz basmati & avocat-sésame',
    slot: 'main', prep: 15,
    kcal: 960, p: 50, c: 98, f: 39,
    ingredients: [
      ['200 g', 'pavé de saumon frais'],
      ['130 g', 'riz basmati (pesé cru)'],
      ['75 g', '½ avocat'],
      ['10 ml', 'huile de sésame'],
      ['', 'sauce soja salée, graines de sésame'],
    ],
    steps: [
      'Cuire le riz.',
      'Poêler le saumon 4 min par face.',
      "Dresser en poké bowl chaud : avocat en lamelles, huile de sésame, soja, graines.",
    ],
  },
  {
    id: 'm-chili-express',
    name: 'Chili con carne express',
    note: 'Version sin carne possible',
    slot: 'main', prep: 20,
    kcal: 910, p: 56, c: 104, f: 28,
    tags: ['Batch cooking'],
    ingredients: [
      ['180 g', 'bœuf haché 5 % ou 15 %'],
      ['100 g', 'haricots rouges égouttés'],
      ['100 g', 'riz blanc (pesé cru)'],
      ['150 g', 'pulpe de tomate'],
      ['30 g', 'fromage râpé (emmental / cheddar)'],
      ['10 ml', "huile d'olive"],
      ['', 'épices chili'],
    ],
    steps: [
      'Cuire le riz.',
      "Faire revenir le bœuf dans l'huile.",
      'Ajouter tomate, haricots et épices, mijoter 5 min.',
      'Servir sur le riz chaud avec le fromage fondant.',
    ],
  },
  {
    id: 'm-curry-poulet-coco',
    name: 'Curry poulet coco, petits pois & riz',
    slot: 'main', prep: 20,
    kcal: 980, p: 62, c: 107, f: 33,
    tags: ['Batch cooking'],
    ingredients: [
      ['200 g', 'blanc de poulet'],
      ['120 g', 'riz basmati (pesé cru)'],
      ['100 ml', 'lait de coco'],
      ['100 g', 'petits pois surgelés'],
      ['15 g', 'pâte de curry'],
      ['10 ml', 'huile neutre'],
    ],
    steps: [
      'Cuire le riz.',
      "Dorer le poulet en dés dans l'huile avec la pâte de curry.",
      'Ajouter lait de coco et petits pois, mijoter 8 min.',
    ],
  },
  {
    id: 'm-gnocchi-dinde',
    name: 'Gnocchi gratinés, dinde & mozzarella',
    slot: 'main', prep: 20,
    kcal: 920, p: 60, c: 109, f: 27,
    ingredients: [
      ['300 g', 'gnocchi frais'],
      ['150 g', 'escalope de dinde'],
      ['150 g', 'sauce tomate basilic'],
      ['60 g', 'mozzarella'],
      ['10 ml', "huile d'olive"],
    ],
    steps: [
      'Poêler les gnocchi dans l’huile jusqu’à ce qu’ils dorent.',
      'Ajouter la dinde en lanières, puis la sauce tomate.',
      'Couvrir de mozzarella, gratiner 5 min sous le grill.',
    ],
  },

  /* ───────── Collations ───────── */
  {
    id: 'm-wrap-poulet-houmous',
    name: 'Wrap poulet, houmous & emmental',
    slot: 'snack', prep: 5,
    kcal: 740, p: 46, c: 64, f: 32,
    tags: ['À emporter'],
    ingredients: [
      ['1', 'grande tortilla de blé (XL)'],
      ['150 g', 'aiguillettes de poulet cuites'],
      ['60 g', 'houmous'],
      ['30 g', 'emmental'],
      ['1 poignée', 'épinards frais'],
    ],
    steps: [
      'Tartiner le wrap de houmous.',
      'Garnir de poulet, fromage et épinards.',
      'Rouler serré.',
    ],
  },
  {
    id: 'm-overnight-fromage-blanc',
    name: 'Porridge overnight fromage blanc',
    note: 'Pré-dodo, digestion lente',
    slot: 'snack', prep: 3,
    kcal: 680, p: 48, c: 74, f: 20,
    tags: ['Pré-dodo', 'À préparer la veille'],
    ingredients: [
      ['250 g', 'fromage blanc 3 %'],
      ['70 g', "flocons d'avoine"],
      ['15 g', "beurre d'amande"],
      ['20 g', 'pépites de chocolat noir 70 %'],
      ['10 g', 'miel'],
    ],
    steps: [
      'Mélanger le tout dans un bol le matin.',
      "Laisser au frigo jusqu'au soir : l'avoine gonfle et ramollit.",
    ],
  },
  {
    id: 'm-riz-au-lait-proteine',
    name: 'Riz au lait protéiné cannelle',
    slot: 'snack', prep: 25,
    kcal: 720, p: 44, c: 82, f: 24,
    tags: ['Batch cooking'],
    ingredients: [
      ['60 g', 'riz rond (cru)'],
      ['400 ml', 'lait entier'],
      ['30 g', 'whey vanille'],
      ['20 g', "sirop d'érable"],
      ['15 g', 'amandes effilées'],
      ['', 'cannelle'],
    ],
    steps: [
      'Cuire le riz dans le lait à feu doux 20 min en remuant.',
      'Hors du feu, laisser tiédir 5 min puis incorporer la whey.',
      "Servir avec sirop d'érable, cannelle et amandes.",
    ],
  },
];

// Recettes supplémentaires (macros calculées par tools/build-recipes.mjs)
RECIPES.push(...EXTRA_RECIPES);
