import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { SEUILS_ALERTE_DEFAUT } from "./dates";
import type { Entreprise } from "@/constants/entreprises";

/**
 * Création d'un chantier provisoire, sans vérification d'accès : cette fonction est appelée à la
 * fois par l'action serveur authentifiée (app/actions.ts, requireAcces déjà passé) et par le
 * webhook d'import Giraffe360 (app/api/webhooks/giraffe360/[secret]/route.ts, dont l'"auth" est
 * le secret dans l'URL — il n'y a pas de session/cookie utilisateur dans ce contexte).
 */
export interface DonneesChantierProvisoire {
  nom: string;
  nombrePieces?: number | null;
  surfaceM2?: number | null;
  /** Id du projet Giraffe360 d'origine, pour la déduplication (voir schema.prisma). */
  giraffe360ProjectId?: string | null;
}

export async function creerChantierProvisoireEnBase(data: DonneesChantierProvisoire, entreprise: Entreprise) {
  const nom = data.nom.trim();
  if (!nom) throw new Error("Le nom est obligatoire.");
  if (data.surfaceM2 != null && data.surfaceM2 <= 0) {
    throw new Error("La surface (m²) doit être un nombre positif.");
  }
  if (data.nombrePieces != null && (data.nombrePieces <= 0 || !Number.isInteger(data.nombrePieces))) {
    throw new Error("Le nombre de pièces doit être un entier positif.");
  }

  try {
    return await prisma.chantier.create({
      data: {
        nom,
        surfaceM2: data.surfaceM2 ?? 0,
        nombrePieces: data.nombrePieces ?? null,
        giraffe360ProjectId: data.giraffe360ProjectId ?? null,
        entreprise,
        alertes: { create: SEUILS_ALERTE_DEFAUT.map((joursAvantLivraison) => ({ joursAvantLivraison })) },
      },
    });
  } catch (err) {
    // Le webhook Giraffe360 peut renvoyer deux fois la même notification (retry) : la contrainte
    // unique sur giraffe360ProjectId fait échouer la 2e création plutôt que de dupliquer le
    // chantier — on retrouve alors simplement le chantier déjà créé.
    if (
      data.giraffe360ProjectId &&
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      const existant = await prisma.chantier.findUnique({ where: { giraffe360ProjectId: data.giraffe360ProjectId } });
      if (existant) return existant;
    }
    throw err;
  }
}
