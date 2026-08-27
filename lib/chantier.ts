import type { Alerte, Chantier, DateImportante, Devis, LigneDevis, LigneFinanciereChantier, Phase, Photo, Retard } from "@prisma/client";
import {
  calculerAlertes,
  calculerAvancement,
  calculerEtatChantier,
  calculerPlanningChantier,
  type AlerteCalculee,
  type EtatChantier,
  type PhaseCalculee,
  type RetardCalcule,
} from "./dates";
import { calculerBeneficePrevisionnel, calculerCoutReel, calculerPrixChantier } from "./finances";
import { calculerMontantTVA, calculerTotalHT, calculerTotalHTNet, calculerTotalTTC } from "./devis";

export type ChantierAvecRelations = Chantier & {
  phases: Phase[];
  datesImportantes: DateImportante[];
  retards: Retard[];
  alertes: Alerte[];
  photos: Photo[];
  devis: (Devis & { lignes: LigneDevis[] })[];
  lignesFinancieres: LigneFinanciereChantier[];
};

export interface CaseFinanciereChantier {
  id: string;
  libelle: string;
  montant: number;
  origine: "MANUELLE" | "DEVIS";
  devisId: string | null;
}

export interface ChantierCalcule {
  id: string;
  nom: string;
  equipe: string;
  adresse: string;
  surfaceM2: number;
  entreprise: string;
  dateDebut: Date;
  dateFinCalculee: Date;
  etat: EtatChantier;
  avancement: number;
  phases: PhaseCalculee[];
  retards: RetardCalcule[];
  datesImportantes: DateImportante[];
  alertes: AlerteCalculee[];
  photos: Photo[];
  prixAchat: number | null;
  casesFinancieres: CaseFinanciereChantier[];
  prixChantier: number | null;
  prixRevente: number | null;
  coutReel: number | null;
  beneficePrevisionnel: number | null;
  paye: boolean;
  datePaiement: Date | null;
  dateLimitePaiement: Date | null;
}

export function calculerChantier(chantier: ChantierAvecRelations): ChantierCalcule {
  const {
    phases: phasesCalculees,
    retards: retardsCalcules,
    dateFin: dateFinCalculee,
  } = calculerPlanningChantier(chantier.dateDebut, chantier.phases, chantier.retards);
  const etat = calculerEtatChantier(chantier.dateDebut, dateFinCalculee);
  const avancement = calculerAvancement(chantier.dateDebut, dateFinCalculee);
  const alertesCalculees = calculerAlertes(dateFinCalculee, chantier.alertes);

  const casesManuelles: CaseFinanciereChantier[] = chantier.lignesFinancieres.map((l) => ({
    id: l.id,
    libelle: l.libelle,
    montant: l.montant,
    origine: "MANUELLE",
    devisId: null,
  }));
  const casesDevis: CaseFinanciereChantier[] = chantier.devis.map((d) => {
    const totalHT = calculerTotalHTNet(calculerTotalHT(d.lignes), d.remiseHT);
    const totalTTC = calculerTotalTTC(totalHT, calculerMontantTVA(totalHT, d.tauxTVA));
    return { id: d.id, libelle: `${d.numero} — ${d.intitule}`, montant: totalTTC, origine: "DEVIS", devisId: d.id };
  });
  const casesFinancieres = [...casesManuelles, ...casesDevis];
  const prixChantier = casesFinancieres.length > 0 ? calculerPrixChantier(casesFinancieres) : null;

  const coutReel = calculerCoutReel(chantier.prixAchat, prixChantier);
  const beneficePrevisionnel = calculerBeneficePrevisionnel(chantier.prixRevente, coutReel);

  return {
    id: chantier.id,
    nom: chantier.nom,
    equipe: chantier.equipe,
    adresse: chantier.adresse,
    surfaceM2: chantier.surfaceM2,
    entreprise: chantier.entreprise,
    dateDebut: chantier.dateDebut,
    dateFinCalculee,
    etat,
    avancement,
    phases: phasesCalculees,
    retards: retardsCalcules,
    datesImportantes: chantier.datesImportantes,
    alertes: alertesCalculees,
    photos: chantier.photos,
    prixAchat: chantier.prixAchat,
    casesFinancieres,
    prixChantier,
    prixRevente: chantier.prixRevente,
    coutReel,
    beneficePrevisionnel,
    paye: chantier.paye,
    datePaiement: chantier.datePaiement,
    dateLimitePaiement: chantier.dateLimitePaiement,
  };
}
