import { readFile } from "node:fs/promises";
import path from "node:path";
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import DevisDocument from "@/components/pdf/DevisDocument";
import { prisma } from "@/lib/prisma";
import { ENTREPRISES_INFO, type EntrepriseInfo } from "@/constants/entreprisesInfo";

export interface DevisPourPdf {
  numero: string;
  intitule: string;
  entreprise: string;
  clientNom: string | null;
  clientAdresse: string | null;
  dateDevis: Date;
  validiteJours: number | null;
  tauxTVA: number;
  remiseHT: number;
  notes: string | null;
  lignes: { designation: string; unite: string | null; quantite: number; prixUnitaire: number }[];
  chantier: { nom: string } | null;
  responsable: { nom: string; prenom: string; telephone: string | null } | null;
}

const EXTENSIONS_DATA_URI: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

/** Génère le PDF d'un devis (même rendu que le téléchargement manuel), réutilisable côté serveur. */
export async function genererPdfDevisBuffer(devis: DevisPourPdf): Promise<Buffer> {
  const entrepriseDb = await prisma.entreprise.findUnique({ where: { code: devis.entreprise } });

  let logoDataUri: string | null = null;
  const cheminLogo = entrepriseDb?.logoPath
    ? path.join(process.cwd(), "public", entrepriseDb.logoPath)
    : devis.entreprise === "VERTICALE"
      ? path.join(process.cwd(), "public", "logo.jpg")
      : null;
  if (cheminLogo) {
    try {
      const buffer = await readFile(cheminLogo);
      const extension = path.extname(cheminLogo).toLowerCase();
      const mime = EXTENSIONS_DATA_URI[extension] ?? "image/jpeg";
      logoDataUri = `data:${mime};base64,${buffer.toString("base64")}`;
    } catch {
      logoDataUri = null;
    }
  }

  const infoDefaut = ENTREPRISES_INFO[devis.entreprise] ?? ENTREPRISES_INFO.VERTICALE;
  const info: EntrepriseInfo = entrepriseDb
    ? {
        nom: entrepriseDb.nom,
        tagline: entrepriseDb.tagline ?? undefined,
        adresse: [entrepriseDb.adresse, [entrepriseDb.codePostal, entrepriseDb.ville].filter(Boolean).join(" ")]
          .filter(Boolean)
          .join(", "),
        telephone: entrepriseDb.telephone ?? undefined,
        email: entrepriseDb.email ?? undefined,
        siret: entrepriseDb.siret ?? undefined,
      }
    : infoDefaut;

  // DevisDocument renders a <Document> internally, but react-pdf's types only accept a
  // React.ReactElement<DocumentProps> literally — this cast is the standard workaround.
  const element = React.createElement(DevisDocument, {
    devis: {
      numero: devis.numero,
      intitule: devis.intitule,
      entreprise: devis.entreprise,
      clientNom: devis.clientNom,
      clientAdresse: devis.clientAdresse,
      dateDevis: devis.dateDevis,
      validiteJours: devis.validiteJours,
      tauxTVA: devis.tauxTVA,
      remiseHT: devis.remiseHT,
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
