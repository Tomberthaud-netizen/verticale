import { describe, expect, it } from "vitest";
import {
  calculerBeneficePrevisionnel,
  calculerCoutReel,
  calculerMargePourcentage,
  calculerPrixChantier,
  estEcheancePaiementDepassee,
  formaterMontant,
} from "./finances";

describe("calculerPrixChantier", () => {
  it("retourne 0 pour une liste vide", () => {
    expect(calculerPrixChantier([])).toBe(0);
  });

  it("additionne le montant de chaque case, quelle que soit son origine", () => {
    expect(calculerPrixChantier([{ montant: 1200 }, { montant: 3400.5 }, { montant: 0 }])).toBe(4600.5);
  });
});

describe("calculerCoutReel", () => {
  it("retourne null si rien n'est renseigné", () => {
    expect(calculerCoutReel(null, null)).toBeNull();
    expect(calculerCoutReel(undefined, undefined)).toBeNull();
  });

  it("additionne prix d'achat et prix du chantier quand les deux sont renseignés", () => {
    expect(calculerCoutReel(150000, 45000)).toBe(195000);
  });

  it("traite la valeur manquante comme 0 quand une seule est renseignée", () => {
    expect(calculerCoutReel(150000, null)).toBe(150000);
    expect(calculerCoutReel(null, 45000)).toBe(45000);
  });
});

describe("calculerBeneficePrevisionnel", () => {
  it("retourne null si le prix de revente est manquant", () => {
    expect(calculerBeneficePrevisionnel(null, 195000)).toBeNull();
  });

  it("retourne null si le coût réel est manquant", () => {
    expect(calculerBeneficePrevisionnel(250000, null)).toBeNull();
  });

  it("soustrait le coût réel du prix de revente", () => {
    expect(calculerBeneficePrevisionnel(250000, 195000)).toBe(55000);
  });

  it("peut être négatif (perte prévisionnelle)", () => {
    expect(calculerBeneficePrevisionnel(180000, 195000)).toBe(-15000);
  });
});

describe("calculerMargePourcentage", () => {
  it("retourne null si le CA est nul", () => {
    expect(calculerMargePourcentage(1000, 0)).toBeNull();
  });

  it("calcule le bénéfice réel en pourcentage du CA", () => {
    expect(calculerMargePourcentage(25000, 100000)).toBe(25);
  });

  it("peut être négatif (marge perdue)", () => {
    expect(calculerMargePourcentage(-5000, 100000)).toBe(-5);
  });
});

describe("estEcheancePaiementDepassee", () => {
  const aujourdHui = new Date("2026-06-15");

  it("retourne false si aucune date limite n'est renseignée", () => {
    expect(estEcheancePaiementDepassee(null, false, aujourdHui)).toBe(false);
  });

  it("retourne false si déjà marqué comme encaissé, même en retard", () => {
    expect(estEcheancePaiementDepassee(new Date("2026-01-01"), true, aujourdHui)).toBe(false);
  });

  it("retourne true si la date limite est dépassée et non encaissé", () => {
    expect(estEcheancePaiementDepassee(new Date("2026-06-01"), false, aujourdHui)).toBe(true);
  });

  it("retourne false si la date limite n'est pas encore atteinte", () => {
    expect(estEcheancePaiementDepassee(new Date("2026-07-01"), false, aujourdHui)).toBe(false);
  });
});

describe("formaterMontant", () => {
  it("affiche un tiret si le montant est absent", () => {
    expect(formaterMontant(null)).toBe("—");
    expect(formaterMontant(undefined)).toBe("—");
  });

  it("formate en euros, sans décimales", () => {
    const resultat = formaterMontant(195000);
    expect(resultat).toContain("195");
    expect(resultat).toContain("€");
  });
});
