/**
 * Génère un instantané Excel du Calendrier Global (même contenu que l'onglet "Calendrier
 * Global" du site) et le dépose dans le dossier "Calendrier Chantier" du Bureau.
 *
 * Prévu pour tourner une fois par mois via une tâche planifiée Windows (voir
 * scripts/README.md) : chaque exécution produit un fichier daté du mois en cours, formant un
 * historique de l'état du planning mois après mois.
 *
 * Usage : npx tsx scripts/genererCalendrierExcel.ts
 */
import "dotenv/config";
import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import ExcelJS from "exceljs";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getChantiers, getDevisPlanifiesSansChantier } from "../lib/queries";
import { calculerChantier } from "../lib/chantier";
import { calculerFinPeriode } from "../lib/dates";
import { construireEchelleJoursOuvres, construireSegments, positionnerSegment, type GanttSegment } from "../lib/gantt";
import { PHASE_COLORS, RETARD_COLOR, DEVIS_PROJETE_COLOR } from "../constants/colors";
import { determinerCheminBureau, nettoyerNomDossier } from "../lib/exportDevis";
import { prisma } from "../lib/prisma";

interface LigneGantt {
  label: string;
  segments: GanttSegment[];
}

/** Couleurs (fond) pour lesquelles un texte noir est plus lisible qu'un texte blanc. */
const FONDS_CLAIRS = new Set([DEVIS_PROJETE_COLOR.bg]);

function argb(hex: string): string {
  return `FF${hex.replace("#", "").toUpperCase()}`;
}

async function main() {
  const [chantiers, devisPlanifies] = await Promise.all([getChantiers(), getDevisPlanifiesSansChantier()]);

  if (chantiers.length === 0 && devisPlanifies.length === 0) {
    console.log("Aucun chantier ni devis planifié : rien à exporter ce mois-ci.");
    return;
  }

  const chantiersCalcules = chantiers.map(calculerChantier);

  const devisRows: LigneGantt[] = devisPlanifies
    .filter((d) => d.dateDebutPrevisionnelle && d.dureeJoursOuvres)
    .map((d) => {
      const dateDebut = d.dateDebutPrevisionnelle!;
      const dateFin = calculerFinPeriode(dateDebut, d.dureeJoursOuvres!);
      return {
        label: `${d.intitule} (${d.numero})`,
        segments: [
          {
            id: `devis-${d.id}`,
            debut: dateDebut,
            fin: dateFin,
            bg: DEVIS_PROJETE_COLOR.bg,
            border: DEVIS_PROJETE_COLOR.border,
            label: DEVIS_PROJETE_COLOR.label,
          },
        ],
      };
    });

  const lignes: LigneGantt[] = [
    ...chantiersCalcules.map((c) => ({ label: c.nom, segments: construireSegments(c) })),
    ...devisRows,
  ];

  const toutesLesDates = lignes.flatMap((l) => l.segments.flatMap((s) => [s.debut, s.fin]));
  const debutGlobal = toutesLesDates.reduce((min, d) => (d < min ? d : min));
  const finGlobale = toutesLesDates.reduce((max, d) => (d > max ? d : max));
  const echelle = construireEchelleJoursOuvres(debutGlobal, finGlobale);

  const classeur = new ExcelJS.Workbook();
  classeur.creator = "Verticale";
  classeur.created = new Date();
  const feuille = classeur.addWorksheet("Calendrier Global", {
    views: [{ state: "frozen", xSplit: 1, ySplit: 2 }],
  });

  feuille.getColumn(1).width = 34;
  for (let i = 0; i < echelle.length; i++) feuille.getColumn(i + 2).width = 3;

  // Ligne 1 : mois (cellules fusionnées) — Ligne 2 : numéro du jour.
  feuille.getCell(1, 1).value = "Chantier";
  feuille.getCell(1, 1).font = { bold: true };
  let i = 0;
  while (i < echelle.length) {
    const cleMois = format(echelle[i], "yyyy-MM");
    let j = i;
    while (j < echelle.length && format(echelle[j], "yyyy-MM") === cleMois) j++;
    const colDebut = i + 2;
    const colFin = j + 1;
    if (colFin > colDebut) feuille.mergeCells(1, colDebut, 1, colFin);
    const libelleMois = format(echelle[i], "MMMM yyyy", { locale: fr });
    const celluleMois = feuille.getCell(1, colDebut);
    celluleMois.value = libelleMois.charAt(0).toUpperCase() + libelleMois.slice(1);
    celluleMois.alignment = { horizontal: "center" };
    celluleMois.font = { bold: true };
    for (let c = colDebut; c <= colFin; c++) {
      const jourCell = feuille.getCell(2, c);
      jourCell.value = Number(format(echelle[c - 2], "d"));
      jourCell.alignment = { horizontal: "center" };
      jourCell.font = { size: 9 };
    }
    i = j;
  }

  // Une ligne par chantier / devis planifié, avec un segment coloré par phase ou retard.
  lignes.forEach((ligne, idx) => {
    const r = idx + 3;
    const celluleLabel = feuille.getCell(r, 1);
    celluleLabel.value = ligne.label;
    celluleLabel.font = { bold: true };

    for (const segment of ligne.segments) {
      const position = positionnerSegment(echelle, segment.debut, segment.fin);
      if (!position) continue;
      const colDebut = position.startIndex + 2;
      const colFin = position.endIndex + 2;
      if (colFin > colDebut) feuille.mergeCells(r, colDebut, r, colFin);
      const cellule = feuille.getCell(r, colDebut);
      cellule.value = segment.label;
      cellule.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(segment.bg) } };
      cellule.font = { color: { argb: FONDS_CLAIRS.has(segment.bg) ? "FF000000" : "FFFFFFFF" }, size: 9 };
      cellule.alignment = { horizontal: "center", vertical: "middle" };
    }
  });

  // Légende, sous le tableau.
  const ligneLegende = lignes.length + 5;
  feuille.getCell(ligneLegende, 1).value = "Légende :";
  feuille.getCell(ligneLegende, 1).font = { bold: true };
  const entreesLegende = [...Object.values(PHASE_COLORS), RETARD_COLOR, DEVIS_PROJETE_COLOR];
  entreesLegende.forEach((entree, idx) => {
    const cellule = feuille.getCell(ligneLegende + 1 + idx, 1);
    cellule.value = entree.label;
    cellule.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(entree.bg) } };
    cellule.font = { color: { argb: FONDS_CLAIRS.has(entree.bg) ? "FF000000" : "FFFFFFFF" }, bold: true };
  });

  const bureau = await determinerCheminBureau();
  const dossierCible = path.join(bureau, "Calendrier Chantier");
  await mkdir(dossierCible, { recursive: true });
  const nomFichier = nettoyerNomDossier(`Calendrier Global - ${format(new Date(), "MMMM yyyy", { locale: fr })}`) + ".xlsx";
  const cheminFichier = path.join(dossierCible, nomFichier);

  const buffer = await classeur.xlsx.writeBuffer();
  await writeFile(cheminFichier, new Uint8Array(buffer));

  console.log(`Calendrier Excel généré : ${cheminFichier}`);
}

main()
  .catch((err) => {
    console.error("Échec de la génération du calendrier Excel :", err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
