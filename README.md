# Révisions 5e — Mathématiques

Site de révision tout-en-un pour les élèves de 5e. Au début, l'élève choisit son chapitre :

| Chapitre | Fiche de cours | Exercices |
|---|---|---|
| **1. Règles de calcul** | Règles 1 à 6 avec calculs détaillés, vocabulaire | Calculs sans / avec priorité, parenthèses simples et imbriquées, « par où commencer ? » (clic sur l'opération), vocabulaire, phrase ↔ calcul |
| **2. Triangles** | Les 3 constructions avec figures, inégalité triangulaire, somme des angles, droites remarquables | **Constructions à tracer** (règle, compas, rapporteur, équerre) vérifiées automatiquement, triangle constructible ou non, somme des angles, reconnaître et **tracer** médiatrice, hauteur, médiane |
| **3. Fractions (partie 1)** | Écritures décimales, nombre quotient, droite graduée, fractions égales, simplification | Exercices correspondants |

Chaque chapitre a aussi un **contrôle blanc** de 10 questions noté sur 20 (avec un bouton « Passer » si l'élève bloque).
Les exercices changent à chaque fois et sont corrigés immédiatement, avec la méthode.
La progression est enregistrée dans le navigateur de l'élève (aucun compte, aucune donnée envoyée).

## Aides à la révision

- **💡 Indices didactiques** (jamais la réponse) : 1. une question qui relance et renvoie à la fiche ; 2. un exemple résolu avec d'autres nombres ; 3. un outil (droite graduée coloriée, critères de divisibilité, ordre des priorités, exemple animé…). Une réussite avec indice compte comme juste, mais la progression l'indique. Pas d'indice dans les contrôles blancs.
- **🤔 Remédiation selon l'erreur** : au premier essai, si la réponse correspond à une erreur classique (3/4 écrit 3,4 ; fraction inversée ; même nombre ajouté en haut et en bas ; calcul de gauche à droite sans les priorités ; parenthèses oubliées ; graduations comptées comme des unités ; angles additionnés…), un message ciblé l'explique et l'élève a un second essai. Pour les constructions, le site affiche d'abord ce que mesure la figure de l'élève, sans la correction.
- **🎬 Animations des constructions** (chapitre 2) : règle, compas, rapporteur et équerre dessinés, étape par étape. Avant de répondre, « Voir un exemple » montre la méthode sur un **autre** triangle ; après la réponse, « Voir la construction » montre la correction. Aussi sur la fiche.
- **📌 Mes erreurs** : chaque type de question raté (exercices et contrôle blanc) est ajouté à la page « Mes erreurs » du chapitre, qui ne propose que ces questions. Un point faible disparaît après 2 réussites d'affilée sans indice. Le nombre de points faibles s'affiche dans le menu et sur les accueils.
- **🔊 Écouter** : lecture à voix haute des énoncés, des indices, des corrections et des fiches, avec la voix française de l'appareil (fractions lues « trois quarts », angles, segments, parenthèses…). La qualité de la voix dépend de l'appareil.

## La planche de construction (chapitre 2)

- **Règle** : la longueur s'affiche au millimètre pendant le tracé.
- **Compas** : le rayon s'affiche ; le cercle se trace d'un clic.
- **Rapporteur** : sommet, puis côté de départ (0°), puis on tourne jusqu'à la bonne mesure.
- **Point** : s'accroche aux intersections (arcs, demi-droites, droites).
- **Équerre** : trace la perpendiculaire à une droite passant par un point.
- **Déplacer** : fait glisser toute la figure si elle sort du cadre.
- **− / +** : ajuste le dernier tracé (longueur, rayon, angle) — utile sur téléphone.
- L'élève choisit le **nom du prochain point** (A, B, C…) avant de le placer.

Le site vérifie les longueurs (à 1,5 mm près), les angles (à 2° près) et que les côtés sont bien tracés. En cas d'erreur, il affiche la méthode et la figure attendue.

## Mettre le site en ligne avec GitHub Pages

1. Dans le dépôt, cliquer sur **Add file → Upload files** et glisser `index.html`, `style.css`, `script.js` (et ce `README.md`). Ils remplacent les anciens.
2. **Commit changes**.
3. Si ce n'est pas déjà fait : **Settings → Pages → Deploy from a branch → main → / (root) → Save**.
4. Après 1 à 2 minutes, recharger le site avec **Ctrl + F5**.

## Modifier le site

- **Les fiches** sont dans `index.html`, une section par page (`data-ch` = chapitre, `data-p` = page, `data-title` = nom dans le menu).
  - Chapitre 3 : une fraction s'écrit `[[numérateur|dénominateur]]`.
  - Chapitre 1 : `<div class="calc-demo" data-name="A" data-expr="5 + 3 × 7"></div>` affiche le calcul détaillé étape par étape.
- **Les exercices** sont dans `script.js` (une fonction par type) et sont déclarés dans l'objet `GENS`.
- **Ajouter un chapitre** : ajouter des sections `data-ch="nouveau"` dans `index.html`, une entrée dans `CHAPTERS` et ses exercices dans `GENS` (`ch: 'nouveau'`). Le contrôle blanc et la progression suivent automatiquement.
