import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import type { BonCommande, LigneBonCommande, SousTraitant } from "@prisma/client";
import BonCommandeDocument, { type BonCommandeDocumentData } from "@/components/pdf/BonCommandeDocument";
import { chargerIdentiteEntreprisePdf } from "@/lib/pdfEntreprise";

export type BonCommandePourPdf = BonCommande & { sousTraitant: SousTraitant; lignes: LigneBonCommande[] };

/** Données du PDF d'un bon de commande — jamais le diviseur ni les prix du devis d'origine. */
export function construireDonneesPdfBonCommande(bon: BonCommandePourPdf): BonCommandeDocumentData {
  const st = bon.sousTraitant;
  return {
    numero: bon.numero,
    devisNumero: bon.devisNumero,
    intitule: bon.intitule,
    entreprise: bon.entreprise,
    adresse: bon.adresse,
    dateBon: bon.dateBon,
    notes: bon.notes,
    sousTraitant: {
      nom: st.nom,
      contact: [st.contactPrenom, st.contactNom].filter(Boolean).join(" ") || null,
      adresse: [st.adresse, [st.codePostal, st.ville].filter(Boolean).join(" ")].filter(Boolean).join(", ") || null,
      telephone: st.telephone,
      email: st.email,
      siret: st.siret,
    },
    lignes: [...bon.lignes]
      .sort((a, b) => a.ordre - b.ordre)
      .map((l) => ({
        designation: l.designation,
        detail: l.detail,
        unite: l.unite,
        quantite: l.quantite,
        prixUnitaire: l.prixUnitaire,
      })),
  };
}

export async function genererPdfBonCommandeBuffer(bon: BonCommandeDocumentData): Promise<Buffer> {
  const { logoDataUri, info } = await chargerIdentiteEntreprisePdf(bon.entreprise);
  // Même contournement de typage que pour le devis (voir lib/pdfDevis.ts).
  const element = React.createElement(BonCommandeDocument, { bon, logoDataUri, info }) as unknown as Parameters<
    typeof renderToBuffer
  >[0];
  return renderToBuffer(element);
}
