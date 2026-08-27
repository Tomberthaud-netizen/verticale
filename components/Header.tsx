import Link from "next/link";
import TopTabs from "./TopTabs";
import LogoutButton from "./LogoutButton";
import EntrepriseSwitcher from "./EntrepriseSwitcher";
import type { PersonneConnectee } from "@/lib/authContext";
import type { Entreprise } from "@/constants/entreprises";
import type { AccesOnglet } from "@prisma/client";

export default function Header({
  personne,
  entrepriseActive,
  ongletsAutorises,
  libelles,
  ordres,
  logos,
}: {
  personne: PersonneConnectee;
  entrepriseActive: Entreprise;
  ongletsAutorises: AccesOnglet[];
  libelles: Record<AccesOnglet, string>;
  ordres: Record<AccesOnglet, number>;
  logos: Record<Entreprise, string | null>;
}) {
  return (
    <header className="bg-surface border-b border-border print:hidden">
      <div className="w-full pl-2 pr-4 sm:pr-6 pt-2 flex items-center justify-between gap-6">
        <EntrepriseSwitcher actif={entrepriseActive} logos={logos} />
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted hidden sm:inline">
            {personne.prenom} {personne.nom}
          </span>
          <LogoutButton />
          {ongletsAutorises.includes("VUE_ENSEMBLE") && (
            <Link
              href="/chantiers/nouveau"
              className="shrink-0 rounded-md bg-accent text-background text-sm font-medium px-4 py-2 hover:opacity-90 transition-opacity"
            >
              + Nouveau chantier
            </Link>
          )}
        </div>
      </div>
      <div className="px-6">
        <TopTabs ongletsAutorises={ongletsAutorises} libelles={libelles} ordres={ordres} />
      </div>
    </header>
  );
}
