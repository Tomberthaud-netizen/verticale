import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import DevisDocument from "@/components/pdf/DevisDocument";
import { chargerIdentiteEntreprisePdf } from "@/lib/pdfEntreprise";

export interface DevisPourPdf {
  numero: string;
  intitule: string;
  entreprise: string;
  clientNom: string | null;
  clientAdresse: string | null;
  clientEmail: string | null;
  clientTelephone: string | null;
  dateDevis: Date;
  validiteJours: number | null;
  tauxTVA: number;
  remiseHT: number;
  colonneTTC: boolean;
  notes: string | null;
  lignes: { designation: string; detail: string | null; unite: string | null; quantite: number; prixUnitaire: number }[];
  chantier: { nom: string } | null;
  responsable: { nom: string; prenom: string; telephone: string | null } | null;
}

/** Génère le PDF d'un devis (même rendu que le téléchargement manuel), réutilisable côté serveur. */
export async function genererPdfDevisBuffer(devis: DevisPourPdf): Promise<Buffer> {
  const { logoDataUri, info } = await chargerIdentiteEntreprisePdf(devis.entreprise);

  // DevisDocument renders a <Document> internally, but react-pdf's types only accept a
  // React.ReactElement<DocumentProps> literally — this cast is the standard workaround.
  const element = React.createElement(DevisDocument, {
    devis: {
      numero: devis.numero,
      intitule: devis.intitule,
      entreprise: devis.entreprise,
      clientNom: devis.clientNom,
      clientAdresse: devis.clientAdresse,
      clientEmail: devis.clientEmail,
      clientTelephone: devis.clientTelephone,
      dateDevis: devis.dateDevis,
      validiteJours: devis.validiteJours,
      tauxTVA: devis.tauxTVA,
      remiseHT: devis.remiseHT,
      colonneTTC: devis.colonneTTC,
      notes: devis.notes,
      lignes: devis.lignes,
      chantierNom: devis.chantier?.nom ?? null,
      responsable: devis.responsable,
    },
    logoDataUri,
    info,
  }) as unknown as Parameters<typeof renderToBuffer>[0];

  return renderToBuffer(element);
}
