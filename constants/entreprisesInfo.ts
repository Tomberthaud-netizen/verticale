export interface EntrepriseInfo {
  nom: string;
  tagline?: string;
  adresse?: string;
  telephone?: string;
  email?: string;
  siret?: string;
}

/**
 * Coordonnées affichées sur les devis PDF. À compléter ici (adresse, téléphone,
 * e-mail, SIRET) — laissées vides pour ne pas inventer de données d'entreprise ;
 * les lignes vides sont simplement omises du PDF.
 */
export const ENTREPRISES_INFO: Record<string, EntrepriseInfo> = {
  VERTICALE: {
    nom: "Verticale",
    tagline: "Vos espaces immobiliers",
  },
  CB2B: {
    nom: "CB2B",
  },
};
