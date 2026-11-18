# Révisions 5e — site, Espace professeur, classeur et documents

Le site garde la même adresse. Les 3 premiers chapitres (calculs, triangles, fractions 1) ne changent pas.
Quatre chapitres s'ajoutent : **4 Proportionnalité · 5 Angles · 6 Fractions (partie 2) · 7 Divisibilité**.
Ils sont **fermés aux élèves par défaut** : c'est toi qui décides quand les ouvrir.

## Ce qu'il faut déposer dans le dépôt GitHub de 5e (tout à la racine, sans dossier)
- Le site : `index.html`, `script.js`, `style.css`, `chapitres-5e.js`, `chapitres-5e.css`, `espace-prof.js`, `controles-5e.js`, `devoir-5e.js`, `qrcode.js`, `reglages.js`, `ouverture.js`, `classeur.html`, `jeux.js`, `acces.json`
- Les dossiers `jeu-fractions/` (3 fichiers) et `jeux-img/` (4 images) : les jeux repris du site de 6e
- Le dossier `resultats/` est créé tout seul par le bouton « 🌐 Mettre les résultats en ligne »
- Les documents PDF (22 fichiers) :
  - `cours-eleve-<Chapitre>.pdf` : cours à trous, à imprimer pour les élèves
  - `cours-prof-<Chapitre>.pdf` : le même cours complété (réponses en bleu)
  - `exercices-<Chapitre>.pdf` : fiche d'exercices des élèves (exercices numérotés, faits dans le cahier)
  - `exercices-corriges-<Chapitre>.pdf` : les mêmes exercices avec un corrigé détaillé
  - `projection-<Chapitre>.pdf` : les fiches à projeter (questions flash, activités, jeux)
  - `devoirs-impression.pdf` : les 6 fiches de devoirs à coller, deux exemplaires par feuille A4 (à couper)
  - `devoirs-corriges.pdf` : chaque fiche de devoir suivie de son corrigé

Les fichiers du même nom sont remplacés. Ne dépose rien dans le dépôt de 6e ni dans le dépôt « test ».
Avant de déposer, change le code `prof5e` dans `reglages.js`.

**Attention :** si le dépôt est public, les PDF « prof » et « corrigés » le sont aussi. Leur adresse n'est affichée nulle part pour les élèves, mais elle reste devinable.

## Espace professeur
- Adresse : `…/#/prof` (lien « Espace professeur » en bas de chaque page), code dans `reglages.js`.
- C'est la seule porte vers le classeur : sans le code, `classeur.html` renvoie vers l'Espace professeur.
- « Ce que voient les élèves » : coche les pages vues en classe, puis télécharge `ouverture.js` et dépose-le dans GitHub.

## Le classeur
Pour chaque créneau :
- le déroulé minuté ;
- **Repère et documents** : boutons qui ouvrent directement la bonne page du cours (élève ou prof), de la fiche d'exercices, des corrigés et de la fiche à projeter ;
- **École Directe** : le « Contenu de séance » et le « Travail à faire » déjà rédigés, avec un bouton « Copier » pour chacun ;
- l'activité, les 5 questions Plickers, le devoir à donner (avec la fiche à imprimer et son corrigé).

Après chaque cours, indique « Fait », « Pas tout fini » ou « Annulé » : la suite se recalcule, ainsi que les textes pour École Directe.

## Les cours
Mise en page LaTeX (encadrés, couleurs et polices comme ton modèle). Pas de nom ni de prénom sur les cours. Une petite mention « Séance n » indique où commence chaque séance. Les cours ne renvoient plus à un cahier d'activités : chaque « S'entraîner » donne les numéros de la fiche d'exercices du chapitre. Les sources LaTeX sont dans `Sources_LaTeX.zip`.

Exception : le cours de Proportionnalité (5 pages, une page par séance à partir de la séance 3) ne vient plus de LaTeX. Sa source est `sources/cours-Proportionnalite.html` (inutile de déposer ce dossier sur GitHub) : ouverte telle quelle, c'est la version élève ; avec `?prof` à la fin de l'adresse, la version complétée. Pour refaire les PDF : ouvrir chaque version dans Edge ou Chrome, Imprimer, « Enregistrer au format PDF », sans en-têtes ni pieds de page. Si la pagination change, mettre à jour les numéros de page dans `classeur.html` (`PDFP`).

La diapo « Les courses en soldes » (pages 12 et 13 de `projection-Proportionnalite.pdf`) vient aussi d'une page HTML : `sources/diapo-soldes.html` (images dans `sources/img/`). Ouverte telle quelle, ce sont les questions ; avec `?rep`, les réponses. Pour la refaire : imprimer chaque version en PDF, puis remplacer les pages 12 et 13 du PDF de projection.

## Les contrôles sur papier, avec QR code
Espace professeur → « Contrôle sur papier » (même principe qu'en 6e) :
1. Coche les compétences, indique la classe, colle la liste des élèves, coche la version aménagée si besoin.
2. « Préparer le contrôle » : durée automatique (≈ 20, 30 ou 45 min), ajustable avec − et +, et vérification que chaque copie tient sur une page A4.
3. « Imprimer les sujets » : une page par élève, avec en haut son nom et prénom, juste en dessous un code et un QR code. Tu disposes aussi d'un « Corrigé » et d'un « Fichier pour la correction assistée ».
4. Colle les résultats (`CODE C1=TB C2=MF…`), vérifie le tableau, puis clique sur **🌐 Mettre les résultats en ligne** (ou imprime les étiquettes QR, planche L7160). Le QR imprimé sur la copie ouvre « Mon contrôle » : le bilan de l'élève, le corrigé de son sujet et les exercices à refaire. L'élève peut aussi taper son code sur `…/#/m`.

Chaque copie est mise dans une boîte de 184 × 270 mm, un peu plus petite qu'une feuille A4 : elle tient sur une page même si le navigateur ajoute ses propres marges (Chrome, Edge, Firefox, Safari). Si le contenu est trop long, il est écrit plus petit, sur toute la largeur de la page. Une copie qui ne tiendrait pas même très réduite (par exemple 36 questions) bloque le bouton « Imprimer » et le signale, plutôt que de perdre des questions. Un bouton « ← Retour au site » est en haut de chaque aperçu. Imprime à l'échelle 100 %, sans « ajuster à la page ».

Rien n'est stocké sur un serveur : les contrôles restent sur l'appareil du professeur, et chaque sujet est recalculé à partir de son code.

## L'entraînement des élèves
- Chaque exercice du site se fait par **séries de 8 questions** : 3 de niveau 1, 3 de niveau 2, 2 de niveau 3. Les nombres et les situations deviennent plus difficiles, et une question ne revient pas deux fois dans la même série. À la fin, l'élève a son bilan (par exemple 7 / 8, détaillé par niveau) ; le site retient sa meilleure série.
- Le **contrôle blanc** ressemble au contrôle sur papier : 5 compétences du chapitre, 2 questions chacune (une facile, une plus difficile), toutes sur la page, sans indice, avec une durée conseillée et un chronomètre. Quand l'élève rend sa copie, il obtient son niveau dans chaque compétence (TB, MS, MF, MI), le corrigé de chaque question et un lien vers les exercices à refaire.

## Repris du site de 6e (17/11/2026)

### 🎮 Jeux
Le bouton **🎮 Jeux**, en haut de chaque page, ouvre la salle de jeux (`#/jeux`) : Estimangle, Droite parfaite, Le Pont des Fractions et Aura Rush. Ce sont les jeux du site de 6e, hors chapitre (pages `data-ch="_"` avec `data-game="1"`, adresse `#/jeux/<nom>`), toujours ouverts aux élèves. Fichiers : `jeux.js`, `jeu-fractions/`, `jeux-img/`. Pour mettre à jour le Pont des Fractions, recopier le dossier `jeu-fractions/` du site de 6e (sa source reste dans le dossier de 6e).

### Code d'accès et sauvegarde en ligne
- À l'entrée de l'Espace professeur, le **code d'accès** du site de 6e marche aussi : il ouvre l'espace et règle la sauvegarde en ligne sur l'appareil (`acces.json`, le même fichier que sur le site de 6e ; s'il change en 6e, recopier `acces.json` ici). Le code `prof5e` de `reglages.js` ouvre toujours l'espace, sans rien régler.
- L'Espace professeur est enregistré, chiffré, dans le **même dépôt GitHub privé** que le classeur de 6e, fichier `prof-5e.json` : contrôles (avec les résultats collés), listes d'élèves, classes, élèves en version aménagée, et le fichier pour la correction assistée de chaque contrôle. À l'ouverture, toutes les 30 s et après chaque modification.
- Le **classeur** de 5e se synchronise de la même façon dans `classeur-5e.json` (encadré en bas du classeur). Si deux appareils ont modifié le classeur, il demande quelle version garder.
- Rien à régler si le site de 6e est déjà synchronisé dans le navigateur : les deux sites sont à la même adresse (darthialm.github.io), ils partagent les réglages.
- **📁 Mes contrôles** (carte Contrôle sur papier) : réimprimer les sujets, corrigé, fichier IA, supprimer. Les contrôles faits sur un autre appareil y apparaissent.

### Résultats en ligne et page « Mon contrôle »
- « 🌐 Mettre les résultats en ligne » écrit `resultats/ID.json` dans le dépôt public du site (`darthialm/cinquieme`) : codes anonymes, niveaux et détail ✓/✗, **aucun nom**. Il faut que le jeton GitHub de la sauvegarde ait le droit d'écrire dans ce dépôt (Contents : Read and write) ; sinon le fichier est téléchargé et il faut le déposer dans un dossier `resultats` du site.
- Le QR imprimé sur la copie mène à `…/#/m/ABC-07`. L'élève peut aussi taper son code sur `…/#/m`. Les copies imprimées avant le 17/11/2026 ont un QR qui ne contient que le code : les élèves tapent leur code, ou tu imprimes les étiquettes.
- Attention : ces résultats sont publics ; quelqu'un qui devine un code voit les niveaux, sans savoir de quel élève il s'agit.

### Correction avec l'IA
Le fichier pour la correction assistée reprend les consignes de 6e : question en partie juste = ½ pour le niveau, réponse en 4 parties (à vérifier, lignes à coller, une fiche par élève avec ✓ ½ ✗ et une remarque, bilan pour la classe). Les mêmes règles sont dans `CLAUDE.md`.

## Jeu « Code Rouge » (18/11/2026)
Chapitre 1 (Règles de calcul), page **🎮 Jeux** (`#/calculs/jeux`), aussi en tête de la salle de jeux. Dossier `jeu-calculs/` (HTML, CSS et JS simples, sans dépendance), vignette `jeux-img/code-rouge.svg`.
- On désamorce des bombes : chaque opération est un fil à couper dans l'ordre des règles du cours, puis on choisit le résultat de l'étape. Erreur = −4 s avec la règle rappelée ; explosion = un cœur en moins et la correction étape par étape.
- 7 missions (règles 1-2, règles 3-4, pièges, parenthèses, parenthèses imbriquées, vocabulaire, Méga-bombe) puis le mode Survie. Une étoile ouvre la mission suivante ; `jeu-calculs/index.html?tout` ouvre tout (pour projeter).
- Quand plusieurs opérations peuvent se faire en premier (deux parenthèses, deux produits séparés par un +), le jeu accepte chacune.
- Une page de chapitre avec `data-game="1"` passe en premier dans le menu du chapitre et apparaît dans la salle de jeux tant que le chapitre est ouvert.

## Jeu « Z ou F ? » (18/11/2026)
Chapitre Angles, page **🎮 Jeux** (`#/angles/jeux`), dossier `jeu-angles/`, vignette `jeux-img/z-ou-f.svg`. Reconnaître les angles alternes-internes (le Z) et correspondants (le F) sur des figures tirées au hasard, de plus en plus difficiles (figures tournées, droites non parallèles, droites en plus), puis les propriétés 1 et 2 (« Le Juge »). Les critères affichés sont ceux du cours (`sources/latex/src/angles.tex`). `jeu-angles/index.html?tout` ouvre toutes les missions. La page n'est visible des élèves que si le chapitre Angles est ouvert (`ouverture.js`).

## Devoirs en ligne (17/11/2026)
- Même fonctionnement que le mode devoir du site de 6e : un lien `…/#/devoir/<exercices>/<nombre>/c=<classe>/g=1` (fichier `devoir-5e.js`, exercices de 5e uniquement : clés de `GENS`). Indices et deuxième essai permis, version papier possible, carte de résultat.
- `/g=1` envoie le résultat au **même formulaire Grist que la 6e** (`GRIST_SITE`, table `Table1`). La colonne Classe commence par « 5e » (« 5e Judo ») pour distinguer les niveaux. Le code de 14 caractères a le même format qu'en 6e : le widget « Mes devoirs » de Grist le reconnaît.
- Le classeur donne **un seul lien par travail à faire** (« Exercices en ligne : faire les N questions »), avec toutes les notions des pages d'exercices de la séance (`DEV[…].site` → `PAGE_KEYS`), 10 questions pour une page, 15 pour deux, 20 au plus. Un nouvel exercice de 5e doit être ajouté à `PAGE_KEYS` dans `classeur.html` pour entrer dans les devoirs.
- L'API ÉcoleDirecte lit ces résultats : `GET /v1/devoirs-en-ligne?classe=5e`.

## MathClash — jeu Plickers en classe (18/11/2026)
Espace professeur → carte **🥋 MathClash** → « Ouvrir l'écran à projeter » (`mathclash/index.html?mode=screen`, protégé comme le classeur).
- Sur le téléphone : scanner le QR code affiché en haut de l'écran (ou ouvrir `…/mathclash/index.html?mode=phone` et taper le code à 4 chiffres). La caméra lit les cartes Plickers (version 1, n° 1 à 40) ; les boutons Lancer / Révéler / Suivante pilotent l'écran. Bouton « Webcam locale » en secours sur le PC.
- Montante-Descendante : 5 ceintures (blanche, jaune, verte, bleue, noire) de 2 barrettes chacune. Bonne réponse = +1 barrette, erreur = −1 barrette. Pas de mode rapidité.
- Pour que ça reste fun : 3 bonnes réponses de suite donnent un 🛡️ bouclier (annule une chute) ; en ceinture noire, chaque bonne réponse rapporte une ⭐ ; toutes les 5 questions, ⚡ question bonus (+2 barrettes, pas de chute) ; si 2 élèves sur 3 ont juste, 🏆 défi classe réussi (confettis). À la révélation, les prénoms glissent d'une ceinture à l'autre.
- L'écran : barre du haut sur une ligne (le QR code s'ouvre en grand au démarrage, et en cliquant sur « Relier le téléphone »), question qui s'ajuste à la place libre, prénoms le plus gros possible.
- ⚙️ Réglages : classe et liste « Prénom numéro de carte », durée, niveau, thèmes (proportionnalité et pourcentages cochés au départ).
- Les listes et les ceintures restent dans le navigateur du PC (clé `revisions5e-plickers`), elles ne sont ni publiées ni synchronisées.
- Il faut internet (serveur public PeerJS pour relier le téléphone) et une adresse en HTTPS pour la caméra (GitHub Pages).
