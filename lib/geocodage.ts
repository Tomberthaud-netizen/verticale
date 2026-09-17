/**
 * Résout une adresse en coordonnées (latitude/longitude) via Nominatim, le service de geocoding
 * gratuit d'OpenStreetMap — pas de compte ni de clé API à configurer. Respecte sa politique
 * d'usage (https://operations.osmfoundation.org/policies/nominatim/) : un User-Agent identifiable,
 * pas d'appel en rafale (n'est déclenché qu'à la création/modification d'un chantier, jamais en
 * boucle). Un échec (adresse introuvable, service indisponible, délai dépassé) ne doit jamais
 * bloquer l'opération qui l'a déclenché : on retourne simplement `null`.
 */
export interface Coordonnees {
  latitude: number;
  longitude: number;
}

function attendre(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Une tentative unique : renvoie les coordonnées, `null` si l'adresse est franchement introuvable
 * (réponse Nominatim vide — pas la peine de réessayer), ou lève une erreur pour tout échec
 * probablement transitoire (réseau, délai dépassé, 5xx, limite de débit) afin que l'appelant
 * puisse réessayer. */
async function tenterGeocodage(adresse: string): Promise<Coordonnees | null> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", adresse);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "fr");

  const reponse = await fetch(url, {
    headers: { "User-Agent": "Verticale-SuiviChantiers/1.0 (usage interne)" },
    signal: AbortSignal.timeout(5000),
  });
  if (!reponse.ok) throw new Error(`Nominatim a répondu ${reponse.status}`);

  const resultats = (await reponse.json()) as { lat: string; lon: string }[];
  const premier = resultats[0];
  if (!premier) return null;

  const latitude = Number(premier.lat);
  const longitude = Number(premier.lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  return { latitude, longitude };
}

/** 3 tentatives (délais croissants) avant d'abandonner : un chantier créé sans coordonnées reste
 * invisible sur la carte du Calendrier Global sans qu'on comprenne pourquoi, alors qu'une bonne
 * partie des échecs Nominatim ne sont qu'un aléa réseau ou un dépassement de délai ponctuel — voir
 * aussi le bouton "Réessayer la localisation" (AdresseChantierPanel) pour les cas qui persistent
 * malgré tout (adresse ambiguë ou réellement introuvable). */
const DELAIS_RETENTATIVE_MS = [500, 1500];

export async function geocoderAdresse(adresse: string): Promise<Coordonnees | null> {
  const nettoyee = adresse.trim();
  if (!nettoyee) return null;

  for (let tentative = 0; ; tentative++) {
    try {
      return await tenterGeocodage(nettoyee);
    } catch {
      if (tentative >= DELAIS_RETENTATIVE_MS.length) return null;
      await attendre(DELAIS_RETENTATIVE_MS[tentative]);
    }
  }
}
