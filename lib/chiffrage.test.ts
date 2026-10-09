import { describe, expect, it } from "vitest";
import {
  calculerLignesChiffrage,
  calculerTotalHTChiffrage,
  echelleDepuisPoints,
  mesurePiece,
  mesurerContour,
  perimetreDepuisDimensions,
  posteConcernePiece,
  surfaceDepuisDimensions,
  totauxParLot,
  type PieceCalcul,
  type PosteCalcul,
} from "./chiffrage";

const salon: PieceCalcul = { nom: "Salon", typePiece: "SALON", surfaceM2: 20, perimetreM: 18, hauteurM: 2.5 };
const chambre: PieceCalcul = { nom: "Chambre", typePiece: "CHAMBRE", surfaceM2: 12, perimetreM: 14, hauteurM: 2.5 };
const sdb: PieceCalcul = { nom: "SDB", typePiece: "SALLE_DE_BAIN", surfaceM2: 5, perimetreM: 9, hauteurM: 2.5 };

function poste(p: Partial<PosteCalcul>): PosteCalcul {
  return {
    lot: "Peinture",
    designation: "Peinture murs",
    unite: "M²",
    base: "SURFACE_MURS",
    prixUnitaire: 10,
    typesPieces: "",
    actif: true,
    ordre: 1,
    ...p,
  };
}

describe("dimensions", () => {
  it("calcule surface et périmètre d'une pièce rectangulaire", () => {
    expect(surfaceDepuisDimensions(4.5, 3.2)).toBe(14.4);
    expect(perimetreDepuisDimensions(4.5, 3.2)).toBe(15.4);
  });
});

describe("mesurePiece", () => {
  it("retourne la mesure selon la base", () => {
    expect(mesurePiece(salon, "SURFACE_SOL")).toBe(20);
    expect(mesurePiece(salon, "SURFACE_PLAFOND")).toBe(20);
    expect(mesurePiece(salon, "SURFACE_MURS")).toBe(45);
    expect(mesurePiece(salon, "PERIMETRE")).toBe(18);
    expect(mesurePiece(salon, "FORFAIT_PIECE")).toBe(1);
  });
});

describe("posteConcernePiece", () => {
  it("s'applique à toutes les pièces quand la liste est vide", () => {
    expect(posteConcernePiece({ typesPieces: "" }, "CUISINE")).toBe(true);
  });
  it("se limite aux types listés", () => {
    expect(posteConcernePiece({ typesPieces: "SALON, CHAMBRE" }, "CHAMBRE")).toBe(true);
    expect(posteConcernePiece({ typesPieces: "SALON, CHAMBRE" }, "WC")).toBe(false);
  });
});

describe("calculerLignesChiffrage", () => {
  it("additionne les mesures des pièces concernées et détaille chaque pièce", () => {
    const lignes = calculerLignesChiffrage([salon, chambre, sdb], [poste({ typesPieces: "SALON,CHAMBRE" })]);
    expect(lignes).toHaveLength(1);
    expect(lignes[0].quantite).toBe(45 + 35);
    expect(lignes[0].detail).toBe("Salon 45 M² · Chambre 35 M²");
    expect(lignes[0].prixUnitaire).toBe(10);
  });

  it("compte un forfait par pièce et n'en détaille que le nom", () => {
    const lignes = calculerLignesChiffrage(
      [salon, sdb],
      [poste({ base: "FORFAIT_PIECE", unite: "U", designation: "Bloc-porte", typesPieces: "SALON,SALLE_DE_BAIN" })]
    );
    expect(lignes[0].quantite).toBe(2);
    expect(lignes[0].detail).toBe("Salon · SDB");
  });

  it("ignore les postes inactifs et ceux sans pièce concernée", () => {
    const lignes = calculerLignesChiffrage(
      [salon],
      [poste({ actif: false }), poste({ typesPieces: "CUISINE", designation: "Cuisine" })]
    );
    expect(lignes).toEqual([]);
  });

  it("respecte l'ordre du barème", () => {
    const lignes = calculerLignesChiffrage(
      [salon],
      [poste({ designation: "B", ordre: 2 }), poste({ designation: "A", ordre: 1 })]
    );
    expect(lignes.map((l) => l.designation)).toEqual(["A", "B"]);
  });

  it("n'ajoute aucune ligne sans pièce", () => {
    expect(calculerLignesChiffrage([], [poste({})])).toEqual([]);
  });
});

describe("totaux", () => {
  const lignes = [
    { lot: "Peinture", quantite: 10, prixUnitaire: 5 },
    { lot: "Sols", quantite: 2, prixUnitaire: 100 },
    { lot: "Peinture", quantite: 1, prixUnitaire: 30 },
  ];
  it("calcule le total HT", () => {
    expect(calculerTotalHTChiffrage(lignes)).toBe(280);
  });
  it("regroupe par lot", () => {
    expect(totauxParLot(lignes)).toEqual([
      { lot: "Peinture", totalHT: 80 },
      { lot: "Sols", totalHT: 200 },
    ]);
  });
});

describe("contour sur plan", () => {
  it("déduit l'échelle de deux points", () => {
    expect(echelleDepuisPoints([0, 0], [200, 0], 4)).toBe(50);
    expect(echelleDepuisPoints([0, 0], [0, 0], 4)).toBeNull();
    expect(echelleDepuisPoints([0, 0], [10, 0], 0)).toBeNull();
  });

  it("mesure un rectangle de 4 m × 3 m à 50 px/m", () => {
    const m = mesurerContour(
      [
        [0, 0],
        [200, 0],
        [200, 150],
        [0, 150],
      ],
      50
    );
    expect(m).toEqual({ surfaceM2: 12, perimetreM: 14 });
  });

  it("mesure une pièce en L, quel que soit le sens de tracé", () => {
    const horaire: [number, number][] = [
      [0, 0],
      [200, 0],
      [200, 100],
      [100, 100],
      [100, 200],
      [0, 200],
    ];
    const m1 = mesurerContour(horaire, 100);
    const m2 = mesurerContour([...horaire].reverse(), 100);
    expect(m1).toEqual({ surfaceM2: 3, perimetreM: 8 });
    expect(m2).toEqual(m1);
  });

  it("refuse un contour incomplet ou sans échelle", () => {
    expect(mesurerContour([[0, 0], [1, 1]], 10)).toBeNull();
    expect(
      mesurerContour(
        [
          [0, 0],
          [1, 0],
          [1, 1],
        ],
        0
      )
    ).toBeNull();
  });
});
