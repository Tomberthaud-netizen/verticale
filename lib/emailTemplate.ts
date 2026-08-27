/** Remplace les placeholders {cle} d'un modèle d'e-mail par leur valeur ; laisse tel quel si inconnu. */
export function remplacerPlaceholders(texte: string, valeurs: Record<string, string>): string {
  return texte.replace(/\{(\w+)\}/g, (correspondance, cle: string) => valeurs[cle] ?? correspondance);
}
