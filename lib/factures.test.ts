import { describe, expect, it } from "vitest";
import {
  calculerBeneficeReel,
  calculerMontantPaye,
  calculerStatutPaiement,
  estAlerteRetardEncaissement,
  genererNumeroFacture,
  trouverDateEncaissementComplet,
  preparerValeursFactureAcompte,
} from "./factures";

describe("genererNumeroFacture", () => {
  it("préfixe selon l'entreprise et incrémente la séquence", () => {
    expect(genererNumeroFacture("VERTICALE", 2026, 0)).toBe("FAC-VRT-2026-0001");
    expect(genererNumeroFacture("CB2B", 2026, 6)).toBe("FAC-CB2B-2026-0007");
  });
});

describe("calculerMontantPaye", () => {
  it("retourne 0 pour une liste vide", () => {
    expect(calculerMontantPaye([])).toBe(0);
  });

  it("additionne les paiements", () => {
    expect(calculerMontantPaye([{ montant: 1000 }, { montant: 500 }])).toBe(1500);
  });
});

describe("calculerStatutPaiement", () => {
  const aujourdHui = new Date("2026-06-15");

  it("retourne ANNULEE quel que soit le paiement", () => {
    expect(calculerStatutPaiement("ANNULEE", 1000, 1000, null, aujourdHui)).toBe("ANNULEE");
  });

  it("retourne PAYEE quand le montant payé couvre le TTC", () => {
    expect(calculerStatutPaiement("EMISE", 1000, 1000, null, aujourdHui)).toBe("PAYEE");
    expect(calculerStatutPaiement("EMISE", 1000, 1200, null, aujourdHui)).toBe("PAYEE");
  });

  it("retourne PARTIELLE quand un acompte a été versé sans solder", () => {
    expect(calculerStatutPaiement("EMISE", 1000, 400, null, aujourdHui)).toBe("PARTIELLE");
  });

  it("retourne EN_RETARD quand l'échéance est dépassée sans paiement", () => {
    expect(calculerStatutPaiement("EMISE", 1000, 0, new Date("2026-06-01"), aujourdHui)).toBe("EN_RETARD");
  });

  it("retourne EMISE sinon", () => {
    expect(calculerStatutPaiement("EMISE", 1000, 0, new Date("2026-07-01"), aujourdHui)).toBe("EMISE");
    expect(calculerStatutPaiement("EMISE", 1000, 0, null, aujourdHui)).toBe("EMISE");
  });
});

describe("calculerBeneficeReel", () => {
  it("retourne null si le coût de réalisation n'est pas renseigné", () => {
    expect(calculerBeneficeReel(1000, null)).toBeNull();
  });

  it("soustrait le coût de réalisation du montant HT", () => {
    expect(calculerBeneficeReel(1000, 600)).toBe(400);
  });

  it("peut être négatif", () => {
    expect(calculerBeneficeReel(1000, 1200)).toBe(-200);
  });
});

describe("trouverDateEncaissementComplet", () => {
  it("retourne null si aucun paiement", () => {
    expect(trouverDateEncaissementComplet([], 1000)).toBeNull();
  });

  it("retourne null si les paiements ne couvrent pas le TTC", () => {
    const paiements = [{ montant: 400, datePaiement: new Date("2026-01-01") }];
    expect(trouverDateEncaissementComplet(paiements, 1000)).toBeNull();
  });

  it("retourne la date du paiement qui solde la facture, en cumulant chronologiquement", () => {
    const paiements = [
      { montant: 400, datePaiement: new Date("2026-01-15") },
      { montant: 600, datePaiement: new Date("2026-02-01") },
    ];
    expect(trouverDateEncaissementComplet(paiements, 1000)).toEqual(new Date("2026-02-01"));
  });

  it("fonctionne même si les paiements sont donnés dans le désordre", () => {
    const paiements = [
      { montant: 600, datePaiement: new Date("2026-02-01") },
      { montant: 400, datePaiement: new Date("2026-01-15") },
    ];
    expect(trouverDateEncaissementComplet(paiements, 1000)).toEqual(new Date("2026-02-01"));
  });
});

describe("estAlerteRetardEncaissement", () => {
  const aujourdHui = new Date("2026-06-15");

  it("ne déclenche pas l'alerte si la facture est déjà payée", () => {
    expect(estAlerteRetardEncaissement(new Date("2026-01-01"), 1000, 1000, aujourdHui)).toBe(false);
  });

  it("ne déclenche pas l'alerte avant le seuil (45 jours)", () => {
    expect(estAlerteRetardEncaissement(new Date("2026-05-15"), 1000, 0, aujourdHui)).toBe(false);
  });

  it("déclenche l'alerte au-delà du seuil pour une facture impayée", () => {
    expect(estAlerteRetardEncaissement(new Date("2026-04-01"), 1000, 0, aujourdHui)).toBe(true);
  });

  it("déclenche l'alerte pour une facture partiellement payée après le seuil", () => {
    expect(estAlerteRetardEncaissement(new Date("2026-04-01"), 1000, 300, aujourdHui)).toBe(true);
  });
});

describe("preparerValeursFactureAcompte", () => {
  const devis = { id: "d1", clientNom: " M. Dupont ", clientAdresse: "12 rue des Lilas, 75012 Paris", tauxTVA: 10 };

  it("reprend client, adresse, TVA du devis et le montant de l'acompte", () => {
    expect(
      preparerValeursFactureAcompte({ devis, chantierId: "c1", chantierAdresse: "autre", montantHT: 5000, notes: " 1er acompte " })
    ).toEqual({
      devisId: "d1",
      chantierId: "c1",
      clientNom: "M. Dupont",
      clientAdresse: "12 rue des Lilas, 75012 Paris",
      montantHT: "5000",
      tauxTVA: "10",
      notes: "1er acompte",
    });
  });

  it("se rabat sur l'adresse du chantier si le devis n'a pas d'adresse client", () => {
    const valeurs = preparerValeursFactureAcompte({
      devis: { ...devis, clientAdresse: null },
      chantierId: "c1",
      chantierAdresse: "3 rue du Chantier",
      montantHT: 250.5,
      notes: null,
    });
    expect(valeurs.clientAdresse).toBe("3 rue du Chantier");
    expect(valeurs.montantHT).toBe("250.5");
    expect(valeurs.notes).toBe("");
  });
});
