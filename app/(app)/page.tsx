import { calculerRetardMoyen, trouverProchaineDateImportante } from "@/lib/dates";
import { calculerChantier } from "@/lib/chantier";
import { getChantiers, getDevisSansChantier } from "@/lib/queries";
import { aAcces, requireAcces } from "@/lib/authContext";
import { getEntrepriseActive } from "@/lib/entrepriseActive";
import StatCard from "@/components/StatCard";
import ChantierCard from "@/components/ChantierCard";
import DevisCard from "@/components/DevisCard";
import Link from "next/link";

const GROUPES = [
  { etat: "EN_COURS" as const, titre: "En cours" },
  { etat: "A_VENIR" as const, titre: "À venir" },
  { etat: "TERMINE" as const, titre: "Terminé" },
];

export default async function HomePage() {
  const personne = await requireAcces("VUE_ENSEMBLE");
  const entreprise = await getEntrepriseActive();
  const peutVoirDevis = aAcces(personne, "DEVIS", entreprise);
  const [chantiers, devisSansChantier] = await Promise.all([
    getChantiers(entreprise),
    peutVoirDevis ? getDevisSansChantier(entreprise) : Promise.resolve([]),
  ]);
  const chantiersCalcules = chantiers.map(calculerChantier);

  const retardMoyen = calculerRetardMoyen(chantiers);

  const toutesDatesImportantes = chantiersCalcules.flatMap((c) =>
    c.datesImportantes.map((d) => ({ id: d.id, nom: `${d.nom} — ${c.nom}`, date: d.date }))
  );
  const prochaineDate = trouverProchaineDateImportante(toutesDatesImportantes);

  const chantiersAvecAlerteActive = chantiersCalcules.filter(
    (c) => c.etat !== "TERMINE" && c.alertes.some((a) => a.declenchee)
  );
  const alertesActives = chantiersAvecAlerteActive.reduce(
    (n, c) => n + c.alertes.filter((a) => a.declenchee).length,
    0
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap gap-4">
        <StatCard
          title="Prochaine date importante"
          value={prochaineDate ? `${prochaineDate.joursRestants} j` : "—"}
          subtitle={prochaineDate ? prochaineDate.dateImportante.nom : "Aucune date à venir"}
        />
        <StatCard
          title="Retard moyen"
          value={`${retardMoyen.toFixed(1)} j`}
          subtitle="Chantiers ayant au moins un retard"
        />
        <StatCard title="Chantiers suivis" value={`${chantiers.length}`} />
        <StatCard
          title="Alertes actives"
          value={`${alertesActives}`}
          subtitle={
            chantiersAvecAlerteActive.length > 0
              ? chantiersAvecAlerteActive.map((c) => c.nom).join(", ")
              : "Aucune alerte en cours"
          }
        />
      </div>

      <section className="flex flex-col gap-6">
        <h2 className="text-lg font-semibold">Chantiers</h2>

        {chantiers.length === 0 && (
          <p className="text-muted text-sm">
            Aucun chantier pour le moment.{" "}
            <Link href="/chantiers/nouveau" className="underline">
              Créez le premier chantier
            </Link>
            .
          </p>
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
      </section>

      {peutVoirDevis && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Devis sans chantier</h2>
          {devisSansChantier.length > 0 ? (
            <div className="flex flex-col gap-3">
              {devisSansChantier.map((devis) => (
                <DevisCard key={devis.id} devis={devis} />
              ))}
            </div>
          ) : (
            <p className="text-muted text-sm">Tous les devis sont liés à un chantier.</p>
          )}
        </section>
      )}
    </div>
  );
}
