import { describe, expect, it } from "vitest";
import { calculerPaiementsSousTraitant, estChantierComplet, type ChantierAvecRelations } from "./chantier";

function d(y: number, m: number, day: number) {
  return new Date(y, m - 1, day);
}

/** Chantier complet minimal, à surcharger dans chaque test de estChantierComplet. */
const chantierBase: ChantierAvecRelations = {
  id: "c1",
  nom: "Rue des Lilas",
  dateDebut: d(2026, 1, 5),
  equipe: "Rénovation complète",
  adresse: "12 rue des Lilas, 91000 Évry",
  latitude: null,
  longitude: null,
  etage: null,
  porte: null,
  codes: null,
  emplacementCles: null,
  surfaceM2: 60,
  nombrePieces: 3,
  giraffe360ProjectId: null,
  description: null,
  entreprise: "VERTICALE",
  retireCarte: false,
  createdAt: d(2026, 1, 1),
  updatedAt: d(2026, 1, 1),
  prixAchat: null,
  prixRevente: null,
  paye: false,
  datePaiement: null,
  dateLimitePaiement: null,
  sousTraitantId: null,
  phases: [{ id: "p1", chantierId: "c1", type: "DEMOLITION", nom: null, nombreJoursOuvres: 5, ordre: 1 }],
  datesImportantes: [],
  retards: [],
  alertes: [],
  photos: [],
  devis: [],
  lignesFinancieres: [],
  paiementsSousTraitant: [],
};

describe("calculerPaiementsSousTraitant", () => {
  it("libelle le premier paiement 'Acompte' et les suivants 'Situation N', triés par date", () => {
    const resultat = calculerPaiementsSousTraitant([
      { id: "p3", chantierId: "c1", montant: 1000, dateAjout: d(2026, 3, 1) },
      { id: "p1", chantierId: "c1", montant: 5000, dateAjout: d(2026, 1, 1) },
      { id: "p2", chantierId: "c1", montant: 2000, dateAjout: d(2026, 2, 1) },
    ]);
    expect(resultat.map((p) => ({ id: p.id, libelle: p.libelle }))).toEqual([
      { id: "p1", libelle: "Acompte" },
      { id: "p2", libelle: "Situation 1" },
      { id: "p3", libelle: "Situation 2" },
    ]);
  });

  it("liste vide donne un résultat vide", () => {
    expect(calculerPaiementsSousTraitant([])).toEqual([]);
  });

  it("un seul paiement est l'Acompte", () => {
    const resultat = calculerPaiementsSousTraitant([
      { id: "p1", chantierId: "c1", montant: 5000, dateAjout: d(2026, 1, 1) },
    ]);
    expect(resultat[0].libelle).toBe("Acompte");
  });
});

describe("estChantierComplet", () => {
  it("un chantier avec date de démarrage et au moins une phase est complet", () => {
    expect(estChantierComplet(chantierBase)).toBe(true);
  });

  it("un chantier provisoire sans date de démarrage n'est pas complet", () => {
    expect(estChantierComplet({ ...chantierBase, dateDebut: null })).toBe(false);
  });

  it("aucune phase n'est pas complet", () => {
    expect(estChantierComplet({ ...chantierBase, phases: [] })).toBe(false);
  });

  it("une équipe ou une adresse vide n'empêche pas d'être complet (champs informatifs, pas structurants — cf. chantiers existants avec adresse restée vide)", () => {
    expect(estChantierComplet({ ...chantierBase, equipe: "", adresse: "" })).toBe(true);
  });
});
