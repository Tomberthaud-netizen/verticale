export interface EtablissementApiRechercheEntreprises {
  siret: string;
  adresse: string | null;
  code_postal: string | null;
  libelle_commune: string | null;
  numero_voie: string | null;
  type_voie: string | null;
  libelle_voie: string | null;
}

export interface ResultatApiRechercheEntreprises {
  nom_complet: string | null;
  nom_raison_sociale: string | null;
  siege: EtablissementApiRechercheEntreprises;
}

export interface InfosEntrepriseSiret {
  nom: string;
  siret: string;
  adresse: string | null;
  codePostal: string | null;
  ville: string | null;
}

/**
 * Reconstruit une adresse "rue" propre à partir des champs structurés de l'API
 * recherche-entreprises.api.gouv.fr, avec repli sur le champ `adresse` complet (qui inclut
 * déjà code postal + commune) si les champs structurés sont absents.
 */
export function extraireInfosEntreprise(resultat: ResultatApiRechercheEntreprises): InfosEntrepriseSiret {
  const { siege } = resultat;
  const nom = resultat.nom_complet ?? resultat.nom_raison_sociale ?? "";

  const rue = [siege.numero_voie, siege.type_voie, siege.libelle_voie].filter(Boolean).join(" ").trim();

  return {
    nom,
    siret: siege.siret,
    adresse: rue || siege.adresse,
    codePostal: siege.code_postal,
    ville: siege.libelle_commune,
  };
}

/** Ne garde que les chiffres, pour comparer/valider un SIRET saisi avec espaces ou tirets. */
export function nettoyerSiret(siret: string): string {
  return siret.replace(/\D/g, "");
}
