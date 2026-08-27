import { describe, expect, it } from "vitest";
import { actualiserPrix, periodeDeDate, trouverIndicePourDate } from "./indiceBT";

describe("periodeDeDate", () => {
  it("formate en YYYY-MM avec zéro-padding", () => {
    expect(periodeDeDate(new Date(2026, 0, 15))).toBe("2026-01");
    expect(periodeDeDate(new Date(2026, 10, 3))).toBe("2026-11");
  });
});

describe("trouverIndicePourDate", () => {
  const indices = [
    { periode: "2023-01", valeur: 128.4 },
    { periode: "2023-06", valeur: 130.3 },
    { periode: "2026-06", valeur: 138.3 },
  ];

  it("retourne null si aucun indice n'est fourni", () => {
    expect(trouverIndicePourDate([], new Date(2026, 0, 1))).toBeNull();
  });

  it("retourne la valeur exacte quand la période existe", () => {
    expect(trouverIndicePourDate(indices, new Date(2023, 0, 20))).toBe(128.4);
  });

  it("retourne la période disponible la plus proche sinon", () => {
    // 2023-03 : à 2 mois de 2023-01 et 3 mois de 2023-06 → la plus proche est 2023-01.
    expect(trouverIndicePourDate(indices, new Date(2023, 2, 1))).toBe(128.4);
    // 2023-05 : à 4 mois de 2023-01 et 1 mois de 2023-06 → la plus proche est 2023-06.
    expect(trouverIndicePourDate(indices, new Date(2023, 4, 1))).toBe(130.3);
  });
});

describe("actualiserPrix", () => {
  it("applique le ratio des indices au prix source", () => {
    expect(actualiserPrix(100, 128.4, 138.3)).toBeCloseTo(107.71, 2);
  });

  it("retourne null si un indice est manquant", () => {
    expect(actualiserPrix(100, null, 138.3)).toBeNull();
    expect(actualiserPrix(100, 128.4, null)).toBeNull();
  });

  it("retourne null si l'indice source est nul (division par zéro)", () => {
    expect(actualiserPrix(100, 0, 138.3)).toBeNull();
  });
});
