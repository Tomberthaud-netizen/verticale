import { describe, expect, it } from "vitest";
import { hacherMotDePasse, verifierMotDePasse } from "./motDePasse";

describe("hacherMotDePasse / verifierMotDePasse", () => {
  it("vérifie correctement le mot de passe original", () => {
    const hash = hacherMotDePasse("MotDePasse123!");
    expect(verifierMotDePasse("MotDePasse123!", hash)).toBe(true);
  });

  it("rejette un mauvais mot de passe", () => {
    const hash = hacherMotDePasse("MotDePasse123!");
    expect(verifierMotDePasse("autre-chose", hash)).toBe(false);
  });

  it("produit un sel différent à chaque appel (hash différent pour le même mot de passe)", () => {
    const hash1 = hacherMotDePasse("identique");
    const hash2 = hacherMotDePasse("identique");
    expect(hash1).not.toBe(hash2);
    expect(verifierMotDePasse("identique", hash1)).toBe(true);
    expect(verifierMotDePasse("identique", hash2)).toBe(true);
  });

  it("rejette un hachage malformé sans planter", () => {
    expect(verifierMotDePasse("x", "hachage-invalide")).toBe(false);
  });
});
