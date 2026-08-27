import { redirect } from "next/navigation";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { aAcces, getPersonneConnectee } from "@/lib/authContext";
import { getEntrepriseActive } from "@/lib/entrepriseActive";
import { getSidebarReduit } from "@/lib/sidebarState";
import { getEntreprisesInfo, getLibellesEtOrdresOnglets } from "@/lib/queries";
import { ACCES_ONGLETS } from "@/constants/acces";
import type { Entreprise } from "@/constants/entreprises";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const personne = await getPersonneConnectee();
  if (!personne) redirect("/login");
  const [entrepriseActive, sidebarReduit, { libelles, ordres }, entreprises] = await Promise.all([
    getEntrepriseActive(),
    getSidebarReduit(),
    getLibellesEtOrdresOnglets(),
    getEntreprisesInfo(),
  ]);
  const ongletsAutorises = ACCES_ONGLETS.filter((onglet) => aAcces(personne, onglet, entrepriseActive));
  const logos = {
    VERTICALE: entreprises.find((e) => e.code === "VERTICALE")?.logoPath ?? null,
    CB2B: entreprises.find((e) => e.code === "CB2B")?.logoPath ?? null,
  } as Record<Entreprise, string | null>;

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Header
        personne={personne}
        entrepriseActive={entrepriseActive}
        ongletsAutorises={ongletsAutorises}
        libelles={libelles}
        ordres={ordres}
        logos={logos}
      />
      <div className="flex-1 flex min-w-0">
        <Sidebar
          ongletsAutorises={ongletsAutorises}
          libelles={libelles}
          ordres={ordres}
          reduitInitial={sidebarReduit}
        />
        <main className="flex-1 min-w-0 px-6 py-8 print:max-w-none print:px-0 print:py-0">{children}</main>
      </div>
    </div>
  );
}
