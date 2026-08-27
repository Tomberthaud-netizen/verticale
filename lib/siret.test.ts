import { describe, expect, it } from "vitest";
import { extraireInfosEntreprise, nettoyerSiret, type ResultatApiRechercheEntreprises } from "./siret";

describe("nettoyerSiret", () => {
  it("ne garde que les chiffres", () => {
    expect(nettoyerSiret("552 100 554 00054")).toBe("55210055400054");
    expect(nettoyerSiret("552-100-554-00054")).toBe("55210055400054");
  });
});

describe("extraireInfosEntreprise", () => {
  const base: ResultatApiRechercheEntreprises = {
    nom_complet: "PEUGEOT SA",
    nom_raison_sociale: "PEUGEOT SA",
    siege: {
      siret: "55210055400054",
      adresse: "RTE DE GIZY 78140 VELIZY-VILLACOUBLAY",
      code_postal: "78140",
      libelle_commune: "VELIZY-VILLACOUBLAY",
      numero_voie: null,
      type_voie: null,
      libelle_voie: null,
    },
  };

  it("reconstruit la rue à partir des champs structurés quand disponibles", () => {
    const resultat: ResultatApiRechercheEntreprises = {
      ...base,
      siege: { ...base.siege, numero_voie: "12", type_voie: "RUE", libelle_voie: "DES LILAS" },
    };
    expect(extraireInfosEntreprise(resultat).adresse).toBe("12 RUE DES LILAS");
  });

  it("retombe sur l'adresse complète quand les champs structurés sont absents", () => {
    expect(extraireInfosEntreprise(base).adresse).toBe("RTE DE GIZY 78140 VELIZY-VILLACOUBLAY");
  });

  it("extrait le nom, le siret, le code postal et la ville", () => {
    const infos = extraireInfosEntreprise(base);
    expect(infos.nom).toBe("PEUGEOT SA");
    expect(infos.siret).toBe("55210055400054");
    expect(infos.codePostal).toBe("78140");
    expect(infos.ville).toBe("VELIZY-VILLACOUBLAY");
  });
});
