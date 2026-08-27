import { describe, expect, it } from "vitest";
import { calculerEcartChiffrage, calculerResteAFacturer } from "./direction";

describe("calculerEcartChiffrage", () => {
  it("retourne null si l'estimatif est nul", () => {
    expect(calculerEcartChiffrage(0, 500)).toBeNull();
  });

  it("calcule un écart positif (dépassement) en montant et en pourcentage", () => {
    const ecart = calculerEcartChiffrage(1000, 1200);
    expect(ecart?.ecartMontant).toBe(200);
    expect(ecart?.ecartPourcentage).toBe(20);
  });

  it("calcule un écart négatif (économie)", () => {
    const ecart = calculerEcartChiffrage(1000, 800);
    expect(ecart?.ecartMontant).toBe(-200);
    expect(ecart?.ecartPourcentage).toBe(-20);
  });
});

describe("calculerResteAFacturer", () => {
  it("soustrait le montant déjà facturé du total", () => {
    expect(calculerResteAFacturer(1000, 400)).toBe(600);
  });

  it("peut être négatif si le facturé dépasse le total prévu", () => {
    expect(calculerResteAFacturer(1000, 1200)).toBe(-200);
  });
});
