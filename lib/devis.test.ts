import { describe, expect, it } from "vitest";
import {
  calculerMontantTVA,
  calculerTotalHT,
  calculerTotalHTNet,
  calculerTotalLigne,
  calculerTotalTTC,
  genererNumeroDevis,
} from "./devis";

describe("calculerTotalLigne", () => {
  it("multiplie la quantité par le prix unitaire", () => {
    expect(calculerTotalLigne({ quantite: 12, prixUnitaire: 25 })).toBe(300);
  });

  it("gère les quantités décimales (m²)", () => {
    expect(calculerTotalLigne({ quantite: 2.5, prixUnitaire: 40 })).toBe(100);
  });
});

describe("calculerTotalHT", () => {
  it("retourne 0 pour une liste vide", () => {
    expect(calculerTotalHT([])).toBe(0);
  });

  it("additionne le total de chaque ligne", () => {
    const lignes = [
      { quantite: 10, prixUnitaire: 20 },
      { quantite: 5, prixUnitaire: 100 },
    ];
    expect(calculerTotalHT(lignes)).toBe(700);
  });
});

describe("calculerTotalHTNet", () => {
  it("retourne le total brut si aucune remise", () => {
    expect(calculerTotalHTNet(1000, null)).toBe(1000);
    expect(calculerTotalHTNet(1000, undefined)).toBe(1000);
    expect(calculerTotalHTNet(1000, 0)).toBe(1000);
  });

  it("déduit la remise commerciale du total HT", () => {
    expect(calculerTotalHTNet(1000, 150)).toBe(850);
  });

  it("ne descend jamais sous 0 même si la remise dépasse le total", () => {
    expect(calculerTotalHTNet(100, 500)).toBe(0);
  });
});

describe("calculerMontantTVA", () => {
  it("applique le taux de TVA au total HT", () => {
    expect(calculerMontantTVA(1000, 20)).toBe(200);
  });

  it("gère un taux à 0", () => {
    expect(calculerMontantTVA(1000, 0)).toBe(0);
  });
});

describe("calculerTotalTTC", () => {
  it("additionne le total HT et la TVA", () => {
    expect(calculerTotalTTC(1000, 200)).toBe(1200);
  });
});

describe("genererNumeroDevis", () => {
  it("préfixe selon l'entreprise et incrémente la séquence", () => {
    expect(genererNumeroDevis("VERTICALE", 2026, 0)).toBe("VRT-2026-0001");
    expect(genererNumeroDevis("VERTICALE", 2026, 6)).toBe("VRT-2026-0007");
    expect(genererNumeroDevis("CB2B", 2026, 0)).toBe("CB2B-2026-0001");
  });
});
