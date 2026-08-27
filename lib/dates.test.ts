import { describe, expect, it } from "vitest";
import {
  ajouterJoursOuvres,
  calculerAlertes,
  calculerAvancement,
  calculerDateFinPhases,
  calculerEtatChantier,
  calculerFinPeriode,
  calculerPhases,
  calculerPlanningChantier,
  calculerRetardMoyen,
  estWeekend,
  jourOuvreSuivant,
  jourOuvreSuivantOuMeme,
  trouverProchaineDateImportante,
} from "./dates";

// Lundi 2026-01-05
const LUNDI = new Date(2026, 0, 5);
// Vendredi 2026-01-09
const VENDREDI = new Date(2026, 0, 9);
// Samedi 2026-01-10
const SAMEDI = new Date(2026, 0, 10);
// Dimanche 2026-01-11
const DIMANCHE = new Date(2026, 0, 11);

function d(y: number, m: number, day: number) {
  return new Date(y, m - 1, day);
}

describe("estWeekend", () => {
  it("détecte samedi et dimanche comme week-end", () => {
    expect(estWeekend(SAMEDI)).toBe(true);
    expect(estWeekend(DIMANCHE)).toBe(true);
  });
  it("ne détecte pas les jours de semaine comme week-end", () => {
    expect(estWeekend(LUNDI)).toBe(false);
    expect(estWeekend(VENDREDI)).toBe(false);
  });
});

describe("jourOuvreSuivantOuMeme / jourOuvreSuivant", () => {
  it("renvoie la même date si déjà ouvrée", () => {
    expect(jourOuvreSuivantOuMeme(LUNDI)).toEqual(LUNDI);
  });
  it("avance au lundi si samedi ou dimanche", () => {
    expect(jourOuvreSuivantOuMeme(SAMEDI)).toEqual(d(2026, 1, 12));
    expect(jourOuvreSuivantOuMeme(DIMANCHE)).toEqual(d(2026, 1, 12));
  });
  it("jourOuvreSuivant saute le week-end après un vendredi", () => {
    expect(jourOuvreSuivant(VENDREDI)).toEqual(d(2026, 1, 12));
  });
});

describe("ajouterJoursOuvres", () => {
  it("saute le week-end en ajoutant des jours ouvrés", () => {
    // Lundi + 4 jours ouvrés = vendredi de la même semaine
    expect(ajouterJoursOuvres(LUNDI, 4)).toEqual(VENDREDI);
    // Lundi + 5 jours ouvrés = lundi suivant
    expect(ajouterJoursOuvres(LUNDI, 5)).toEqual(d(2026, 1, 12));
  });
});

describe("calculerFinPeriode", () => {
  it("une période de 5 jours ouvrés démarrant lundi finit le vendredi", () => {
    expect(calculerFinPeriode(LUNDI, 5)).toEqual(VENDREDI);
  });
  it("une période de 1 jour finit le jour même (ouvré)", () => {
    expect(calculerFinPeriode(LUNDI, 1)).toEqual(LUNDI);
  });
  it("une période démarrant un week-end recule au lundi suivant", () => {
    expect(calculerFinPeriode(SAMEDI, 5)).toEqual(d(2026, 1, 16));
  });
});

describe("calculerPhases", () => {
  it("enchaîne deux phases : la seconde démarre le jour ouvré suivant la fin de la première", () => {
    const phases = calculerPhases(LUNDI, [
      { id: "p1", type: "DEMOLITION", nombreJoursOuvres: 5, ordre: 1 },
      { id: "p2", type: "RENOVATION", nombreJoursOuvres: 3, ordre: 2 },
    ]);
    expect(phases[0].dateDebut).toEqual(LUNDI);
    expect(phases[0].dateFin).toEqual(VENDREDI);
    expect(phases[1].dateDebut).toEqual(d(2026, 1, 12)); // lundi suivant
    expect(phases[1].dateFin).toEqual(d(2026, 1, 14)); // mercredi
  });

  it("respecte l'ordre indiqué même si les phases sont désordonnées en entrée", () => {
    const phases = calculerPhases(LUNDI, [
      { id: "p2", type: "AMENAGEMENT", nombreJoursOuvres: 2, ordre: 2 },
      { id: "p1", type: "DEMOLITION", nombreJoursOuvres: 5, ordre: 1 },
    ]);
    expect(phases[0].id).toBe("p1");
    expect(phases[1].id).toBe("p2");
  });
});

describe("calculerDateFinPhases", () => {
  it("calcule la date de fin cumulée de toutes les phases", () => {
    const fin = calculerDateFinPhases(LUNDI, [
      { id: "p1", type: "DEMOLITION", nombreJoursOuvres: 5, ordre: 1 },
      { id: "p2", type: "RENOVATION", nombreJoursOuvres: 5, ordre: 2 },
    ]);
    // p1: lun 5/1 -> ven 9/1 ; p2: lun 12/1 -> ven 16/1
    expect(fin).toEqual(d(2026, 1, 16));
  });
});

describe("calculerPlanningChantier", () => {
  it("sans retard, le planning est identique à calculerPhases et la fin égale la fin des phases", () => {
    const { phases, retards, dateFin } = calculerPlanningChantier(
      LUNDI,
      [{ id: "p1", type: "DEMOLITION", nombreJoursOuvres: 5, ordre: 1 }],
      []
    );
    expect(retards).toEqual([]);
    expect(phases[0].dateDebut).toEqual(LUNDI);
    expect(phases[0].dateFin).toEqual(VENDREDI);
    expect(dateFin).toEqual(VENDREDI);
  });

  it("un retard coupe la phase en cours pile à sa date d'ajout : [avant][retard][reste de la phase]", () => {
    const { phases, retards, dateFin } = calculerPlanningChantier(
      LUNDI,
      [{ id: "p1", type: "DEMOLITION", nombreJoursOuvres: 5, ordre: 1 }],
      [{ id: "r1", nombreJours: 3, dateAjout: d(2026, 1, 7) }] // mercredi, pendant p1 (lun 5 - ven 9)
    );
    // 2 jours déjà faits (lun 5, mar 6) avant le retard, qui démarre pile le mercredi 7 (sa date
    // d'ajout) ; les 3 jours restants de la phase reprennent juste après le retard.
    expect(phases[0].segments).toEqual([
      { dateDebut: d(2026, 1, 5), dateFin: d(2026, 1, 6) },
      { dateDebut: d(2026, 1, 12), dateFin: d(2026, 1, 14) },
    ]);
    expect(phases[0].dateDebut).toEqual(d(2026, 1, 5));
    expect(phases[0].dateFin).toEqual(d(2026, 1, 14));
    expect(retards[0].dateDebut).toEqual(d(2026, 1, 7)); // exactement la date d'ajout
    expect(retards[0].dateFin).toEqual(d(2026, 1, 9));
    expect(dateFin).toEqual(d(2026, 1, 14));
  });

  it("un retard en cours de phase repousse la ou les phases suivantes d'autant de jours", () => {
    const { phases, retards, dateFin } = calculerPlanningChantier(
      LUNDI,
      [
        { id: "p1", type: "DEMOLITION", nombreJoursOuvres: 5, ordre: 1 }, // lun 5 - ven 9
        { id: "p2", type: "RENOVATION", nombreJoursOuvres: 5, ordre: 2 }, // initialement lun 12 - ven 16
      ],
      [{ id: "r1", nombreJours: 2, dateAjout: d(2026, 1, 7) }] // mercredi, pendant p1
    );
    // r1 démarre pile mercredi 7 (2j, jusqu'au jeu 8) ; p1 reprend ven 9 pour ses 3 jours
    // restants (jusqu'au mar 13) ; p2 démarre donc mer 14 au lieu du lun 12 initialement prévu.
    expect(retards[0].dateDebut).toEqual(d(2026, 1, 7));
    expect(retards[0].dateFin).toEqual(d(2026, 1, 8));
    expect(phases[0].segments).toEqual([
      { dateDebut: d(2026, 1, 5), dateFin: d(2026, 1, 6) },
      { dateDebut: d(2026, 1, 9), dateFin: d(2026, 1, 13) },
    ]);
    expect(phases[1].dateDebut).toEqual(d(2026, 1, 14));
    expect(phases[1].dateFin).toEqual(d(2026, 1, 20));
    expect(dateFin).toEqual(d(2026, 1, 20));
  });

  it("un retard ajouté après la fin de toutes les phases s'attache à la dernière, pas à la première", () => {
    const { retards, dateFin } = calculerPlanningChantier(
      LUNDI,
      [
        { id: "p1", type: "DEMOLITION", nombreJoursOuvres: 5, ordre: 1 }, // lun 5 - ven 9
        { id: "p2", type: "RENOVATION", nombreJoursOuvres: 5, ordre: 2 }, // lun 12 - ven 16
      ],
      [{ id: "r1", nombreJours: 3, dateAjout: d(2026, 1, 25) }] // bien après la fin de p2
    );
    expect(retards[0].dateDebut).toEqual(d(2026, 1, 19)); // juste après p2 (lun 19), pas après p1
    expect(retards[0].dateFin).toEqual(d(2026, 1, 21));
    expect(dateFin).toEqual(d(2026, 1, 21));
  });

  it("plusieurs retards sur la même phase se placent chacun pile à sa date d'ajout, dans l'ordre", () => {
    const { phases, retards, dateFin } = calculerPlanningChantier(
      LUNDI,
      [{ id: "p1", type: "DEMOLITION", nombreJoursOuvres: 5, ordre: 1 }], // lun 5 - ven 9
      [
        { id: "r1", nombreJours: 2, dateAjout: d(2026, 1, 6) }, // mardi : 1 jour déjà fait (lun 5)
        { id: "r2", nombreJours: 2, dateAjout: d(2026, 1, 8) }, // jeudi : pile à la reprise de r1
      ]
    );
    expect(retards[0].dateDebut).toEqual(d(2026, 1, 6)); // r1 pile à sa date d'ajout
    expect(retards[0].dateFin).toEqual(d(2026, 1, 7));
    expect(retards[1].dateDebut).toEqual(d(2026, 1, 8)); // r2 pile à sa date d'ajout
    expect(retards[1].dateFin).toEqual(d(2026, 1, 9));
    expect(phases[0].segments).toEqual([
      { dateDebut: d(2026, 1, 5), dateFin: d(2026, 1, 5) }, // le seul jour fait avant r1
      { dateDebut: d(2026, 1, 12), dateFin: d(2026, 1, 15) }, // les 4 jours restants, après r2
    ]);
    expect(dateFin).toEqual(d(2026, 1, 15));
  });
});

describe("calculerEtatChantier", () => {
  const debut = d(2026, 1, 5);
  const fin = d(2026, 1, 16);

  it("A_VENIR si le chantier n'a pas encore démarré", () => {
    expect(calculerEtatChantier(debut, fin, d(2026, 1, 1))).toBe("A_VENIR");
  });
  it("EN_COURS entre le début et la fin (inclus)", () => {
    expect(calculerEtatChantier(debut, fin, d(2026, 1, 5))).toBe("EN_COURS");
    expect(calculerEtatChantier(debut, fin, d(2026, 1, 10))).toBe("EN_COURS");
    expect(calculerEtatChantier(debut, fin, d(2026, 1, 16))).toBe("EN_COURS");
  });
  it("TERMINE après la date de fin", () => {
    expect(calculerEtatChantier(debut, fin, d(2026, 1, 17))).toBe("TERMINE");
  });
});

describe("calculerRetardMoyen", () => {
  it("retourne 0 si aucun chantier n'a de retard", () => {
    expect(calculerRetardMoyen([{ retards: [] }, { retards: [] }])).toBe(0);
  });
  it("moyenne uniquement sur les chantiers ayant au moins un retard", () => {
    const chantiers = [
      { retards: [{ nombreJours: 4 }] },
      { retards: [{ nombreJours: 2 }, { nombreJours: 6 }] },
      { retards: [] },
    ];
    // chantier 1: 4 jours, chantier 2: 8 jours -> moyenne sur 2 chantiers = 6
    expect(calculerRetardMoyen(chantiers)).toBe(6);
  });
});

describe("trouverProchaineDateImportante", () => {
  it("retourne null si aucune date future", () => {
    const result = trouverProchaineDateImportante(
      [{ id: "d1", nom: "Passée", date: d(2026, 1, 1) }],
      d(2026, 1, 5)
    );
    expect(result).toBeNull();
  });

  it("retourne la date future la plus proche avec le nombre de jours restants", () => {
    const result = trouverProchaineDateImportante(
      [
        { id: "d1", nom: "Livraison", date: d(2026, 1, 20) },
        { id: "d2", nom: "Architecte", date: d(2026, 1, 10) },
      ],
      d(2026, 1, 5)
    );
    expect(result?.dateImportante.id).toBe("d2");
    expect(result?.joursRestants).toBe(5);
  });

  it("une date le jour même compte comme 0 jour restant", () => {
    const result = trouverProchaineDateImportante(
      [{ id: "d1", nom: "Aujourd'hui", date: d(2026, 1, 5) }],
      d(2026, 1, 5)
    );
    expect(result?.joursRestants).toBe(0);
  });
});

describe("calculerAvancement", () => {
  const debut = d(2026, 1, 1);
  const fin = d(2026, 1, 11); // 10 jours calendaires

  it("0% avant le début du chantier", () => {
    expect(calculerAvancement(debut, fin, d(2025, 12, 31))).toBe(0);
    expect(calculerAvancement(debut, fin, debut)).toBe(0);
  });

  it("100% une fois la date de fin atteinte ou dépassée", () => {
    expect(calculerAvancement(debut, fin, fin)).toBe(100);
    expect(calculerAvancement(debut, fin, d(2026, 1, 20))).toBe(100);
  });

  it("proportionnel entre le début et la fin", () => {
    expect(calculerAvancement(debut, fin, d(2026, 1, 6))).toBe(50);
  });
});

describe("calculerAlertes", () => {
  const livraison = d(2026, 1, 31);
  const seuils = [
    { id: "a15", joursAvantLivraison: 15 },
    { id: "a7", joursAvantLivraison: 7 },
    { id: "a3", joursAvantLivraison: 3 },
    { id: "a1", joursAvantLivraison: 1 },
  ];

  it("trie les alertes du seuil le plus large au plus proche de la livraison", () => {
    const alertes = calculerAlertes(livraison, seuils, d(2026, 1, 1));
    expect(alertes.map((a) => a.joursAvantLivraison)).toEqual([15, 7, 3, 1]);
  });

  it("calcule la date de déclenchement de chaque seuil", () => {
    const alertes = calculerAlertes(livraison, seuils, d(2026, 1, 1));
    expect(alertes.find((a) => a.joursAvantLivraison === 15)?.dateDeclenchement).toEqual(d(2026, 1, 16));
    expect(alertes.find((a) => a.joursAvantLivraison === 1)?.dateDeclenchement).toEqual(d(2026, 1, 30));
  });

  it("marque une alerte comme déclenchée seulement une fois son seuil atteint", () => {
    // 10 jours avant la livraison : seuil 15 déclenché, pas les autres
    const alertes = calculerAlertes(livraison, seuils, d(2026, 1, 21));
    const parSeuil = Object.fromEntries(alertes.map((a) => [a.joursAvantLivraison, a.declenchee]));
    expect(parSeuil[15]).toBe(true);
    expect(parSeuil[7]).toBe(false);
    expect(parSeuil[3]).toBe(false);
    expect(parSeuil[1]).toBe(false);
  });

  it("toutes les alertes sont déclenchées le jour de la livraison", () => {
    const alertes = calculerAlertes(livraison, seuils, livraison);
    expect(alertes.every((a) => a.declenchee)).toBe(true);
  });
});
