import { describe, expect, it } from "vitest";
import { determinerDossierEntreprise, determinerSousDossierDevis, nettoyerNomDossier } from "./exportDevis";

describe("nettoyerNomDossier", () => {
  it("remplace les caractères interdits Windows par des espaces", () => {
    expect(nettoyerNomDossier('Client "Test" / Chantier: 1')).toBe("Client Test Chantier 1");
  });

  it("retire les points et espaces finaux (interdits par Windows)", () => {
    expect(nettoyerNomDossier("Nom du dossier. ")).toBe("Nom du dossier");
  });

  it("retombe sur 'Sans nom' si la chaîne est vide après nettoyage", () => {
    expect(nettoyerNomDossier("   ")).toBe("Sans nom");
    expect(nettoyerNomDossier("///")).toBe("Sans nom");
  });
});

describe("determinerSousDossierDevis", () => {
  it("utilise le nom du chantier si présent", () => {
    expect(
      determinerSousDossierDevis({ chantierNom: "Casanova", clientNom: "Dupont", clientAdresse: "12 rue X" })
    ).toBe("Casanova");
  });

  it("utilise l'adresse puis le nom du client si aucun chantier", () => {
    expect(
      determinerSousDossierDevis({ chantierNom: null, clientNom: "Dupont", clientAdresse: "12 rue des Lilas" })
    ).toBe("12 rue des Lilas — Dupont");
  });

  it("gère l'absence de client et de chantier", () => {
    expect(determinerSousDossierDevis({ chantierNom: null, clientNom: null, clientAdresse: null })).toBe("Sans nom");
  });
});

describe("determinerDossierEntreprise", () => {
  it("préfixe le nom de l'entreprise par 'Devis '", () => {
    expect(determinerDossierEntreprise("VERTICALE")).toBe("Devis VERTICALE");
    expect(determinerDossierEntreprise("CB2B")).toBe("Devis CB2B");
  });
});
