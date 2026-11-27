/*
 * Catalogue d'exercices PPL — salle Basic-Fit (Matrix) + street workout + maison.
 *
 * g     : groupe (sert aux pools des créneaux de séance)
 * k     : 'free' (poids libres) | 'machine' | 'cable' | 'bw' (poids du corps, lest optionnel)
 * main  : peut servir de mouvement principal
 * axial : très taxant pour le système nerveux / le bas du dos
 *         → jamais deux jours d'affilée (règle du PPL sur 3 jours consécutifs)
 * unit  : 's' si la « répétition » est une durée en secondes
 * uni   : unilatéral (reps par côté)
 * eq    : matériel requis — gym | bar (barre fixe) | dips (barres parallèles) | lowbar (barre basse / TRX)
 *         | bench (banc, marche, chaise) | floor (sol) | table | door (cadre de porte) | band (élastique)
 * gym   : false = exercice street/maison, absent des tirages en salle (mais proposé en remplacement)
 * street: false = doublon d'une variante street, absent des tirages street/maison
 * req   : [fam, lvl] niveau à atteindre avant d'être tiré au sort (ex. tractions maîtrisées)
 * filler: dépannage maison, tiré seulement s'il n'y a pas mieux
 * fam / lvl : échelle de progression poids du corps (lvl 1 = plus facile). L'app propose
 *         la variante de ton niveau et te fait monter quand tu atteins le haut de la fourchette.
 *
 * Progressions inspirées de la routine recommandée r/bodyweightfitness (échelles pompes,
 * dips, tractions, rowing, squat unilatéral, nordic), de GMB et de Decathlon / Nutripure.
 */

export const GROUP_LABEL = {
  chestC: 'Pectoraux · poly', chestI: 'Pectoraux · isolation',
  shoulderC: 'Épaules · presse', shoulderI: 'Épaules · latéraux / antérieurs', triceps: 'Triceps',
  backV: 'Dos · largeur', backH: 'Dos · épaisseur', rear: 'Arrière d’épaule & trapèzes',
  biceps: 'Biceps', grip: 'Grip & décompression',
  quadC: 'Quadriceps · poly', quadI: 'Quadriceps · isolation', hinge: 'Chaîne postérieure',
  hamI: 'Ischio-jambiers', glute: 'Fessiers', calves: 'Mollets', abs: 'Sangle abdominale',
};

export const PLACES = {
  gym: { label: 'Salle', hint: 'Basic-Fit / Matrix' },
  street: { label: 'Street', hint: 'Barre fixe, barres parallèles, barre basse, banc' },
  home: { label: 'Maison', hint: 'Sol, chaise, table, cadre de porte' },
};
export const PLACE_EQ = {
  street: ['bar', 'dips', 'lowbar', 'bench', 'floor'],
  home: ['floor', 'bench', 'table', 'door'],
};
export const EQ_LABEL = {
  bar: 'Barre fixe', dips: 'Barres parallèles', lowbar: 'Barre basse / TRX', bench: 'Banc / chaise',
  floor: 'Sol', table: 'Table solide', door: 'Cadre de porte', band: 'Élastique', gym: 'Salle',
};

const X = (id, n, e, g, k, extra = {}) => ({ id, n, e, g, k, ...extra });
/** Exercice poids du corps hors catalogue salle. */
const S = (id, n, e, g, eq, extra = {}) => ({ id, n, e, g, k: extra.k || 'bw', eq, gym: false, ...extra });

const GYM = [
  /* PUSH — pectoraux polyarticulaires */
  X('bench-bb', 'Développé couché barre', 'Banc plat + rack olympique', 'chestC', 'free', { main: true }),
  X('incline-db', 'Développé incliné haltères', 'Banc réglable + haltères', 'chestC', 'free', { main: true }),
  X('bench-db', 'Développé couché haltères', 'Banc plat + haltères', 'chestC', 'free', { main: true }),
  X('mx-chest', 'Matrix Converging Chest Press', 'Presse pectoraux assise convergente (G3-S13 / Aura)', 'chestC', 'machine', { main: true }),
  X('mx-incline', 'Matrix Incline Chest Press', 'Presse pectoraux inclinée guidée', 'chestC', 'machine', { main: true }),
  X('smith-bench', 'Développé couché / incliné Smith', 'Smith Machine Matrix (cadre guidé)', 'chestC', 'machine', { main: true }),
  X('dips-chest', 'Dips buste penché', 'Barres parallèles · cage ou chaise romaine', 'chestC', 'bw', { eq: ['dips'], main: true, fam: 'dips', lvl: 2 }),
  /* PUSH — pectoraux isolation */
  X('mx-fly', 'Matrix Pec Fly (butterfly)', 'Écartés assis à la machine', 'chestI', 'machine'),
  X('cable-cross', 'Écartés poulie vis-à-vis', 'Matrix Cable Crossover · hautes = bas des pecs, basses = haut', 'chestI', 'cable'),
  X('incline-fly', 'Écartés inclinés haltères', 'Banc réglable à 30°', 'chestI', 'free'),
  X('pushups', 'Pompes lestées / pieds surélevés', 'Sur banc ou box plyo', 'chestI', 'bw', { eq: ['bench'], street: false }),
  /* PUSH — épaules */
  X('ohp', 'Développé militaire barre debout', 'Rack libre (OHP)', 'shoulderC', 'free', { main: true, axial: true }),
  X('db-shoulder', 'Développé épaules assis haltères', 'Banc à 80° + haltères', 'shoulderC', 'free', { main: true }),
  X('mx-shoulder', 'Matrix Converging Shoulder Press', 'Presse épaules assise guidée (G3-S23)', 'shoulderC', 'machine', { main: true }),
  X('pike', 'Pike push-ups', 'Pompes en V, hanches hautes, tête vers le sol', 'shoulderC', 'bw', { eq: ['floor'], main: true, fam: 'pike', lvl: 1 }),
  X('lat-db', 'Élévations latérales haltères', 'Debout ou assis', 'shoulderI', 'free'),
  X('lat-cable', 'Élévations latérales poulie basse', 'Poulie simple Matrix · unilatéral', 'shoulderI', 'cable'),
  X('mx-lat', 'Matrix Lateral Raise', 'Machine guidée (grands clubs)', 'shoulderI', 'machine'),
  /* PUSH — triceps */
  X('tri-rope', 'Extension triceps poulie haute · corde', 'Station poulie Matrix', 'triceps', 'cable'),
  X('tri-bar', 'Extension triceps poulie haute · barre / V', 'Station poulie Matrix', 'triceps', 'cable'),
  X('skull', 'Barre au front (skullcrushers)', 'Banc plat + barre EZ', 'triceps', 'free'),
  X('tri-overhead', 'Extension nuque haltère', 'Unilatéral ou deux mains, sur banc', 'triceps', 'free'),
  X('dips-tri', 'Dips serrés buste droit', 'Barres parallèles / chaise romaine', 'triceps', 'bw', { eq: ['dips'] }),
  X('bench-dips', 'Dips entre deux bancs', 'Lestés avec un disque sur les cuisses (ou chaise à la maison)', 'triceps', 'bw', { eq: ['bench'] }),
  X('mx-dip', 'Matrix Triceps Press / Dip', 'Machine à dips assise guidée', 'triceps', 'machine'),

  /* PULL — largeur */
  X('pullup', 'Tractions pronation', 'Barre fixe · cage, chaise romaine ou parc', 'backV', 'bw', { eq: ['bar'], main: true, fam: 'pullup', lvl: 3 }),
  X('chinup', 'Tractions supination (chin-ups)', 'Focus grand dorsal + biceps', 'backV', 'bw', { eq: ['bar'], main: true, req: ['pullup', 3] }),
  X('neutral-pullup', 'Tractions prise neutre', 'Poignées parallèles de la cage', 'backV', 'bw', { eq: ['gym'], main: true }),
  X('mx-pulldown', 'Matrix Diverging Lat Pulldown', 'Tirage vertical prise large (G3-S33)', 'backV', 'machine', { main: true }),
  X('pulldown-close', 'Tirage vertical prise serrée', 'Triangle à la poulie haute Matrix', 'backV', 'cable', { main: true }),
  X('pullover-cable', 'Pull-over poulie haute', 'Barre droite ou corde, bras tendus', 'backV', 'cable'),
  X('mx-assist', 'Matrix Assisted Chin / Dip', 'Tractions assistées à contrepoids', 'backV', 'machine', { main: true }),
  /* PULL — épaisseur */
  X('row-bb', 'Rowing barre buste penché', 'Pendlay ou classique · barre olympique', 'backH', 'free', { main: true, axial: true }),
  X('row-db', 'Rowing haltère unilatéral', 'En appui sur banc', 'backH', 'free', { main: true }),
  X('mx-row', 'Matrix Diverging Seated Row', 'Tirage horizontal assis convergent (G3-S34)', 'backH', 'machine', { main: true }),
  X('cable-row', 'Tirage horizontal poulie basse', 'Triangle ou barre large · banc Matrix', 'backH', 'cable', { main: true }),
  X('tbar', 'Rowing T-Bar (landmine)', 'Barre calée dans un coin + poignée V', 'backH', 'free', { main: true, axial: true }),
  X('inverted', 'Tractions australiennes', 'Barre basse (Smith, parc) ou TRX · corps gainé, jambes tendues', 'backH', 'bw', { eq: ['lowbar'], main: true, fam: 'row', lvl: 2 }),
  /* PULL — arrière d'épaule & trapèzes */
  X('facepull', 'Face pull poulie haute', 'Corde · santé des épaules sur 3 jours', 'rear', 'cable', { pref: 3 }),
  X('mx-reverse-fly', 'Oiseau inversé Matrix Pec Fly', 'Machine réglée en arrière d’épaule', 'rear', 'machine'),
  X('db-reverse-fly', 'Oiseau buste penché haltères', 'Assis au bord d’un banc', 'rear', 'free'),
  X('shrugs', 'Shrugs haltères ou barre', 'Trapèzes supérieurs', 'rear', 'free'),
  /* PULL — biceps & grip */
  X('curl-ez', 'Curl barre EZ debout', 'Barre EZ libre', 'biceps', 'free'),
  X('curl-incline', 'Curl haltères incliné', 'Banc à 45° · étirement maximal', 'biceps', 'free'),
  X('hammer', 'Curl marteau', 'Haltères ou corde poulie basse', 'biceps', 'free'),
  X('mx-curl', 'Matrix Biceps Curl', 'Pupitre Larry Scott guidé', 'biceps', 'machine'),
  X('curl-cable', 'Curl poulie basse', 'Tension continue', 'biceps', 'cable'),
  X('hang', 'Suspensions passives / scapula pulls', 'Grip + décompression vertébrale en fin de séance', 'grip', 'bw', { eq: ['bar'], unit: 's' }),

  /* LEGS — quadriceps & fessiers polyarticulaires */
  X('squat', 'Squat barre libre (back squat)', 'Cage à squat olympique', 'quadC', 'free', { main: true, axial: true }),
  X('leg-press-45', 'Presse à cuisses inclinée 45°', 'Leg press à disques', 'quadC', 'machine', { main: true }),
  X('mx-leg-press', 'Matrix Leg Press', 'Presse horizontale à plaques (G3-S70)', 'quadC', 'machine', { main: true }),
  X('hack', 'Hack squat machine', 'Présent dans la plupart des clubs récents', 'quadC', 'machine', { main: true }),
  X('smith-squat', 'Squat à la Smith Machine', 'Pieds légèrement avancés (quads)', 'quadC', 'machine', { main: true, axial: true }),
  X('bulgarian', 'Fentes bulgares haltères', 'Pied arrière sur banc plat', 'quadC', 'free', { uni: true }),
  X('lunges', 'Fentes marchées haltères', 'Espace fonctionnel / piste verte', 'quadC', 'free', { uni: true }),
  X('goblet', 'Goblet squat', 'Haltère lourd ou kettlebell', 'quadC', 'free'),
  X('pistol', 'Pistol squat assisté / sissy squat', 'En se tenant à un montant de la cage', 'quadC', 'bw', { eq: ['gym'], uni: true }),
  X('mx-leg-ext', 'Matrix Leg Extension', 'Extension des jambes assis (G3-S71)', 'quadI', 'machine'),
  /* LEGS — chaîne postérieure */
  X('rdl', 'Soulevé de terre roumain (RDL)', 'Barre libre ou haltères', 'hinge', 'free', { main: true, axial: true }),
  X('hip-thrust', 'Hip thrust barre ou Smith', 'Dos contre banc plat + coussin de barre', 'glute', 'free', { main: true }),
  X('mx-abductor', 'Matrix Hip Abductor / Adductor', 'Machine assise écartement / rapprochement', 'glute', 'machine'),
  X('mx-seated-curl', 'Matrix Seated Leg Curl', 'Flexion assis · étirement des ischios (G3-S72)', 'hamI', 'machine', { pref: 2 }),
  X('mx-prone-curl', 'Matrix Prone Leg Curl', 'Flexion allongé sur le ventre', 'hamI', 'machine'),
  X('nordic', 'Nordic hamstring curl assisté', 'Genoux sur tapis, pieds calés · mains amortissent la fin', 'hamI', 'bw', { eq: ['floor'], fam: 'nordic', lvl: 2 }),
  /* LEGS — mollets & abdos */
  X('calf-smith', 'Mollets debout à la Smith', 'Pointes de pieds sur un step', 'calves', 'machine'),
  X('calf-press', 'Mollets à la presse à cuisses', 'Matrix ou 45°', 'calves', 'machine'),
  X('mx-calf-seated', 'Mollets assis', 'Matrix Seated Calf Raise ou haltère sur les genoux', 'calves', 'machine'),
  X('hanging-raise', 'Relevés de jambes suspendu', 'Barre fixe · sans balancer', 'abs', 'bw', { eq: ['bar'], fam: 'hanging-abs', lvl: 2 }),
  X('captain', 'Relevés de genoux · chaise romaine', "Captain's chair", 'abs', 'bw', { eq: ['gym'] }),
  X('cable-crunch', 'Crunch poulie haute à genoux', 'Corde sur poulie Matrix', 'abs', 'cable'),
  X('mx-ab', 'Matrix Ab Crunch Bench', 'Banc à abdos décliné', 'abs', 'machine'),
];

/* ═══════ Street workout & maison ═══════ */
const STREET = [
  /* PUSH — échelle pompes (pecs) */
  S('pu-incline', 'Pompes inclinées', 'Mains sur un banc ou une barre basse · corps gainé', 'chestC', ['bench'], { fam: 'pushup', lvl: 1, main: true }),
  S('pu-standard', 'Pompes classiques', 'Mains largeur d’épaules, coudes à 45°', 'chestC', ['floor'], { fam: 'pushup', lvl: 2, main: true }),
  S('pu-decline', 'Pompes pieds surélevés', 'Pieds sur un banc · cible le haut des pecs', 'chestC', ['bench'], { fam: 'pushup', lvl: 3, main: true }),
  S('pu-archer', 'Pompes archer', 'Un bras travaille, l’autre reste tendu sur le côté', 'chestC', ['floor'], { fam: 'pushup', lvl: 4, main: true, uni: true }),
  S('pu-pseudo', 'Pompes pseudo-planche', 'Mains au niveau des hanches, épaules en avant', 'chestC', ['floor'], { fam: 'pushup', lvl: 5, main: true }),
  /* PUSH — échelle dips */
  S('dips-neg', 'Dips négatifs', 'Monter en sautant, descendre en 4 s', 'chestC', ['dips'], { fam: 'dips', lvl: 1, main: true }),
  S('dips-weighted', 'Dips lestés', 'Sac à dos chargé ou ceinture de lest', 'chestC', ['dips'], { fam: 'dips', lvl: 3, main: true }),
  S('bar-dips', 'Dips à la barre droite', 'Barre fixe basse, buste au-dessus de la barre', 'chestC', ['bar'], { main: true, req: ['dips', 2] }),
  /* PUSH — pecs secondaires */
  S('pu-wide', 'Pompes mains larges', 'Mains 1,5× largeur d’épaules · étirement des pecs', 'chestI', ['floor']),
  S('pu-deficit', 'Pompes en déficit', 'Mains sur deux surélévations (bancs, livres) · amplitude max', 'chestI', ['bench']),
  S('pu-clap', 'Pompes explosives', 'Décoller les mains en haut · 1re série de la séance', 'chestI', ['floor']),
  S('trx-fly', 'Écartés à la barre basse / TRX', 'Bras presque tendus, corps incliné', 'chestI', ['lowbar']),
  /* PUSH — épaules */
  S('pike-elev', 'Pike push-ups pieds surélevés', 'Pieds sur banc, hanches à la verticale des épaules', 'shoulderC', ['bench'], { fam: 'pike', lvl: 2, main: true }),
  S('hspu-neg', 'Pompes en équilibre négatives', 'Contre un mur · descente contrôlée en 4 s', 'shoulderC', ['floor'], { fam: 'pike', lvl: 3, main: true }),
  S('hspu-wall', 'Pompes en équilibre au mur', 'Handstand push-up · tête jusqu’au sol', 'shoulderC', ['floor'], { fam: 'pike', lvl: 4, main: true, req: ['pike', 3] }),
  S('planche-lean', 'Planche lean', 'Position de pompe, épaules projetées devant les mains', 'shoulderI', ['floor'], { unit: 's', secs: [20, 40] }),
  S('wall-hs', 'Équilibre contre un mur', 'Ventre face au mur, bras verrouillés', 'shoulderI', ['floor'], { unit: 's', secs: [30, 60] }),
  S('band-lat', 'Élévations latérales élastique', 'Pied sur l’élastique, montée jusqu’aux épaules', 'shoulderI', ['band'], { k: 'band' }),
  S('pike-iso', 'Pike push-ups tempo lent', '3 s de descente, 1 s de pause en bas', 'shoulderI', ['floor']),
  /* PUSH — triceps */
  S('pu-diamond', 'Pompes diamant', 'Mains jointes sous le sternum', 'triceps', ['floor']),
  S('bar-tri-ext', 'Extension triceps à la barre basse', 'Skullcrusher au poids du corps : front vers la barre', 'triceps', ['lowbar']),
  S('pu-sphinx', 'Pompes sphinx', 'Sur les avant-bras, pousser jusqu’aux mains', 'triceps', ['floor']),
  S('band-pushdown', 'Extension triceps élastique', 'Élastique accroché en hauteur', 'triceps', ['band'], { k: 'band' }),

  /* PULL — échelle tractions */
  S('pu-scap', 'Scapula pulls', 'Suspendu bras tendus : abaisser / rentrer les omoplates', 'backV', ['bar'], { fam: 'pullup', lvl: 1, main: true }),
  S('pullup-neg', 'Tractions négatives', 'Partir menton au-dessus, descendre en 5 s', 'backV', ['bar'], { fam: 'pullup', lvl: 2, main: true }),
  S('pullup-weighted', 'Tractions lestées', 'Sac à dos chargé ou ceinture de lest', 'backV', ['bar'], { fam: 'pullup', lvl: 4, main: true }),
  S('pullup-archer', 'Tractions archer', 'Tirer vers une main, l’autre bras reste tendu', 'backV', ['bar'], { fam: 'pullup', lvl: 5, main: true, uni: true }),
  S('pullup-wide', 'Tractions prise large', 'Mains 1,5× largeur d’épaules · grand dorsal', 'backV', ['bar'], { main: true, req: ['pullup', 3] }),
  S('pullup-commando', 'Tractions commando', 'Mains l’une devant l’autre, tête alternée', 'backV', ['bar'], { req: ['pullup', 3] }),
  S('door-row', 'Tirage serviette à la porte', 'Serviette autour de la poignée, porte coincée par les pieds', 'backV', ['door'], { filler: true }),
  S('floor-lat', 'Tirage W au sol (superman)', 'Sur le ventre, tirer les coudes vers les côtes, serrer 2 s', 'backV', ['floor'], { filler: true }),
  /* PULL — échelle rowing */
  S('row-vertical', 'Rowing inversé jambes fléchies', 'Barre basse haute, pieds au sol, genoux à 90°', 'backH', ['lowbar'], { fam: 'row', lvl: 1, main: true }),
  S('row-elevated', 'Australiennes pieds surélevés', 'Pieds sur un banc, corps à l’horizontale', 'backH', ['lowbar', 'bench'], { fam: 'row', lvl: 3, main: true }),
  S('row-archer', 'Australiennes archer', 'Tirer vers une main, l’autre bras tendu', 'backH', ['lowbar'], { fam: 'row', lvl: 4, main: true, uni: true }),
  S('table-row', 'Rowing sous une table', 'Allongé sous une table solide, tirer la poitrine vers le bord', 'backH', ['table'], { main: true, filler: true }),
  S('door-row-uni', 'Rowing serviette un bras', 'Serviette passée autour d’une poignée de porte, corps incliné', 'backH', ['door'], { uni: true, filler: true }),
  S('fl-tuck', 'Front lever groupé (raises)', 'Suspendu, genoux groupés, monter le corps à l’horizontale', 'backH', ['bar'], { req: ['pullup', 3] }),
  /* PULL — arrière d'épaule */
  S('row-wide-rear', 'Australiennes coudes ouverts', 'Prise large, tirer vers le haut de la poitrine · arrière d’épaule', 'rear', ['lowbar']),
  S('bw-facepull', 'Face pull poids du corps', 'Barre basse ou TRX, tirer vers le front, coudes hauts', 'rear', ['lowbar']),
  S('ytw', 'Y-T-W au sol', 'Allongé sur le ventre, pouces vers le ciel, 10 de chaque', 'rear', ['floor'], { filler: true }),
  S('band-facepull', 'Face pull élastique', 'Élastique à hauteur des yeux', 'rear', ['band'], { k: 'band' }),
  S('door-reverse-fly', 'Oiseau serviette au cadre de porte', 'Bras tendus, ouvrir en tirant la serviette', 'rear', ['door'], { filler: true }),
  /* PULL — biceps */
  S('bw-curl', 'Curl poids du corps à la barre basse', 'Prise supination, tirer le front vers la barre', 'biceps', ['lowbar']),
  S('chinup-close', 'Chin-ups prise serrée', 'Mains jointes, coudes devant · biceps', 'biceps', ['bar'], { req: ['pullup', 3] }),
  S('towel-curl', 'Curl serviette', 'Pied sur la serviette, résister avec la jambe', 'biceps', ['floor'], { filler: true }),
  S('band-curl', 'Curl élastique', 'Debout sur l’élastique, tension continue', 'biceps', ['band'], { k: 'band' }),
  S('table-curl', 'Curl sous une table', 'Prise supination au bord, tirer le menton', 'biceps', ['table'], { filler: true }),
  S('dead-hang', 'Suspension active', 'Épaules engagées, le plus longtemps possible', 'grip', ['bar'], { unit: 's', secs: [30, 60] }),

  /* LEGS — échelle squat unilatéral */
  S('split-squat', 'Split squat', 'Fente statique, genou arrière frôle le sol', 'quadC', ['floor'], { fam: 'single-leg', lvl: 1, main: true, uni: true }),
  S('bulgarian-bw', 'Fentes bulgares poids du corps', 'Pied arrière sur banc · tempo 3 s en descente', 'quadC', ['bench'], { fam: 'single-leg', lvl: 2, main: true, uni: true }),
  S('shrimp', 'Shrimp squat', 'Jambe libre pliée derrière, genou vers le sol', 'quadC', ['floor'], { fam: 'single-leg', lvl: 3, main: true, uni: true }),
  S('pistol-box', 'Pistol squat sur banc', 'S’asseoir sur un banc sur une jambe, remonter', 'quadC', ['bench'], { fam: 'single-leg', lvl: 4, main: true, uni: true }),
  S('pistol-full', 'Pistol squat', 'Jambe libre tendue devant, descente complète', 'quadC', ['floor'], { fam: 'single-leg', lvl: 5, main: true, uni: true }),
  S('pistol-weighted', 'Pistol squat lesté', 'Sac à dos ou bidon d’eau tenu devant', 'quadC', ['floor'], { fam: 'single-leg', lvl: 6, main: true, uni: true }),
  /* LEGS — quads secondaires */
  S('cossack', 'Cossack squat', 'Squat latéral, jambe opposée tendue', 'quadC', ['floor'], { uni: true }),
  S('step-up', 'Step-ups sur banc', 'Monter sans pousser avec la jambe au sol', 'quadC', ['bench'], { uni: true }),
  S('lunge-walk', 'Fentes marchées', 'Grand pas, buste droit · sac à dos pour charger', 'quadC', ['floor'], { uni: true }),
  S('jump-squat', 'Squats sautés', 'Réception amortie · en début de séance', 'quadC', ['floor']),
  S('sissy-bw', 'Sissy squat', 'Talons levés, genoux vers l’avant, buste en arrière', 'quadI', ['floor']),
  S('reverse-nordic', 'Reverse nordic', 'À genoux, se pencher en arrière corps droit', 'quadI', ['floor']),
  S('wall-sit', 'Chaise contre un mur', 'Cuisses parallèles au sol', 'quadI', ['floor'], { unit: 's', secs: [45, 90] }),
  /* LEGS — chaîne postérieure */
  S('sl-rdl', 'Soulevé de terre une jambe', 'Dos plat, jambe arrière dans l’alignement · sac à dos pour charger', 'hinge', ['floor'], { main: true, uni: true }),
  S('sl-hip-thrust', 'Hip thrust une jambe', 'Épaules sur un banc, pousser par le talon', 'glute', ['bench'], { main: true, uni: true }),
  S('sl-bridge', 'Pont fessier une jambe', 'Au sol, pause 2 s en haut', 'glute', ['floor'], { uni: true }),
  S('slide-curl', 'Leg curl glissé', 'Talons sur une serviette, hanches hautes', 'hamI', ['floor'], { fam: 'nordic', lvl: 1 }),
  S('nordic-full', 'Nordic curl complet', 'Descente contrôlée jusqu’au sol, remontée sans les mains', 'hamI', ['floor'], { fam: 'nordic', lvl: 3 }),
  S('bar-leg-curl', 'Leg curl à la barre basse', 'Allongé, talons sur la barre, tirer les hanches', 'hamI', ['lowbar']),
  /* LEGS — mollets */
  S('calf-single', 'Mollets une jambe sur marche', 'Talon sous la marche, pause 1 s en haut', 'calves', ['bench'], { uni: true }),
  S('calf-bw', 'Mollets debout poids du corps', 'Deux pieds sur une marche · tempo lent', 'calves', ['floor']),
  /* abdos */
  S('knee-raise', 'Relevés de genoux suspendu', 'Barre fixe, sans élan', 'abs', ['bar'], { fam: 'hanging-abs', lvl: 1 }),
  S('toes-to-bar', 'Toes to bar', 'Pieds jusqu’à la barre, descente lente', 'abs', ['bar'], { fam: 'hanging-abs', lvl: 3, req: ['pullup', 3] }),
  S('l-sit', 'L-sit aux barres parallèles', 'Jambes tendues à l’horizontale', 'abs', ['dips'], { unit: 's', secs: [10, 30], req: ['dips', 2] }),
  S('hollow', 'Hollow body hold', 'Bas du dos plaqué au sol, bras et jambes tendus', 'abs', ['floor'], { unit: 's', secs: [30, 60] }),
  S('dragon-flag', 'Dragon flag négatif', 'Allongé sur un banc, corps droit, descente lente', 'abs', ['bench']),
  S('plank', 'Planche (gainage)', 'Avant-bras au sol, fessiers serrés', 'abs', ['floor'], { unit: 's', secs: [45, 90] }),
];

export const EXERCISES = [...GYM, ...STREET].map((e) => ({
  ...e,
  eq: e.eq || (e.k === 'bw' ? ['floor'] : ['gym']),
}));

export const EX = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));

/** Échelles de progression : fam → variantes triées par niveau. */
export const FAMILIES = {};
for (const e of EXERCISES) if (e.fam) (FAMILIES[e.fam] ||= []).push(e);
for (const f of Object.values(FAMILIES)) f.sort((a, b) => a.lvl - b.lvl);
/** Niveau de départ par défaut (sans historique). */
export const FAMILY_START = { pushup: 2, dips: 2, pike: 1, pullup: 2, row: 2, 'single-leg': 2, nordic: 1, 'hanging-abs': 1 };

/*
 * Gabarits de séance : 6 créneaux, le 6ᵉ est optionnel (sauté le 3ᵉ jour d'affilée).
 * heavy : créneau du mouvement principal (pool restreint aux exercices `main`)
 * alt   : groupes voisins proposés en remplacement (et en secours si le pool est vide)
 */
export const TEMPLATES = {
  gym: {
    push: [
      { groups: ['chestC'], alt: ['chestI'], heavy: true, sets: 4, reps: [6, 8], rest: 150, rir: '1–2' },
      { groups: ['shoulderC'], sets: 3, reps: [8, 10], rest: 120, rir: '1–2' },
      { groups: ['chestC', 'chestI'], sets: 3, reps: [10, 12], rest: 90, rir: '1' },
      { groups: ['shoulderI'], sets: 4, reps: [12, 15], rest: 60, rir: '0–1' },
      { groups: ['triceps'], sets: 3, reps: [10, 12], rest: 75, rir: '1' },
      { groups: ['triceps'], sets: 3, reps: [12, 15], rest: 60, rir: '0–1', optional: true },
    ],
    pull: [
      { groups: ['backV'], alt: ['backH'], heavy: true, sets: 4, reps: [6, 10], rest: 150, rir: '1–2' },
      { groups: ['backH'], alt: ['backV'], heavy: true, sets: 4, reps: [8, 10], rest: 120, rir: '1–2' },
      { groups: ['backV', 'backH'], sets: 3, reps: [10, 12], rest: 90, rir: '1' },
      { groups: ['rear'], sets: 3, reps: [12, 15], rest: 60, rir: '0–1' },
      { groups: ['biceps'], sets: 3, reps: [8, 12], rest: 75, rir: '1' },
      { groups: ['biceps', 'grip'], sets: 3, reps: [12, 15], rest: 60, rir: '0–1', optional: true },
    ],
    legs: [
      { groups: ['quadC'], alt: ['quadI'], heavy: true, sets: 4, reps: [6, 8], rest: 180, rir: '2' },
      { groups: ['hinge', 'glute'], alt: ['hamI'], heavy: true, sets: 3, reps: [8, 10], rest: 150, rir: '2' },
      { groups: ['quadC', 'quadI'], sets: 3, reps: [10, 12], rest: 90, rir: '1' },
      { groups: ['hamI'], sets: 3, reps: [10, 12], rest: 75, rir: '1' },
      { groups: ['calves'], sets: 4, reps: [10, 15], rest: 60, rir: '0–1' },
      { groups: ['abs'], sets: 3, reps: [12, 15], rest: 60, rir: '0–1', optional: true },
    ],
  },
  /* Poids du corps : fourchettes plus larges (on progresse en reps puis en variante). */
  street: {
    push: [
      { groups: ['chestC'], alt: ['chestI'], heavy: true, sets: 4, reps: [6, 12], rest: 120, rir: '1–2' },
      { groups: ['shoulderC'], alt: ['shoulderI'], heavy: true, sets: 3, reps: [6, 12], rest: 120, rir: '1–2' },
      { groups: ['chestC', 'chestI'], sets: 3, reps: [8, 15], rest: 90, rir: '1' },
      { groups: ['shoulderI'], alt: ['shoulderC'], sets: 3, reps: [10, 15], rest: 60, rir: '1' },
      { groups: ['triceps'], sets: 3, reps: [8, 15], rest: 75, rir: '1' },
      { groups: ['triceps', 'chestI'], sets: 2, reps: [12, 20], rest: 60, rir: '0–1', optional: true },
    ],
    pull: [
      { groups: ['backV'], alt: ['backH'], heavy: true, sets: 4, reps: [4, 10], rest: 150, rir: '1–2' },
      { groups: ['backH'], alt: ['backV'], heavy: true, sets: 4, reps: [8, 12], rest: 120, rir: '1–2' },
      { groups: ['backV', 'backH'], sets: 3, reps: [6, 12], rest: 90, rir: '1' },
      { groups: ['rear'], sets: 3, reps: [12, 15], rest: 60, rir: '0–1' },
      { groups: ['biceps'], sets: 3, reps: [8, 12], rest: 75, rir: '1' },
      { groups: ['grip', 'biceps'], sets: 2, reps: [10, 15], rest: 60, rir: '0–1', optional: true },
    ],
    legs: [
      { groups: ['quadC'], alt: ['quadI'], heavy: true, sets: 4, reps: [8, 12], rest: 120, rir: '1–2' },
      { groups: ['hinge', 'glute'], alt: ['hamI'], heavy: true, sets: 3, reps: [10, 15], rest: 90, rir: '1–2' },
      { groups: ['quadC', 'quadI'], sets: 3, reps: [10, 15], rest: 90, rir: '1' },
      { groups: ['hamI'], sets: 3, reps: [5, 10], rest: 120, rir: '1–2' },
      { groups: ['calves'], sets: 4, reps: [12, 20], rest: 60, rir: '0–1' },
      { groups: ['abs'], sets: 3, reps: [8, 15], rest: 60, rir: '0–1', optional: true },
    ],
  },
};

export const TYPE_LABEL = { push: 'Push', pull: 'Pull', legs: 'Legs' };
export const TYPE_FOCUS = {
  push: 'Pecs · épaules · triceps',
  pull: 'Dos · arrière d’épaule · biceps',
  legs: 'Quads · ischios · fessiers · mollets',
};
export const NEXT_TYPE = { push: 'pull', pull: 'legs', legs: 'push' };
