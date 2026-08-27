# Suivi de Chantiers — CLAUDE.md

Ce fichier donne à Claude Code le contexte nécessaire pour développer l'application de suivi de chantiers décrite ci-dessous. Il sert de référence unique pour l'architecture, le modèle de données, la logique métier et les écrans à produire.

## 1. Objectif du projet

Application web permettant de suivre plusieurs chantiers de construction/rénovation sous forme de calendriers de type **Gantt**, avec :

- une page d'accueil récapitulative de tous les chantiers,
- une fiche détaillée par chantier avec son propre Gantt,
- un calendrier global regroupant tous les chantiers.

Le logo de l'entreprise sera fourni par l'utilisateur (fichier image à placer dans `public/logo.png` ou équivalent) et intégré en haut à gauche du site. Ne pas générer de logo, prévoir simplement l'emplacement et le composant d'affichage.

## 2. Stack technique recommandée

- **Framework** : Next.js (App Router) + TypeScript
- **UI** : React + Tailwind CSS
- **Base de données** : SQLite en local via Prisma (facilement migrable vers Postgres en production)
- **Gantt** : composant développé sur-mesure (grille CSS/SVG + Tailwind), plutôt qu'une librairie clé en main, car la coloration par phase, la superposition des retards et le redimensionnement dynamique de la date de fin nécessitent un contrôle fin difficile à obtenir avec une lib toute faite (type frappe-gantt, dhtmlx, etc.). Une librairie légère peut être utilisée comme base si elle permet une customisation complète des couleurs segment par segment.
- **Dates** : utiliser `date-fns` (avec gestion des jours ouvrés, cf. section 4).

Si l'utilisateur ou l'environnement impose une autre stack, l'adapter mais conserver la logique métier décrite plus bas.

## 3. Modèle de données

### Chantier
- `id`
- `nom`
- `dateDebut`
- `equipe` (nom de l'équipe affectée)
- `dateFinCalculee` (dérivée : date de début + jours ouvrés cumulés de toutes les phases + retards)
- `etat` (dérivé automatiquement, ne pas le stocker en dur) : `A_VENIR` si `dateDebut` > aujourd'hui, `EN_COURS` si aujourd'hui est compris entre `dateDebut` et `dateFinCalculee`, `TERMINE` si aujourd'hui > `dateFinCalculee`.
- relations : `phases[]`, `datesImportantes[]`, `retards[]`

### Phase
- `id`
- `chantierId`
- `type` : enum `DEMOLITION` | `RENOVATION` | `AMENAGEMENT`
- `nombreJoursOuvres`
- `ordre` (les phases s'enchaînent dans l'ordre indiqué, une fiche chantier peut contenir plusieurs phases du même type ou non)
- `dateDebutCalculee` / `dateFinCalculee` (dérivées, calculées séquentiellement à partir de la date de début du chantier)
- Couleur associée fixe par type (voir section 6)

### DateImportante
- `id`
- `chantierId`
- `nom` (libre, ex : "Livraison matériaux", "Passage architecte")
- `date`

### Retard
- `id`
- `chantierId`
- `nombreJours`
- `dateAjout`
- `commentaire` (optionnel)
- Chaque retard ajouté décale la `dateFinCalculee` du chantier du nombre de jours indiqué et s'affiche comme un segment supplémentaire dans le Gantt, dans une couleur dédiée distincte de celles des phases.

## 4. Logique métier — calcul des dates

- La semaine de travail comprend **5 jours ouvrés** (lundi à vendredi). Les samedis et dimanches ne comptent pas dans le décompte des jours de chantier et ne doivent pas apparaître comme des jours travaillés dans le Gantt.
- À la création d'une fiche chantier, l'utilisateur saisit la **date de démarrage** et, pour chaque phase, un **nombre de jours ouvrés**. Les phases s'enchaînent dans l'ordre saisi (la phase 2 démarre le jour ouvré suivant la fin de la phase 1, etc.).
- La **date de fin du chantier** est calculée automatiquement en ajoutant à la date de démarrage la somme des jours ouvrés de toutes les phases, puis en ajoutant les éventuels jours de retard.
- Un **retard** ajouté après coup insère des jours supplémentaires à la fin du planning (ou à l'endroit pertinent) et recalcule la date de fin ainsi que l'affichage du Gantt.
- Le **retard moyen** affiché en page d'accueil est la moyenne du nombre de jours de retard cumulés, calculée sur l'ensemble des chantiers ayant au moins un retard enregistré (à définir précisément avec l'utilisateur si la moyenne doit porter sur tous les chantiers ou seulement ceux en retard).
- La **prochaine date importante** affichée en page d'accueil est celle, parmi toutes les dates importantes de tous les chantiers, dont la date est la plus proche dans le futur ; afficher le nom de cette date et le nombre de jours restants (compte à rebours).

## 5. Écrans à développer

### 5.1 Page principale — "Vue d'ensemble"

- **Header** : logo de l'entreprise en haut à gauche. Sous le header, deux onglets de navigation : **"Vue d'ensemble"** et **"Calendrier Global"**.
- **Widgets récapitulatifs** :
  - Compte à rebours vers la prochaine date importante (nom + jours restants).
  - Nombre de jours de retard moyen, tous chantiers confondus.
- **Récapitulatif des chantiers**, regroupés par état : **"À Venir"**, **"En cours"**, **"Terminé"**.
  - Chaque carte/ligne de chantier affiche : nom du chantier (cliquable → renvoie vers la fiche chantier / Gantt du chantier), les phases avec leur couleur respective, l'équipe assignée, et les dates importantes associées affichées à côté du récapitulatif.
  - Indication visuelle si le chantier a du retard.

### 5.2 Fiche Chantier (création + détail)

Formulaire de création :
- Nom du chantier
- Date de démarrage
- Équipe affectée
- Phases : ajout dynamique d'une ou plusieurs phases parmi Démolition / Rénovation / Aménagement, chacune avec son nombre de jours ouvrés et son ordre. La date de fin du chantier se met à jour automatiquement à l'ajout/modification d'une phase.

Une fois la fiche créée, l'utilisateur doit pouvoir, depuis cette même fiche :
- Ajouter des **dates importantes** (nom + date).
- Ajouter des **retards** (nombre de jours, date d'ajout, commentaire optionnel) qui recalculent la date de fin et ajoutent un segment de couleur dédiée dans le Gantt.
- Consulter le **Gantt du chantier** dans son intégralité (toutes les phases + retards visibles sans troncature — prévoir un scroll horizontal fluide ou un zoom si la durée totale est longue, mais l'utilisateur doit pouvoir accéder à la vue complète du planning).

### 5.3 Onglet "Calendrier Global"

- Vue Gantt regroupant **tous les chantiers**, un chantier par ligne (ou groupé par phases), sur une échelle de temps commune.
- Mêmes couleurs de phases et de retard que dans les fiches individuelles, pour une lecture cohérente.
- Doit rester lisible même avec un grand nombre de chantiers (prévoir tri, filtre par état, ou pagination si nécessaire).

## 6. Code couleur du Gantt

Définir une couleur fixe et distincte pour chaque élément, cohérente sur toute l'application (fiche chantier + calendrier global) :

- Démolition : une couleur (ex. rouge/orangé)
- Rénovation : une couleur (ex. bleu)
- Aménagement : une couleur (ex. vert)
- Retard : une couleur clairement différente des trois précédentes (ex. gris foncé ou motif hachuré), appliquée uniquement aux jours de retard ajoutés à la fin d'une phase/du chantier.

Centraliser ces couleurs dans une seule source (ex. `constants/colors.ts`) pour garantir la cohérence entre tous les composants Gantt.

## 7. Conventions de développement

- Structure de projet Next.js standard (`app/`, `components/`, `lib/`, `prisma/`).
- Toute la logique de calcul de dates (jours ouvrés, enchaînement des phases, retards, état dérivé) doit vivre dans des fonctions pures testables dans `lib/dates.ts`, séparées de l'UI.
- Écrire des tests unitaires pour la logique de calcul de dates (jours ouvrés, cumul de phases, impact des retards, calcul de l'état du chantier, calcul du retard moyen, calcul de la prochaine date importante).
- Le logo est un asset fourni par l'utilisateur : ne pas coder en dur son contenu, prévoir un composant `Logo` qui charge le fichier depuis `public/`.
- Prévoir une base de données locale (SQLite) pour la persistance ; ne pas stocker les données uniquement en mémoire.

## 8. Points à clarifier avec l'utilisateur si besoin

- Le mode de calcul exact du "retard moyen" (sur tous les chantiers ou uniquement ceux en retard).
- Si un chantier peut avoir plusieurs équipes différentes selon les phases, ou une seule équipe pour tout le chantier (la demande initiale mentionne une équipe par chantier).
- Si les jours fériés doivent être exclus du calcul des jours ouvrés en plus des week-ends.
- Format exact du logo fourni (dimensions, format de fichier) une fois transmis par l'utilisateur.
