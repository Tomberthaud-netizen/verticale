# Rapport d'extraction — Catalogue de prix de référence

Généré le 2026-08-21 à partir des devis fournisseurs stockés dans `Devis/` (165 fichiers PDF, 23 sous-dossiers "Lot - ...", 3 chantiers : EVRY, PLESSIS, BOURBOURG).

Méthode : extraction texte via `pdftotext -enc UTF-8 -layout` (le drapeau `-enc UTF-8` était indispensable — sans lui les accents français étaient corrompus et cassaient la détection des en-têtes de colonnes), puis un parseur sur mesure (Node.js) qui repère les lignes d'en-tête de tableau (Désignation/Dénomination, Unité, Quantité, PU, Total), déduit l'ordre des colonnes numériques déclaré par chaque gabarit de sous-traitant, puis extrait chaque ligne de prix en vérifiant autant que possible la cohérence `quantité × prix unitaire ≈ total`.

## Chiffres clés

- **165 fichiers PDF** au total dans `Devis/`.
- **107 fichiers** ont produit au moins une ligne de prix exploitable.
- **103 fichiers** ont finalement contribué au catalogue final (quelques fichiers n'ayant produit que des lignes rejetées lors du filtrage qualité, ou appartenant au lot Ascenseur exclu — voir plus bas).
- **58 fichiers écartés**, répartis ainsi :
  - **25** — texte vide ou quasi vide après extraction (PDF scanné / image, aucun texte exploitable). Reconnaissables notamment aux noms de fichiers de type scanner (`06102023154615-0001...`) ou aux courriers/annexes courts.
  - **11** — doublons / révisions antérieures d'un même devis (indices A/B/C, versions v-2/v-3/v-4/v-5, "remise de prix" successives) : seule la révision la plus récente a été conservée à chaque fois (ex. `devis-2025-0061-ind-c` conservé, `ind-a`/`ind-b` écartés ; `farprom-dqe-bt-france...-ind-d` conservé, `ind-b` écarté ; `mi-...-v-5-0` conservé, `v-2/v-3/v-4` écartés).
  - **15** — aucun tableau de prix détecté (mémoires techniques, listes de références, courriers, annexes, ou récapitulatifs DQE sans prix unitaire visible par ligne).
  - **7** — un tableau a été détecté mais aucune ligne n'a passé les filtres qualité (désignations trop courtes/génériques, valeurs incohérentes, etc.).
- **1 lot exclu explicitement** : **Ascenseur** (3 fichiers Schindler/Otis, dont 2 sans tableau détecté et 1 fiche technique à une seule ligne de prix réelle — les offres ascenseur sont des forfaits globaux avec fiche technique en prose, pas des grilles de prix unitaires réutilisables ; les quelques lignes extraites automatiquement de la fiche technique étaient trop bruitées pour être fiables).
- **Lot "Toiture végétalisée"** : les 3 fichiers présents (1 scanné, 1 fiche technique, 1 mémoire technique) ne contiennent aucun prix unitaire exploitable — **0 ligne** dans le catalogue pour ce lot.

## Résultat final

**3 913 lignes de prix** dans `catalogue-prix-extrait.json`, réparties sur **17 lots** :

| Lot | Lignes |
|---|---:|
| GO | 825 |
| Plomberie Sanitaire Chauffage | 562 |
| Elec | 286 |
| Sols Souples | 282 |
| Menuiserie Intérieure | 257 |
| Pompage | 253 |
| Terrassement | 239 |
| Carrelage Faïence | 201 |
| Cloisons Doublage | 181 |
| Façade | 177 |
| Menuiserie Extérieure | 161 |
| Métallerie Serrurerie | 159 |
| Peinture | 108 |
| Étanchéité | 87 |
| VRD | 53 |
| Charpente Bois | 52 |
| Chape | 19 |
| Fondations spéciales | 11 |

### Niveau de confiance

| Confiance | Lignes | Signification |
|---|---:|---|
| `haute` | 515 | Ligne alignée avec un en-tête de colonnes clair, nombre de colonnes numériques cohérent avec l'en-tête, et — quand quantité/PU/total sont tous les trois présents — `quantité × PU ≈ total` vérifié. |
| `moyenne` | 1 996 | Alignement de colonnes partiel (ex. colonne "Total" absente sur la ligne, unité non détectée, ou correction automatique qty/PU appliquée). |
| `basse` | 1 402 | PU déduit indirectement (ex. `total ÷ quantité`, ou quantité implicite = 1 sans vérification possible), ou incohérence de calcul détectée. À vérifier en priorité avant usage. |

Le champ `confiance` est pensé pour être utilisé par le code de suggestion en aval : privilégier `haute` > `moyenne` > `basse` à désignation équivalente.

## Gestion des doublons

- Les révisions successives d'un même devis (indices A/B/C/D, versions v-1…v-5, "remise de prix N") ont été repérées par similarité de nom de fichier ; seule la version la plus récente a été analysée, les autres ont été écartées en amont pour éviter de polluer le catalogue avec des prix obsolètes.
- Certains fichiers apparaissent dans deux dossiers "Lot" différents (ex. un devis SPERY couvrant à la fois "Sols Souples" et "Carrelage Faïence" pour EVRY, ou un DQE listant à la fois des postes "GO" et "Terrassement"). Dans ce cas, les lignes ont été conservées sous les deux lots (comportement volontaire : le lot reflète le dossier source, pas une classification sémantique de chaque ligne) — attendez-vous donc à voir certaines désignations identiques dupliquées entre deux lots.
- Au sein d'un même lot, les doublons exacts (même désignation + même prix + même unité) ont été dédupliqués automatiquement ; les variations de prix légitimes pour une désignation similaire (négociations, révisions) ont, elles, été conservées telles quelles.

## Points à vérifier manuellement (échantillon)

L'extraction est heuristique (mise en page PDF très hétérogène selon les ~20 sous-traitants représentés) : les lignes `confiance: "basse"` et une partie des `"moyenne"` méritent une relecture avant intégration en base. Quelques cas typiques observés :

- **Prix unitaires très élevés (proches du plafond de 20 000-150 000 €)** : plusieurs lignes à 4-5 chiffres restent ambiguës entre un vrai prix unitaire d'ouvrage global (forfait "ens"/"ff") et un sous-total de ligne mal aligné en colonne PU. Un plafond dur à 150 000 € et une exigence de cohérence quantité × PU ≈ total (avec quantité > 1) ont été appliqués pour écarter les cas les plus flagrants, mais certains résidus subsistent, surtout en lot GO et Plomberie.
- **Désignations tronquées** : sur certains gabarits, la description d'un ouvrage est répartie sur plusieurs lignes wrappées dans le PDF ; seule la ligne portant effectivement les nombres a été retenue, ce qui donne parfois des désignations un peu courtes ou orphelines de leur contexte (ex. juste "Aciers HA", "Poteaux en béton armé" sans le détail dimensionnel qui suivait sur la ligne suivante).
- **Unité absente** (`unite: null`) sur environ la moitié des lignes : soit le gabarit ne montrait pas d'unité en colonne séparée, soit elle était trop collée au texte de désignation pour être isolée de façon fiable. Le prix unitaire reste correct dans la plupart des cas, seule l'unité de mesure est manquante.
- **`dateReference` absente** sur une partie des lignes (~17 %) quand ni le corps du texte ni le nom de fichier ne contenaient de date exploitable dans les premières pages du document.
- **Fichiers "DQE" génériques** (ex. `dqe-plessis-trevise-*`, `farprom-dqe-bt-france-*`) couvrant plusieurs lots à la fois (GO, Terrassement, Pompage...) : le lot assigné correspond au dossier où le PDF a été trouvé, qui peut ne pas correspondre exactement au lot réel de chaque ligne individuelle si le même DQE a été rangé dans plusieurs dossiers.

## Fichiers produits

- `prisma/seed-data/catalogue-prix-extrait.json` — catalogue final (3 913 entrées).
- `prisma/seed-data/catalogue-prix-rapport.md` — ce rapport.

Aucun autre fichier du projet n'a été modifié.
