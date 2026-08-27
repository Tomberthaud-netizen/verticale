import CouleurPrincipaleForm from "./CouleurPrincipaleForm";
import OngletsReglagesForm from "./OngletsReglagesForm";
import type { AccesOnglet } from "@prisma/client";

export default function ReglagesPanel({
  couleurPrincipale,
  libelles,
  ordres,
}: {
  couleurPrincipale: string;
  libelles: Record<AccesOnglet, string>;
  ordres: Record<AccesOnglet, number>;
}) {
  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">Couleur principale</h2>
        <p className="text-xs text-muted -mt-2">
          Couleur d&apos;accentuation utilisée sur les onglets actifs et les boutons principaux.
        </p>
        <CouleurPrincipaleForm couleurActuelle={couleurPrincipale} />
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">Ordre et noms des onglets</h2>
        <p className="text-xs text-muted -mt-2">
          Réorganisez les onglets du menu et personnalisez leur nom affiché (laissez le nom par
          défaut pour ne pas le personnaliser).
        </p>
        <OngletsReglagesForm libelles={libelles} ordres={ordres} />
      </section>
    </div>
  );
}
