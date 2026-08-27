import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { aAcces, getPersonneConnectee } from "@/lib/authContext";
import { getToutLeCataloguePrix, getToutesLesLignesDevisReelles } from "@/lib/queries";

const CONFIANCE_LABELS: Record<string, string> = { HAUTE: "Haute", MOYENNE: "Moyenne", BASSE: "Basse" };

export async function GET() {
  const personne = await getPersonneConnectee();
  if (!personne) return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  if (!aAcces(personne, "CATALOGUE")) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });

  const [catalogue, prixDevisReels] = await Promise.all([getToutLeCataloguePrix(), getToutesLesLignesDevisReelles()]);

  const classeur = new ExcelJS.Workbook();
  classeur.creator = "Verticale";
  classeur.created = new Date();

  const feuilleCatalogue = classeur.addWorksheet("Catalogue (devis PDF)", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  feuilleCatalogue.columns = [
    { header: "Désignation", key: "designation", width: 50 },
    { header: "Lot", key: "lot", width: 24 },
    { header: "Unité", key: "unite", width: 10 },
    { header: "Prix unitaire HT (€)", key: "prixUnitaire", width: 18, style: { numFmt: "#,##0.00" } },
    { header: "Date de référence", key: "dateReference", width: 16, style: { numFmt: "dd/mm/yyyy" } },
    { header: "Fiabilité", key: "confiance", width: 12 },
    { header: "Fichier source", key: "sourceFichier", width: 60 },
  ];
  feuilleCatalogue.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  feuilleCatalogue.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1C1917" } };
  for (const item of catalogue) {
    feuilleCatalogue.addRow({
      designation: item.designation,
      lot: item.lot ?? "",
      unite: item.unite ?? "",
      prixUnitaire: item.prixUnitaire,
      dateReference: item.dateReference ?? "",
      confiance: CONFIANCE_LABELS[item.confiance] ?? item.confiance,
      sourceFichier: item.sourceFichier,
    });
  }
  feuilleCatalogue.autoFilter = { from: "A1", to: "G1" };

  const feuilleDevis = classeur.addWorksheet("Prix issus des devis", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  feuilleDevis.columns = [
    { header: "Désignation", key: "designation", width: 50 },
    { header: "Unité", key: "unite", width: 10 },
    { header: "Prix unitaire HT (€)", key: "prixUnitaire", width: 18, style: { numFmt: "#,##0.00" } },
    { header: "Devis", key: "numero", width: 20 },
    { header: "Date du devis", key: "dateDevis", width: 16, style: { numFmt: "dd/mm/yyyy" } },
  ];
  feuilleDevis.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  feuilleDevis.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1C1917" } };
  for (const ligne of prixDevisReels) {
    feuilleDevis.addRow({
      designation: ligne.designation,
      unite: ligne.unite ?? "",
      prixUnitaire: ligne.prixUnitaire,
      numero: ligne.devis.numero,
      dateDevis: ligne.devis.dateDevis,
    });
  }
  feuilleDevis.autoFilter = { from: "A1", to: "E1" };

  const buffer = await classeur.xlsx.writeBuffer();

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="catalogue-prix-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
