"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { ENTREPRISES, type Entreprise } from "@/constants/entreprises";

const NOM_COOKIE_ENTREPRISE = "verticale_entreprise";

/** Entreprise actuellement affichée (VERTICALE ou CB2B), choisie via le logo dans l'en-tête. */
export async function getEntrepriseActive(): Promise<Entreprise> {
  const magasin = await cookies();
  const valeur = magasin.get(NOM_COOKIE_ENTREPRISE)?.value;
  return (ENTREPRISES as readonly string[]).includes(valeur ?? "") ? (valeur as Entreprise) : "VERTICALE";
}

export async function definirEntrepriseActive(entreprise: Entreprise) {
  if (!ENTREPRISES.includes(entreprise)) throw new Error("Entreprise invalide.");
  const magasin = await cookies();
  magasin.set(NOM_COOKIE_ENTREPRISE, entreprise, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  revalidatePath("/", "layout");
}
