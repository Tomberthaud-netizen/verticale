import Link from "next/link";
import { calculerChantier } from "@/lib/chantier";
import { getChantiers } from "@/lib/queries";
import { requireAcces } from "@/lib/authContext";
import { getEntrepriseActive } from "@/lib/entrepriseActive";
import ChantierCard from "@/components/ChantierCard";

const GROUPES = [
  { etat: "EN_COURS" as const, titre: "En cours" },
  { etat: "A_VENIR" as const, titre: "À venir" },
];

export default async function ChantiersVentePage() {
  const entreprise = await getEntrepriseActive();
  await requireAcces("CHANTIERS", entreprise);
  const chantiers = await getChantiers(entreprise);
  const chantiersCalcules = chantiers.map(calculerChantier).filter((c) => c.etat !== "TERMINE");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Chantiers</h1>
        <Link
          href="/chantiers/nouveau"
          className="shrink-0 rounded-md bg-foreground text-background text-sm font-medium px-4 py-2 hover:opacity-90 transition-opacity"
        >
          + Nouveau chantier
        </Link>
      </div>

      {chantiersCalcules.length === 0 && (
        <p className="text-muted text-sm">Aucun chantier en cours ou à venir.</p>
      )}

      {GROUPES.map((groupe) => {
        const items = chantiersCalcules.filter((c) => c.etat === groupe.etat);
        if (items.length === 0) return null;
        return (
          <div key={groupe.etat} className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-muted uppercase tracking-wide">
              {groupe.titre} ({items.length})
            </h3>
            <div className="flex flex-col gap-3">
              {items.map((c) => (
                <ChantierCard key={c.id} chantier={c} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
