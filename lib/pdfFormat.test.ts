import { describe, expect, it } from "vitest";
import { formaterEurosPdf } from "./pdfFormat";

const CODE_ESPACE_NORMALE = 0x0020;
const CODES_ESPACES_INSECABLES = new Set([0x00a0, 0x202f]);

function neContientAucuneEspaceInsecable(texte: string): boolean {
  return !Array.from(texte).some((c) => CODES_ESPACES_INSECABLES.has(c.codePointAt(0) ?? -1));
}

describe("formaterEurosPdf", () => {
  it("ne contient aucune espace insécable ou espace fine insécable (illisibles dans les polices PDF de base)", () => {
    expect(neContientAucuneEspaceInsecable(formaterEurosPdf(1750))).toBe(true);
  });

  it("sépare les milliers par une espace normale (U+0020)", () => {
    const resultat = formaterEurosPdf(1750);
    const indexEspace = resultat.indexOf("750") - 1;
    expect(resultat.codePointAt(indexEspace)).toBe(CODE_ESPACE_NORMALE);
  });

  it("respecte les options de formatage (ex. sans décimales)", () => {
    expect(formaterEurosPdf(1750, { maximumFractionDigits: 0 })).toContain("1");
    expect(formaterEurosPdf(1750, { maximumFractionDigits: 0 })).not.toContain(",00");
  });

  it("gère les grands montants avec plusieurs séparateurs de milliers sans espace insécable", () => {
    expect(neContientAucuneEspaceInsecable(formaterEurosPdf(1234567.89))).toBe(true);
  });
});
