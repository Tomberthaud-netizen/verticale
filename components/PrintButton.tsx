"use client";

import type { Entreprise } from "@/constants/entreprises";
import { formaterDatePourNomFichier } from "@/lib/pdfFormat";

/**
 * `document.title` au moment de l'impression est repris par le navigateur comme nom de fichier
 * suggéré dans la boîte de dialogue "Enregistrer au format PDF" — on le change juste le temps de
 * l'impression pour obtenir "Planning – JJ-MM-AAAA – ENTREPRISE" plutôt que le titre de la page.
 */
export default function PrintButton({
  entreprise,
  label = "Imprimer / Export PDF",
}: {
  entreprise: Entreprise;
  label?: string;
}) {
  function imprimer() {
    const titreOriginal = document.title;
    document.title = `Planning – ${formaterDatePourNomFichier()} – ${entreprise}`;
    window.print();
    document.title = titreOriginal;
  }

  return (
    <button
      type="button"
      onClick={imprimer}
      className="print:hidden shrink-0 rounded-md border border-border text-sm font-medium px-3 py-1.5 hover:bg-background transition-colors"
    >
      {label}
    </button>
  );
}
