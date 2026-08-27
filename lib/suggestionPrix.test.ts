import { describe, expect, it } from "vitest";
import {
  filtrerDesignations,
  fusionnerDesignations,
  trouverMeilleureLigne,
  trouverMeilleureReference,
  type LigneHistorique,
  type ReferenceCatalogue,
} from "./suggestionPrix";

const ligne = (
  designation: string,
  prixUnitaire: number,
  dateDevis: string,
  devisNumero = "VRT-2025-0001"
): LigneHistorique => ({ designation, prixUnitaire, dateDevis: new Date(dateDevis), devisNumero, devisIntitule: "" });

describe("trouverMeilleureLigne", () => {
  it("retourne null si la désignation recherchée est vide", () => {
    expect(trouverMeilleureLigne([ligne("Peinture murs", 40, "2024-01-01")], "  ")).toBeNull();
  });

  it("retourne null si aucune ligne ne correspond", () => {
    expect(trouverMeilleureLigne([ligne("Peinture murs", 40, "2024-01-01")], "Terrassement")).toBeNull();
  });

  it("trouve une correspondance exacte insensible à la casse", () => {
    const lignes = [ligne("Peinture murs", 40, "2024-01-01")];
    expect(trouverMeilleureLigne(lignes, "peinture MURS")?.prixUnitaire).toBe(40);
  });

  it("préfère une correspondance exacte à une correspondance partielle", () => {
    const lignes = [ligne("Peinture murs et plafond", 50, "2024-01-01"), ligne("Peinture murs", 40, "2024-06-01")];
    expect(trouverMeilleureLigne(lignes, "Peinture murs")?.prixUnitaire).toBe(40);
  });

  it("retombe sur une correspondance partielle (inclusion dans un sens ou l'autre)", () => {
    const lignes = [ligne("Peinture murs et plafond", 50, "2024-01-01")];
    expect(trouverMeilleureLigne(lignes, "Peinture murs")?.prixUnitaire).toBe(50);
    expect(trouverMeilleureLigne(lignes, "Peinture murs et plafond salon")?.prixUnitaire).toBe(50);
  });

  it("retient la ligne la plus récente en cas d'égalité", () => {
    const lignes = [ligne("Peinture murs", 40, "2023-01-01"), ligne("Peinture murs", 55, "2025-06-01")];
    expect(trouverMeilleureLigne(lignes, "Peinture murs")?.prixUnitaire).toBe(55);
  });
});

describe("filtrerDesignations", () => {
  const designations = ["Peinture murs", "Peinture plafond", "Terrassement général", "Chape"];

  it("retourne un tableau vide si la recherche est vide", () => {
    expect(filtrerDesignations(designations, "  ")).toEqual([]);
  });

  it("filtre par sous-chaîne insensible à la casse", () => {
    expect(filtrerDesignations(designations, "peint")).toEqual(["Peinture murs", "Peinture plafond"]);
  });

  it("exclut la désignation strictement identique à la recherche", () => {
    expect(filtrerDesignations(designations, "Chape")).toEqual([]);
  });

  it("respecte la limite fournie", () => {
    expect(filtrerDesignations(designations, "e", 2)).toHaveLength(2);
  });
});

const reference = (
  designation: string,
  prixUnitaire: number,
  confiance: ReferenceCatalogue["confiance"],
  dateReference: string | null = null
): ReferenceCatalogue => ({ designation, prixUnitaire, confiance, dateReference: dateReference ? new Date(dateReference) : null, lot: null });

describe("trouverMeilleureReference", () => {
  it("retourne null si la désignation recherchée est vide ou sans correspondance", () => {
    expect(trouverMeilleureReference([reference("Peinture murs", 40, "HAUTE")], "  ")).toBeNull();
    expect(trouverMeilleureReference([reference("Peinture murs", 40, "HAUTE")], "Terrassement")).toBeNull();
  });

  it("préfère la confiance haute à moyenne ou basse", () => {
    const refs = [
      reference("Peinture murs", 30, "BASSE"),
      reference("Peinture murs", 45, "HAUTE"),
      reference("Peinture murs", 38, "MOYENNE"),
    ];
    expect(trouverMeilleureReference(refs, "Peinture murs")?.prixUnitaire).toBe(45);
  });

  it("départage par date la plus récente à confiance égale", () => {
    const refs = [
      reference("Peinture murs", 30, "HAUTE", "2023-01-01"),
      reference("Peinture murs", 45, "HAUTE", "2025-06-01"),
    ];
    expect(trouverMeilleureReference(refs, "Peinture murs")?.prixUnitaire).toBe(45);
  });
});

describe("fusionnerDesignations", () => {
  it("concatène catalogue et historique sans doublon", () => {
    expect(fusionnerDesignations(["Peinture murs", "Chape"], ["Terrassement"])).toEqual([
      "Peinture murs",
      "Chape",
      "Terrassement",
    ]);
  });

  it("donne priorité à l'intitulé du catalogue en cas de doublon insensible à la casse", () => {
    expect(fusionnerDesignations(["Peinture murs"], ["peinture MURS", "Chape"])).toEqual([
      "Peinture murs",
      "Chape",
    ]);
  });
});
