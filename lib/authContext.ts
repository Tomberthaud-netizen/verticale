import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { AccesOnglet } from "@prisma/client";
import { prisma } from "./prisma";
import { NOM_COOKIE_SESSION, verifierJetonSession } from "./session";
import { getEntrepriseActive } from "./entrepriseActive";
import { ONGLETS_SANS_ENTREPRISE } from "@/constants/acces";
import type { Entreprise } from "@/constants/entreprises";

export interface AccesPersonneItem {
  onglet: AccesOnglet;
  /** null = accès valable pour les deux entreprises. */
  entreprise: Entreprise | null;
}

export interface PersonneConnectee {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  estAdmin: boolean;
  acces: AccesPersonneItem[];
}

export async function getPersonneConnectee(): Promise<PersonneConnectee | null> {
  const magasin = await cookies();
  const jeton = magasin.get(NOM_COOKIE_SESSION)?.value;
  const payload = await verifierJetonSession(jeton);
  if (!payload) return null;

  const personne = await prisma.personne.findUnique({
    where: { id: payload.personneId },
    include: { acces: true },
  });
  if (!personne) return null;

  return {
    id: personne.id,
    nom: personne.nom,
    prenom: personne.prenom,
    email: personne.email,
    estAdmin: personne.estAdmin,
    acces: personne.acces.map((a) => ({ onglet: a.onglet, entreprise: (a.entreprise as Entreprise | null) ?? null })),
  };
}

/**
 * Vrai si la personne a accès à cet onglet. Pour un onglet cloisonné par entreprise
 * (tous sauf CALENDRIER/ADMINISTRATION/CATALOGUE), précise `entreprise` pour vérifier l'accès à
 * cette société précise ; un accès enregistré avec entreprise=null vaut pour les deux.
 */
export function aAcces(personne: PersonneConnectee, onglet: AccesOnglet, entreprise?: Entreprise): boolean {
  const ligne = personne.acces.find((a) => a.onglet === onglet);
  if (!ligne) return false;
  if (ONGLETS_SANS_ENTREPRISE.includes(onglet)) return true;
  if (ligne.entreprise === null || entreprise === undefined) return true;
  return ligne.entreprise === entreprise;
}

/**
 * À appeler en tête d'une page/section protégée : redirige vers /login si personne n'est
 * connectée, ou vers /acces-refuse si elle n'a pas le droit requis pour cet onglet.
 * Pour un onglet cloisonné par entreprise, `entreprise` précise la société concernée
 * (par défaut, l'entreprise actuellement affichée) ; passez-la explicitement pour vérifier
 * l'accès à une ressource précise (ex. un devis CB2B) indépendamment de l'entreprise active.
 */
export async function requireAcces(onglet: AccesOnglet, entreprise?: Entreprise): Promise<PersonneConnectee> {
  const personne = await getPersonneConnectee();
  if (!personne) redirect("/login");
  const entrepriseVerifiee = ONGLETS_SANS_ENTREPRISE.includes(onglet)
    ? undefined
    : entreprise ?? (await getEntrepriseActive());
  if (!aAcces(personne, onglet, entrepriseVerifiee)) redirect("/acces-refuse");
  return personne;
}

/** À appeler pour les actions réservées aux administrateurs (modifier les profils, etc.). */
export async function requireAdmin(): Promise<PersonneConnectee> {
  const personne = await getPersonneConnectee();
  if (!personne) redirect("/login");
  if (!personne.estAdmin) redirect("/acces-refuse");
  return personne;
}
