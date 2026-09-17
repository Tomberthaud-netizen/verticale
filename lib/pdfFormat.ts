/**
 * Formate un montant en euros pour un document PDF (react-pdf/pdfkit). `Intl.NumberFormat("fr-FR", ...)`
 * insere une espace fine insecable (U+202F) entre les milliers et une espace insecable (U+00A0) avant
 * le symbole monetaire ; les polices de base de react-pdf (Times-Roman, Helvetica) n'ont pas ces
 * glyphes et affichent un caractere de substitution a la place (ex. "1/750,00" au lieu de "1 750,00").
 * On remplace ces espaces speciales par une espace normale (U+0020), qui existe dans toutes les
 * polices de base. Codes construits via fromCharCode pour eviter tout caractere invisible ambigu
 * dans le code source lui-meme.
 */
const ESPACES_INSECABLES = new RegExp(`[${String.fromCharCode(0x00a0)}${String.fromCharCode(0x202f)}]`, "g");

export function formaterEurosPdf(montant: number, options?: Intl.NumberFormatOptions): string {
  const formatte = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", ...options }).format(
    montant
  );
  return formatte.replace(ESPACES_INSECABLES, " ");
}

/**
 * Formate une date en "JJ-MM-AAAA" pour un nom de fichier (le "/" du format fr-FR habituel est
 * interdit dans un nom de fichier Windows).
 */
export function formaterDatePourNomFichier(date: Date = new Date()): string {
  const jour = String(date.getDate()).padStart(2, "0");
  const mois = String(date.getMonth() + 1).padStart(2, "0");
  return `${jour}-${mois}-${date.getFullYear()}`;
}
