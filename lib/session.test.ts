import { beforeAll, describe, expect, it } from "vitest";
import { creerJetonSession, verifierJetonSession } from "./session";

beforeAll(() => {
  process.env.AUTH_SECRET = "secret-de-test-uniquement";
});

describe("creerJetonSession / verifierJetonSession", () => {
  it("crée un jeton vérifiable qui retourne le bon personneId", async () => {
    const jeton = await creerJetonSession("personne-123", "sid-test");
    const payload = await verifierJetonSession(jeton);
    expect(payload?.personneId).toBe("personne-123");
  });

  it("rejette un jeton absent", async () => {
    expect(await verifierJetonSession(undefined)).toBeNull();
    expect(await verifierJetonSession(null)).toBeNull();
  });

  it("rejette un jeton malformé", async () => {
    expect(await verifierJetonSession("pas-un-jeton-valide")).toBeNull();
  });

  it("rejette un jeton dont la signature a été altérée", async () => {
    const jeton = await creerJetonSession("personne-123", "sid-test");
    const [payload, signature] = jeton.split(".");
    const signatureAlteree = signature.slice(0, -2) + (signature.at(-2) === "A" ? "B" : "A") + signature.at(-1);
    expect(await verifierJetonSession(`${payload}.${signatureAlteree}`)).toBeNull();
  });

  it("ne plante pas sur un jeton contenant des caractères base64 invalides", async () => {
    expect(await verifierJetonSession("abc.signatureInvalide")).toBeNull();
  });

  it("rejette un jeton dont le payload a été altéré (signature ne correspond plus)", async () => {
    const jetonA = await creerJetonSession("personne-A", "sid-a");
    const jetonB = await creerJetonSession("personne-B", "sid-b");
    const [, signatureB] = jetonB.split(".");
    const [payloadA] = jetonA.split(".");
    expect(await verifierJetonSession(`${payloadA}.${signatureB}`)).toBeNull();
  });
});
