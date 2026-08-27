"use server";

import Anthropic from "@anthropic-ai/sdk";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAcces } from "@/lib/authContext";
import { getEntrepriseActive } from "@/lib/entrepriseActive";
import { htmlVersTexte } from "@/lib/html";
import type { Entreprise } from "@/constants/entreprises";
import { extraireInfosEntreprise, nettoyerSiret, type ResultatApiRechercheEntreprises } from "@/lib/siret";

/** Entreprise propriétaire d'un fournisseur — pour vérifier l'accès à une ressource précise. */
async function entrepriseDuFournisseur(fournisseurId: string): Promise<Entreprise> {
  const fournisseur = await prisma.fournisseur.findUnique({ where: { id: fournisseurId }, select: { entreprise: true } });
  if (!fournisseur) throw new Error("Fournisseur introuvable.");
  return fournisseur.entreprise as Entreprise;
}

export interface FournisseurInput {
  nom: string;
  typesProduit: string[];
  siret?: string;
  contactNom?: string;
  contactPrenom?: string;
  telephone?: string;
  email?: string;
  conditionPaiement?: string;
  adresse?: string;
  codePostal?: string;
  ville?: string;
  pays?: string;
  siteWeb?: string;
  notes?: string;
  actif: boolean;
}

function validerEtNettoyer(data: FournisseurInput) {
  const nom = data.nom.trim();
  if (!nom) throw new Error("Le nom de l'entreprise est obligatoire.");
  const typesProduit = Array.from(new Set(data.typesProduit.map((t) => t.trim()).filter(Boolean)));
  return {
    nom,
    typesProduit,
    siret: data.siret ? nettoyerSiret(data.siret) || null : null,
    contactNom: data.contactNom?.trim() || null,
    contactPrenom: data.contactPrenom?.trim() || null,
    telephone: data.telephone?.trim() || null,
    email: data.email?.trim() || null,
    conditionPaiement: data.conditionPaiement?.trim() || null,
    adresse: data.adresse?.trim() || null,
    codePostal: data.codePostal?.trim() || null,
    ville: data.ville?.trim() || null,
    pays: data.pays?.trim() || "France",
    siteWeb: data.siteWeb?.trim() || null,
    notes: data.notes?.trim() || null,
    actif: data.actif,
  };
}

export async function creerFournisseur(data: FournisseurInput) {
  const entreprise = await getEntrepriseActive();
  await requireAcces("FOURNISSEURS", entreprise);
  const { typesProduit, ...reste } = validerEtNettoyer(data);
  const fournisseur = await prisma.fournisseur.create({
    data: { ...reste, entreprise, typesProduit: { create: typesProduit.map((type) => ({ type })) } },
  });
  revalidatePath("/fournisseurs");
  return { id: fournisseur.id };
}

export async function modifierFournisseur(fournisseurId: string, data: FournisseurInput) {
  await requireAcces("FOURNISSEURS", await entrepriseDuFournisseur(fournisseurId));
  const { typesProduit, ...reste } = validerEtNettoyer(data);
  await prisma.$transaction([
    prisma.fournisseur.update({ where: { id: fournisseurId }, data: reste }),
    prisma.fournisseurType.deleteMany({ where: { fournisseurId } }),
    prisma.fournisseurType.createMany({ data: typesProduit.map((type) => ({ fournisseurId, type })) }),
  ]);
  revalidatePath("/fournisseurs");
  revalidatePath(`/fournisseurs/${fournisseurId}`);
}

export async function basculerActifFournisseur(fournisseurId: string, actif: boolean) {
  await requireAcces("FOURNISSEURS", await entrepriseDuFournisseur(fournisseurId));
  await prisma.fournisseur.update({ where: { id: fournisseurId }, data: { actif } });
  revalidatePath("/fournisseurs");
  revalidatePath(`/fournisseurs/${fournisseurId}`);
}

export async function supprimerFournisseur(fournisseurId: string) {
  await requireAcces("FOURNISSEURS", await entrepriseDuFournisseur(fournisseurId));
  await prisma.fournisseur.delete({ where: { id: fournisseurId } });
  revalidatePath("/fournisseurs");
}

/**
 * Recherche une entreprise par SIRET via l'API publique et gratuite de l'État français
 * (recherche-entreprises.api.gouv.fr), pour pré-remplir la fiche fournisseur.
 */
export async function rechercherEntrepriseParSiret(siretSaisi: string) {
  await requireAcces("FOURNISSEURS");
  const siret = nettoyerSiret(siretSaisi);
  if (siret.length !== 14) {
    throw new Error("Le SIRET doit contenir 14 chiffres.");
  }

  const reponse = await fetch(`https://recherche-entreprises.api.gouv.fr/search?q=${siret}&per_page=1`, {
    headers: { Accept: "application/json" },
  });
  if (!reponse.ok) {
    throw new Error("Le service de recherche d'entreprises est indisponible pour le moment.");
  }
  const donnees = (await reponse.json()) as { results?: ResultatApiRechercheEntreprises[] };
  const resultat = donnees.results?.find((r) => r.siege?.siret === siret) ?? donnees.results?.[0];
  if (!resultat) {
    throw new Error("Aucune entreprise trouvée pour ce SIRET.");
  }

  return extraireInfosEntreprise(resultat);
}

export interface ProduitFournisseurInput {
  designation: string;
  lot?: string;
  unite?: string;
  prixUnitaire: number;
}

function validerProduit(data: ProduitFournisseurInput) {
  const designation = data.designation.trim();
  if (!designation) throw new Error("La désignation est obligatoire.");
  if (!Number.isFinite(data.prixUnitaire) || data.prixUnitaire < 0) {
    throw new Error("Le prix unitaire doit être un nombre positif.");
  }
  return { designation, lot: data.lot?.trim() || null, unite: data.unite?.trim() || null, prixUnitaire: data.prixUnitaire };
}

/** Crée le produit fournisseur ET sa ligne jumelle dans le Catalogue de prix, liées entre elles. */
async function creerProduitEtLigneCatalogue(fournisseurId: string, nomFournisseur: string, data: ProduitFournisseurInput) {
  const { designation, lot, unite, prixUnitaire } = validerProduit(data);
  const prixReference = await prisma.prixReference.create({
    data: {
      designation,
      lot,
      unite,
      prixUnitaire,
      sourceFichier: `Fiche fournisseur : ${nomFournisseur}`,
      confiance: "HAUTE",
    },
  });
  await prisma.produitFournisseur.create({
    data: { fournisseurId, designation, lot, unite, prixUnitaire, prixReferenceId: prixReference.id },
  });
}

/** Ajoute manuellement un produit vendu par le fournisseur ; la ligne apparaît aussitôt dans le Catalogue. */
export async function ajouterProduitFournisseur(fournisseurId: string, data: ProduitFournisseurInput) {
  await requireAcces("FOURNISSEURS", await entrepriseDuFournisseur(fournisseurId));
  const fournisseur = await prisma.fournisseur.findUnique({ where: { id: fournisseurId }, select: { nom: true } });
  if (!fournisseur) throw new Error("Fournisseur introuvable.");
  await creerProduitEtLigneCatalogue(fournisseurId, fournisseur.nom, data);
  revalidatePath(`/fournisseurs/${fournisseurId}`);
  revalidatePath("/catalogue");
}

export async function modifierProduitFournisseur(produitId: string, data: ProduitFournisseurInput) {
  const produit = await prisma.produitFournisseur.findUnique({ where: { id: produitId } });
  if (!produit) throw new Error("Produit introuvable.");
  await requireAcces("FOURNISSEURS", await entrepriseDuFournisseur(produit.fournisseurId));
  const { designation, lot, unite, prixUnitaire } = validerProduit(data);
  await prisma.produitFournisseur.update({ where: { id: produitId }, data: { designation, lot, unite, prixUnitaire } });
  if (produit.prixReferenceId) {
    await prisma.prixReference.update({
      where: { id: produit.prixReferenceId },
      data: { designation, lot, unite, prixUnitaire },
    });
  }
  revalidatePath(`/fournisseurs/${produit.fournisseurId}`);
  revalidatePath("/catalogue");
}

export async function supprimerProduitFournisseur(produitId: string) {
  const produit = await prisma.produitFournisseur.findUnique({ where: { id: produitId } });
  if (!produit) throw new Error("Produit introuvable.");
  await requireAcces("FOURNISSEURS", await entrepriseDuFournisseur(produit.fournisseurId));
  await prisma.produitFournisseur.delete({ where: { id: produitId } });
  if (produit.prixReferenceId) {
    await prisma.prixReference.delete({ where: { id: produit.prixReferenceId } }).catch(() => {});
  }
  revalidatePath(`/fournisseurs/${produit.fournisseurId}`);
  revalidatePath("/catalogue");
}

export interface ProduitFournisseurCandidat {
  designation: string;
  unite?: string;
  prixUnitaire: number;
  lot?: string;
}

/**
 * Lit le site web du fournisseur et fait extraire par l'IA les produits/prestations dont le prix
 * est explicitement affiché sur la page. Ne crée rien : renvoie une liste de candidats à valider
 * (voir confirmerImportProduitsFournisseur) avant tout enregistrement en base.
 */
export async function importerProduitsDepuisSiteWeb(fournisseurId: string): Promise<ProduitFournisseurCandidat[]> {
  await requireAcces("FOURNISSEURS", await entrepriseDuFournisseur(fournisseurId));
  const fournisseur = await prisma.fournisseur.findUnique({ where: { id: fournisseurId }, select: { siteWeb: true } });
  if (!fournisseur) throw new Error("Fournisseur introuvable.");
  if (!fournisseur.siteWeb) throw new Error("Aucun site web renseigné pour ce fournisseur.");
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "Clé API Anthropic manquante : ajoutez ANTHROPIC_API_KEY dans le fichier .env du projet pour activer cet import."
    );
  }

  let url = fournisseur.siteWeb.trim();
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;

  let html: string;
  try {
    const reponse = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; VerticaleBot/1.0; +import catalogue)" },
      signal: AbortSignal.timeout(15000),
    });
    if (!reponse.ok) throw new Error(`le site a répondu avec le statut ${reponse.status}`);
    html = await reponse.text();
  } catch (err) {
    throw new Error(`Impossible de récupérer le site web (${err instanceof Error ? err.message : "erreur inconnue"}).`);
  }

  const texte = htmlVersTexte(html).slice(0, 40000);
  if (!texte.trim()) throw new Error("Aucun contenu exploitable trouvé sur cette page.");

  const client = new Anthropic();
  let reponseIA;
  try {
    reponseIA = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 4096,
      system:
        "Tu extrais une liste de produits ou prestations avec leur prix depuis le contenu texte d'une page web de " +
        "fournisseur du bâtiment (BTP) français. Réponds UNIQUEMENT avec un tableau JSON valide, sans texte autour, " +
        'sans balises markdown. Chaque élément : {"designation": string, "prixUnitaire": number, "unite": string ou null, ' +
        '"lot": string ou null (corps de métier, ex. "Plomberie Sanitaire Chauffage")}. ' +
        "N'invente aucun prix : n'inclus que les produits pour lesquels un prix est explicitement affiché dans le texte. " +
        "Si aucun prix n'est visible, réponds par un tableau vide [].",
      messages: [{ role: "user", content: `Contenu de la page ${url} :\n\n${texte}` }],
    });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      throw new Error("Clé API Anthropic invalide — vérifiez ANTHROPIC_API_KEY dans le fichier .env.");
    }
    if (err instanceof Anthropic.RateLimitError) {
      throw new Error("Service d'extraction temporairement surchargé, réessayez dans quelques instants.");
    }
    if (err instanceof Anthropic.APIError) {
      throw new Error(`Erreur du service d'extraction (${err.status}) : ${err.message}`);
    }
    throw new Error("Erreur inattendue lors de l'appel au service d'extraction.");
  }

  const blocTexte = reponseIA.content.find((b) => b.type === "text");
  if (!blocTexte || blocTexte.type !== "text") throw new Error("Réponse inattendue du service d'extraction.");

  let candidats: unknown;
  try {
    const brut = blocTexte.text
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/, "");
    candidats = JSON.parse(brut);
  } catch {
    throw new Error("La réponse du service d'extraction n'était pas un JSON valide.");
  }
  if (!Array.isArray(candidats)) throw new Error("Format de réponse inattendu du service d'extraction.");

  return candidats
    .filter((c): c is Record<string, unknown> => typeof c === "object" && c !== null)
    .map((c) => ({
      designation: String(c.designation ?? "").trim(),
      unite: c.unite ? String(c.unite).trim() : undefined,
      prixUnitaire: Number(c.prixUnitaire),
      lot: c.lot ? String(c.lot).trim() : undefined,
    }))
    .filter((c) => c.designation && Number.isFinite(c.prixUnitaire) && c.prixUnitaire >= 0)
    .slice(0, 100);
}

/** Enregistre les produits retenus par l'utilisateur après relecture de l'import depuis le site web. */
export async function confirmerImportProduitsFournisseur(fournisseurId: string, produits: ProduitFournisseurCandidat[]) {
  await requireAcces("FOURNISSEURS", await entrepriseDuFournisseur(fournisseurId));
  const fournisseur = await prisma.fournisseur.findUnique({ where: { id: fournisseurId }, select: { nom: true } });
  if (!fournisseur) throw new Error("Fournisseur introuvable.");
  for (const produit of produits) {
    await creerProduitEtLigneCatalogue(fournisseurId, fournisseur.nom, produit);
  }
  revalidatePath(`/fournisseurs/${fournisseurId}`);
  revalidatePath("/catalogue");
}
