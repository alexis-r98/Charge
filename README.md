# Charge — prise de masse & PPL express

Web app mobile-first (HTML/CSS/JS vanilla, zéro dépendance) : recettes hypercaloriques, générateur de séances Push / Pull / Legs pour 3 jours consécutifs (salle, street workout ou maison) et suivi du poids. Tout est stocké dans le `localStorage` du téléphone (clé `charge-v1`), sauvegarde/restauration JSON dans Journal › Réglages. Fonctionne hors ligne (service worker) une fois servie en HTTPS.

## Lancer

```
node charge/server.mjs        # http://localhost:3070
node charge/tests/generator.test.mjs
node charge/tests/foods.test.mjs
node charge/tests/calc.test.mjs
```

## Fichiers

- `js/data-recipes.js` : 18 recettes de base + 23 dans `js/data-recipes-extra.js`, généré par `node charge/tools/build-recipes.mjs` (macros calculées depuis une table nutritionnelle) — 41 au total.
- `js/foods.js` : aliments excluables (avocat, poisson, lactose, gluten…) + aliments libres.
- `js/figures.js` : figurines animées des 146 exercices (cinématique inverse, SVG/SMIL, hors ligne). Planche de contrôle : `/tools/figures.html` (`?motion=on` pour animer, `?all` pour tout voir).
- `js/data-exercises.js` : 146 exercices — 71 salle (Basic-Fit / Matrix), 75 street workout / maison, 8 échelles de progression.
- `js/calc.js` : objectif calorique (Mifflin-St Jeor + surplus), cibles de macros, portions (ajustement par créneau), échauffement, disques par côté, 1RM estimé.
- `js/progress.js` : courbe de progression par exercice (1RM estimé ou meilleure série).
- `js/generator.js` : génération et règles de récupération (pur, testé sous Node).
- `js/weight.js` : pesées, moyenne 7 j, rythme hebdo, ajustement calorique, courbe SVG.
- `js/store.js` : persistance. `js/app.js` : interface. `sw.js` : cache hors ligne (incrémenter `VERSION` à chaque livraison).

## Règles du générateur

1. Pas de mouvement axial (squat libre, RDL, rowing barre, T-bar, OHP debout, squat Smith) le lendemain d'une séance qui en contenait.
2. Au plus 1 axial par séance en Push/Pull, 2 en Legs.
3. 3ᵉ jour d'affilée : 5 exercices au lieu de 6, séries à 4 ramenées à 3, machines favorisées.
4. Les exercices de la dernière séance du même type sont moins probables (variété).
5. Surcharge progressive : toutes les séries au haut de la fourchette → +2,5 kg (+1 kg en isolation) ; au poids du corps → variante suivante de l'échelle (pompes inclinées → classiques → pieds surélevés → archer → pseudo-planche, etc.).
6. Lieu : la salle tire dans le catalogue Basic-Fit ; « Remplacer » y propose aussi les variantes street faisables (barre fixe, dips, sol). Street / maison ne tirent que ce que permet le matériel coché.
7. Variantes avancées (chin-ups, tractions larges, toes-to-bar, HSPU…) verrouillées tant que la base n'est pas maîtrisée.

## Poids

Cible prise de masse propre : +0,25 à +0,5 % du poids de corps par semaine. Sous ce rythme (régression sur 21 jours, ≥ 4 pesées sur ≥ 10 jours) l'app propose +150/+250 kcal ; au-delà de 0,75 %/sem, −200 kcal. Un ajustement bloque le suivant 10 jours.

## Sources (exercices & rythme)

- Échelles poids du corps : routine recommandée r/bodyweightfitness, GMB (bodyweight leg exercises), Decathlon Conseil Sport, Nutripure.
- Rythme de prise : MacroFactor (synthèse Garthe et al.), recommandations Helms.
