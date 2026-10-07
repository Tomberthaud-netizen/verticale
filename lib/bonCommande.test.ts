import { describe, expect, it } from "vitest";
import {
  calculerPrixUnitaireBonCommande,
  calculerTotalHTBonCommande,
  estDiviseurValide,
  genererNumeroBonCommande,
} from "./bonCommande";

describe("calculerPrixUnitaireBonCommande", () => {
  it("divise le prix unitaire du devis par le diviseur", () => {
    expect(calculerPrixUnitaireBonCommande(150, 1.5)).toBe(100);
  });

  it("arrondit au centime", () => {
    expect(calculerPrixUnitaireBonCommande(135.85, 1.5)).toBe(90.57);
  });

  it("garde le signe d'une ligne de déduction", () => {
    expect(calculerPrixUnitaireBonCommande(-300, 2)).toBe(-150);
  });

  it("laisse le prix inchangé avec un diviseur de 1", () => {
    expect(calculerPrixUnitaireBonCommande(42.5, 1)).toBe(42.5);
  });
});

describe("calculerTotalHTBonCommande", () => {
  it("additionne quantité × prix unitaire de chaque ligne", () => {
    expect(
      calculerTotalHTBonCommande([
        { quantite: 2, prixUnitaire: 50 },
        { quantite: 1, prixUnitaire: -20 },
      ])
    ).toBe(80);
  });
});

describe("estDiviseurValide", () => {
  it("accepte un nombre strictement positif", () => {
    expect(estDiviseurValide(1.3)).toBe(true);
  });

  it("refuse zéro, un négatif et les valeurs non numériques", () => {
    expect(estDiviseurValide(0)).toBe(false);
    expect(estDiviseurValide(-2)).toBe(false);
    expect(estDiviseurValide(Number.NaN)).toBe(false);
    expect(estDiviseurValide(Number.POSITIVE_INFINITY)).toBe(false);
  });
});

describe("genererNumeroBonCommande", () => {
  it("préfixe BC, l'entreprise et incrémente la séquence", () => {
    expect(genererNumeroBonCommande("VERTICALE", 2026, 2)).toBe("BC-VRT-2026-0003");
    expect(genererNumeroBonCommande("CB2B", 2026, 0)).toBe("BC-CB2B-2026-0001");
  });
});
