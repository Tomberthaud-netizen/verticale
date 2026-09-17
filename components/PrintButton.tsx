"use client";

import type { Entreprise } from "@/constants/entreprises";
import { formaterDatePourNomFichier } from "@/lib/pdfFormat";

/**
 * `document.title` au moment de l'impression est repris par le navigateur comme nom de fichier
 * suggéré dans la boîte de dialogue "Enregistrer au format PDF" — on le change juste le temps de
 * l'impression pour obtenir "Planning – JJ-MM-AAAA – ENTREPRISE" plutôt que le titre de la page.
 * Important : `window.print()` ne bloque PAS l'exécution dans Chrome (contrairement à
 * Firefox/Safari) — l'aperçu d'impression s'ouvre de façon asynchrone. Remettre le titre
 * d'origine juste après l'appel le remettait donc AVANT que Chrome ait lu le titre modifié, ce
 * qui annulait le nom proposé. On ne le restaure qu'à la fermeture de l'aperçu ("afterprint").
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
    const restaurer = () => {
      document.title = titreOriginal;
      window.removeEventListener("afterprint", restaurer);
    };
    window.addEventListener("afterprint", restaurer);
    window.print();
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
