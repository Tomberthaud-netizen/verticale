import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import BonCommandeDocument, { type BonCommandeDocumentData } from "@/components/pdf/BonCommandeDocument";
import { chargerIdentiteEntreprisePdf } from "@/lib/pdfEntreprise";

export async function genererPdfBonCommandeBuffer(bon: BonCommandeDocumentData): Promise<Buffer> {
  const { logoDataUri, info } = await chargerIdentiteEntreprisePdf(bon.entreprise);
  // Même contournement de typage que pour le devis (voir lib/pdfDevis.ts).
  const element = React.createElement(BonCommandeDocument, { bon, logoDataUri, info }) as unknown as Parameters<
    typeof renderToBuffer
  >[0];
  return renderToBuffer(element);
}
