# Calendrier Excel mensuel

`genererCalendrierExcel.ts` génère un instantané Excel du Calendrier Global (mêmes chantiers,
mêmes couleurs, mêmes segments que l'onglet "Calendrier Global" du site) et le dépose dans
`Bureau/Calendrier Chantier/Calendrier Global - <mois> <année>.xlsx`.

Une tâche planifiée Windows (**"Verticale - Calendrier Excel mensuel"**, visible dans le
Planificateur de tâches) relance ce script automatiquement le 1er de chaque mois à 7h00, via
`run-monthly-export.bat`. Elle ne s'exécute que si une session Windows est ouverte à ce moment-là
(mode "Interactive uniquement") ; sa sortie est journalisée dans `genererCalendrierExcel.log`
(ignoré par git).

## Relancer manuellement

```bash
npx tsx scripts/genererCalendrierExcel.ts
```

## Modifier ou supprimer la tâche planifiée

Depuis une invite PowerShell, dans ce dossier :

```powershell
# Voir son statut / prochaine exécution
schtasks /query /tn "Verticale - Calendrier Excel mensuel" /v /fo list

# Supprimer la tâche
schtasks /delete /tn "Verticale - Calendrier Excel mensuel" /f
```

Ou via l'interface graphique : **Planificateur de tâches** (`taskschd.msc`) → Bibliothèque du
Planificateur de tâches → "Verticale - Calendrier Excel mensuel".
