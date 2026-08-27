import { describe, expect, it } from "vitest";
import { calculerMontantEnJeu } from "./affaires";

describe("calculerMontantEnJeu", () => {
  it("retourne 0 pour une liste vide", () => {
    expect(calculerMontantEnJeu([])).toBe(0);
  });

  it("additionne les montants", () => {
    expect(calculerMontantEnJeu([{ montant: 1000 }, { montant: 2000 }, { montant: 500 }])).toBe(3500);
  });
});
