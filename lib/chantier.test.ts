import { describe, expect, it } from "vitest";
import { calculerPaiementsSousTraitant } from "./chantier";

function d(y: number, m: number, day: number) {
  return new Date(y, m - 1, day);
}

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
