/*
 * Aliments excluables. Une recette est écartée dès qu'un de ses ingrédients
 * correspond (recherche sans accents dans le nom de l'ingrédient).
 * Les aliments perso saisis par l'utilisateur sont cherchés tels quels.
 */
export const FOODS = [
  { id: 'avocat', label: 'Avocat', re: /avocat/ },
  { id: 'poisson', label: 'Poisson', re: /saumon|truite|thon|cabillaud|poisson|sardine|maquereau/ },
  { id: 'fruits-mer', label: 'Fruits de mer', re: /crevette|moule|calamar|fruits de mer/ },
  { id: 'oeuf', label: 'Œufs', re: /\bœufs?\b|\boeufs?\b/ },
  { id: 'arachide', label: 'Cacahuète', re: /cacahuete|arachide/ },
  { id: 'fruits-coque', label: 'Fruits à coque', re: /amande|\bnoix\b(?! de coco)|noisette|pignon|cajou|pistache|pecan/ },
  { id: 'laitier', label: 'Produits laitiers', re: /\blait\b(?! de coco| d'amande| d’amande| d'avoine| d’avoine)|fromage|skyr|yaourt|creme liquide|creme fraiche|\bbeurre\b(?! de cacahuete| d'amande| d’amande)|parmesan|mozzarella|emmental|cheddar|feta|cottage|whey/ },
  { id: 'gluten', label: 'Gluten', re: /pates|\bpain\b|tortilla|galette de ble|gnocchi|bagel|semoule|nouilles|granola|avoine|flocons|pain de mie/ },
  { id: 'porc', label: 'Porc', re: /jambon|lardon|\bporc\b|chorizo|bacon/ },
  { id: 'boeuf', label: 'Bœuf', re: /bœuf|boeuf|steak/ },
  { id: 'volaille', label: 'Volaille', re: /poulet|dinde/ },
  { id: 'whey', label: 'Protéine en poudre', re: /whey|proteine de pois|proteine en poudre/ },
  { id: 'banane', label: 'Banane', re: /banane/ },
  { id: 'coco', label: 'Coco', re: /coco/ },
  { id: 'epice', label: 'Épicé', re: /chili|cajun|harissa|curry|piment/ },
];

const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/œ/g, 'oe');
const normKeepOe = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Aliments exclus présents dans la recette (libellés), ou [] si elle passe. */
export function blockedBy(recipe, excluded = [], custom = []) {
  if (!excluded.length && !custom.length) return [];
  const names = recipe.ingredients.map((i) => i[1]);
  const hits = [];
  for (const f of FOODS) {
    if (!excluded.includes(f.id)) continue;
    if (names.some((n) => f.re.test(normKeepOe(n)) || f.re.test(norm(n)))) hits.push(f.label);
  }
  for (const c of custom) {
    const needle = norm(c).trim();
    if (needle && names.some((n) => norm(n).includes(needle))) hits.push(c);
  }
  return hits;
}
