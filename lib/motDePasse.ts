import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const LONGUEUR_HASH = 64;

/** Hache un mot de passe avec un sel aléatoire (scrypt). Format stocké : "sel:hash" (hex). */
export function hacherMotDePasse(motDePasse: string): string {
  const sel = randomBytes(16).toString("hex");
  const hash = scryptSync(motDePasse, sel, LONGUEUR_HASH).toString("hex");
  return `${sel}:${hash}`;
}

/** Vérifie un mot de passe en clair contre un hachage stocké, en temps constant. */
export function verifierMotDePasse(motDePasse: string, hachage: string): boolean {
  const [sel, hash] = hachage.split(":");
  if (!sel || !hash) return false;
  const hashStocke = Buffer.from(hash, "hex");
  const hashCalcule = scryptSync(motDePasse, sel, LONGUEUR_HASH);
  if (hashStocke.length !== hashCalcule.length) return false;
  return timingSafeEqual(hashStocke, hashCalcule);
}
