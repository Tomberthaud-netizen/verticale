import React from "react";
import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getChantiers, getFactures } from "@/lib/queries";
import { calculerChantier } from "@/lib/chantier";
import { calculerMontantTVA, calculerTotalTTC } from "@/lib/devis";
import {
  calculerBeneficeReel,
  calculerMontantPaye,
  calculerStatutPaiement,
  estAlerteRetardEncaissement,
  trouverDateEncaissementComplet,
} from "@/lib/factures";
import { STATUT_PAIEMENT_INFO } from "@/constants/factures";
import { aAcces, getPersonneConnectee } from "@/lib/authContext";
import { getEntrepriseActive } from "@/lib/entrepriseActive";
import FinanceDocument from "@/components/pdf/FinanceDocument";

export async function GET() {
  const personne = await getPersonneConnectee();
  if (!personne) return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  const entreprise = await getEntrepriseActive();
  if (!aAcces(personne, "FINANCE", entreprise)) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });

  const [chantiers, factures] = await Promise.all([getChantiers(entreprise), getFactures(entreprise)]);
  const chantiersCalcules = chantiers.map(calculerChantier);

  const facturesCalculees = factures.map((f) => {
    const montantPaye = calculerMontantPaye(f.paiements);
    const montantTVA = calculerMontantTVA(f.montantHT, f.tauxTVA);
    const montantTTC = calculerTotalTTC(f.montantHT, montantTVA);
    const statutPaiement = calculerStatutPaiement(f.statut, montantTTC, montantPaye, f.dateEcheance);
    const dateEncaissement = trouverDateEncaissementComplet(f.paiements, montantTTC);
    const beneficeReel = calculerBeneficeReel(f.montantHT, f.coutRealisationHT);
    const alerte = f.statut !== "ANNULEE" && estAlerteRetardEncaissement(f.dateFacture, montantTTC, montantPaye);
    return {
      nom: f.chantier?.nom ?? f.devis?.intitule ?? f.clientNom ?? f.numero,
      venduHT: f.montantHT,
      coutRealisationHT: f.coutRealisationHT,
      beneficeReel,
      dateFacture: f.dateFacture,
      dateEncaissement,
      statutLabel: STATUT_PAIEMENT_INFO[statutPaiement].label,
      alerte,
      statut: f.statut,
      coutRealisationBrut: f.coutRealisationHT,
    };
  });

  const facturesActives = facturesCalculees.filter((f) => f.statut !== "ANNULEE");
  const ca = facturesActives.reduce((s, f) => s + f.venduHT, 0);
  const beneficePrevisionnel = chantiersCalcules.reduce((s, c) => s + (c.beneficePrevisionnel ?? 0), 0);
  const beneficeReel = facturesActives.reduce((s, f) => s + (f.beneficeReel ?? 0), 0);
  const coutsEngages =
    chantiersCalcules.reduce((s, c) => s + (c.coutReel ?? 0), 0) +
    facturesActives.reduce((s, f) => s + (f.coutRealisationBrut ?? 0), 0);

  const element = React.createElement(FinanceDocument, {
    data: {
      genereLe: new Date(),
      ca,
      beneficePrevisionnel,
      beneficeReel,
      coutsEngages,
      lignes: facturesCalculees,
    },
  }) as unknown as Parameters<typeof renderToBuffer>[0];

  const buffer = await renderToBuffer(element);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="recap-finance-${new Date().toISOString().slice(0, 10)}.pdf"`,
    },
  });
}
