import { describe, expect, it } from "vitest";
import {
  calculerMontantFactureDepuisBonCommande,
  calculerPrixUnitaireAvecAugmentation,
  calculerPrixUnitaireBonCommande,
  calculerTotalHTBonCommande,
  estDiviseurValide,
  estPourcentageValide,
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

describe("calculerPrixUnitaireAvecAugmentation", () => {
  it("majore le prix unitaire du pourcentage", () => {
    expect(calculerPrixUnitaireAvecAugmentation(100, 20)).toBe(120);
  });

  it("arrondit au centime", () => {
    expect(calculerPrixUnitaireAvecAugmentation(90.57, 15)).toBe(104.16);
  });

  it("laisse le prix inchangé avec 0 %", () => {
    expect(calculerPrixUnitaireAvecAugmentation(42.5, 0)).toBe(42.5);
  });
});

describe("calculerMontantFactureDepuisBonCommande", () => {
  it("majore chaque ligne puis multiplie par la quantité", () => {
    expect(
      calculerMontantFactureDepuisBonCommande(
        [
          { quantite: 2, prixUnitaire: 100 },
          { quantite: 10, prixUnitaire: 60 },
        ],
        25
      )
    ).toBe(2 * 125 + 10 * 75);
  });

  it("vaut le total du bon de commande avec 0 %", () => {
    expect(calculerMontantFactureDepuisBonCommande([{ quantite: 1, prixUnitaire: 5000 }], 0)).toBe(5000);
  });
});

describe("estPourcentageValide", () => {
  it("accepte 0 et les positifs, refuse négatifs et valeurs non numériques", () => {
    expect(estPourcentageValide(0)).toBe(true);
    expect(estPourcentageValide(12.5)).toBe(true);
    expect(estPourcentageValide(-1)).toBe(false);
    expect(estPourcentageValide(Number.NaN)).toBe(false);
  });
});
