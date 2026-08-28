import Link from "next/link";
import TopTabs from "./TopTabs";
import LogoutButton from "./LogoutButton";
import EntrepriseSwitcher from "./EntrepriseSwitcher";
import MobileMenuButton from "./MobileMenuButton";
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
      <div className="w-full pl-1 pr-2 sm:pl-2 sm:pr-6 pt-2 flex items-center justify-between gap-1.5 sm:gap-6">
        <div className="flex items-center gap-0.5 sm:gap-1 min-w-0 shrink">
          <MobileMenuButton />
          <EntrepriseSwitcher actif={entrepriseActive} logos={logos} />
        </div>
        <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
          <span className="text-sm text-muted hidden md:inline">
            {personne.prenom} {personne.nom}
          </span>
          <LogoutButton />
          {ongletsAutorises.includes("VUE_ENSEMBLE") && (
            <Link
              href="/chantiers/nouveau"
              className="shrink-0 rounded-md bg-accent text-background text-sm font-medium px-2 sm:px-4 py-2 hover:opacity-90 transition-opacity"
            >
              <span className="sm:hidden">+ Chantier</span>
              <span className="hidden sm:inline">+ Nouveau chantier</span>
            </Link>
          )}
        </div>
      </div>
      <div className="px-2 sm:px-6 overflow-x-auto">
        <TopTabs ongletsAutorises={ongletsAutorises} libelles={libelles} ordres={ordres} />
      </div>
    </header>
  );
}
