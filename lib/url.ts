/** Ajoute `https://` à une URL saisie sans protocole (ex. "www.exemple.fr"), pour que le lien
 * pointe vers le bon site externe plutôt que d'être interprété comme un chemin relatif. */
export function normaliserUrlExterne(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}
