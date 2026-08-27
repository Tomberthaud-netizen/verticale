import { access } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const CARACTERES_INTERDITS_WINDOWS = /[<>:"/\\|?*\x00-\x1f]/g;

/** Nettoie un nom pour qu'il soit utilisable comme nom de dossier/fichier Windows. */
export function nettoyerNomDossier(nom: string): string {
  const nettoye = nom
    .replace(CARACTERES_INTERDITS_WINDOWS, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[. ]+$/, ""); // Windows interdit les dossiers finissant par un point ou un espace
  return nettoye || "Sans nom";
}

/**
 * Sous-dossier de rangement d'un devis validé : le nom du chantier s'il y en a un, sinon
 * l'adresse du client suivie de son nom.
 */
export function determinerSousDossierDevis(devis: {
  chantierNom: string | null;
  clientNom: string | null;
  clientAdresse: string | null;
}): string {
  if (devis.chantierNom) return nettoyerNomDossier(devis.chantierNom);
  const identifiant = [devis.clientAdresse, devis.clientNom].filter(Boolean).join(" — ");
  return nettoyerNomDossier(identifiant);
}

/** Nom du dossier racine des devis d'une entreprise, sur le Bureau. */
export function determinerDossierEntreprise(entreprise: string): string {
  return `Devis ${nettoyerNomDossier(entreprise)}`;
}

/**
 * Chemin réel du Bureau de l'utilisateur : le dossier "Bureau"/"Desktop" peut être redirigé
 * dans OneDrive (courant sur Windows en français) — on essaie les emplacements usuels dans
 * l'ordre et on retient le premier qui existe déjà.
 */
export async function determinerCheminBureau(): Promise<string> {
  const candidats = [
    path.join(os.homedir(), "OneDrive", "Bureau"),
    path.join(os.homedir(), "Bureau"),
    path.join(os.homedir(), "OneDrive", "Desktop"),
    path.join(os.homedir(), "Desktop"),
  ];
  for (const candidat of candidats) {
    try {
      await access(candidat);
      return candidat;
    } catch {
      // essaie l'emplacement suivant
    }
  }
  return candidats[candidats.length - 1];
}
