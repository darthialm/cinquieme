# Site « cinquième » — consignes pour Claude

Ce site a le même fonctionnement que le site de 6e (dossier voisin `site 6eme`), avec ses propres contenus :
ne jamais mélanger les exercices, chapitres ou documents des deux niveaux.

## Corriger un contrôle papier (PDF de copies scannées)

Le professeur donne un PDF de copies « Contrôle » (code de copie sous le QR, ex. `BMG-03`) et le **fichier pour la
correction assistée** (`controle-ID-correction.txt`, bouton 🤖 dans l'Espace professeur → 📁 Mes contrôles). Ce fichier
est aussi joint, chiffré, à `prof-5e.json` dans le dépôt privé (le script `controle-correction.ts` de l'API ne lit que
`prof.json`, celui de 6e) : s'il manque, le demander au professeur.

1. **Lire les copies** : chaque page une seule fois, 3 ou 4 par message. Calculer soi-même les réponses à partir des
   énoncés imprimés ; ne lire l'« Attendu » du fichier que pour une question douteuse. Le haut de la copie porte le nom :
   ne jamais le recopier ailleurs que dans les fiches « à écrire sur les copies ».
   **Doute de lecture** (chiffre ou virgule peu lisible, rature, deux cases marquées, réponse surlignée mais pas
   cochée, case presque vide…) : **ne jamais choisir seul**. Relire d'abord la zone en haute résolution ; si le doute
   reste, **poser la question au professeur** avec l'outil de question (copie, prénom, question, ce qui est lu, les
   deux lectures possibles, image de la zone si possible) et **attendre sa réponse** avant de donner la ligne de cette
   copie. Regrouper les doutes en une ou deux séries de questions plutôt que de les poser un par un.
2. **Noter** :
   - Par question : `1` si entièrement juste, `0` sinon (ces chiffres alimentent le corrigé en ligne de l'élève).
     Deux cases cochées = 0.
   - Une question **en partie juste** (inattention : retenue, virgule, recopie ; une étape fausse puis la suite
     cohérente ; 2 calculs justes sur 3 ; problème pas terminé) garde `0` mais compte **½ pour le niveau**.
   - Niveau = (justes + ½ × en partie justes) / nombre de questions : tout = TB, ≥ 2/3 MS, ≥ 1/3 MF, sinon MI.
     Une seule question (un problème), jugée d'abord sur le choix des opérations : tout juste TB ; bonnes opérations
     à chaque étape, même avec des erreurs de calcul, ou problème presque fini (dernière étape manquante) MS ; au
     moins une étape juste (bonne opération ou calcul juste), ou juste avec les nombres de l'élève, MF ; aucune MI.
   - Le niveau écrit dans la ligne l'emporte sur les chiffres.
3. **Répondre en 4 parties** :
   1. **À vérifier** : les copies absentes du scan, et le rappel des doutes de lecture tranchés par le professeur.
   2. **Lignes à coller**, dans l'ordre des codes, sans aucune remarque : `BMG-03 C1=MF(100) C2=MF(00001) C3=MS(0)`
   3. **À écrire sur les copies** : une fiche par élève, affichée avec l'outil de visuel interactif (`show_widget`), avec
      des flèches ← → (boutons et clavier), dans l'ordre des pages du scan (sinon un tableau, une ligne par copie).
      Chaque fiche : nom, n° de page, code, niveaux, Q1, Q2… avec ✓, ½ ou ✗ (détail par calcul ou par étape si besoin,
      ✓* = juste avec les nombres de l'élève), puis une remarque didactique de 1 ou 2 phrases (ce qui est réussi, une
      piste pour trouver l'erreur soi-même, ou un renvoi au corrigé en ligne). Pas de correction toute faite.
   4. **Bilan pour la classe** (sans nommer personne) : réussites, 2 ou 3 erreurs fréquentes avec une piste, un mot
      d'encouragement.

Les mêmes règles sont écrites dans le fichier de correction produit par le site (`aiText` dans `controles-5e.js`) : si
on les change, changer les deux (et `CLAUDE.md` du site de 6e). Ne jamais copier les pages scannées dans le projet.

Après la correction, le professeur colle les lignes dans « Résultats » (Espace professeur) puis clique sur
« 🌐 Mettre les résultats en ligne » : `resultats/ID.json` dans le dépôt public `darthialm/cinquieme` (codes anonymes,
aucun nom). L'élève scanne le QR de sa copie (`#/m/ABC-07`) ou tape son code sur `#/m`.

## Jeux (solo + duel sur tablette)

- `jeux-commun/moteur.js` et `moteur.css` (questions, pavés, écran coupé gauche/droite, `Moteur.match` pour les duels au
  tour par tour) et le dossier `jeu-trigone/` sont **identiques dans les deux sites** : toute modification se recopie
  dans l'autre site (Trigone choisit sa version avec `<body data-niveau="6|5">`).
- Un nouveau jeu doit avoir un mode solo et un mode duel, et une vraie mécanique où les décisions du joueur sont des
  décisions mathématiques (pas un quiz habillé, pas seulement une course).
