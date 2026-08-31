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

export async function geocoderAdresse(adresse: string): Promise<Coordonnees | null> {
  const nettoyee = adresse.trim();
  if (!nettoyee) return null;

  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", nettoyee);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("limit", "1");
    url.searchParams.set("countrycodes", "fr");

    const reponse = await fetch(url, {
      headers: { "User-Agent": "Verticale-SuiviChantiers/1.0 (usage interne)" },
      signal: AbortSignal.timeout(5000),
    });
    if (!reponse.ok) return null;

    const resultats = (await reponse.json()) as { lat: string; lon: string }[];
    const premier = resultats[0];
    if (!premier) return null;

    const latitude = Number(premier.lat);
    const longitude = Number(premier.lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

    return { latitude, longitude };
  } catch {
    return null;
  }
}
