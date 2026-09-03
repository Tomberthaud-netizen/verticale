import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getChantier, getModeleRenovationParNom, getSousTraitantsNoms } from "@/lib/queries";
import { calculerChantier } from "@/lib/chantier";
import { construireEchelleJoursOuvres, construireReperes, construireSegments } from "@/lib/gantt";
import { ETAT_COLORS, libelleEvenement, EVENEMENT_TYPE_COLORS } from "@/constants/colors";
import GanttChart from "@/components/Gantt/GanttChart";
import DateImportanteForm from "@/components/DateImportanteForm";
import RetardForm from "@/components/RetardForm";
import AlerteForm from "@/components/AlerteForm";
import SupprimerAlerteButton from "@/components/SupprimerAlerteButton";
import PhotoUploadForm from "@/components/PhotoUploadForm";
import PhotoGallery from "@/components/PhotoGallery";
import PrintButton from "@/components/PrintButton";
import AgendaSyncButtons from "@/components/AgendaSyncButtons";
import SupprimerChantierButton from "@/components/SupprimerChantierButton";
import ChantierOnglets from "@/components/ChantierOnglets";
import FinancesForm from "@/components/FinancesForm";
import AdresseChantierPanel from "@/components/AdresseChantierPanel";
import PaiementsSousTraitantPanel from "@/components/PaiementsSousTraitantPanel";
import SousOnglets from "@/components/SousOnglets";
import SousTraitantChantierSelect from "@/components/SousTraitantChantierSelect";
import { aAccesSousOnglet, requireAcces } from "@/lib/authContext";
import type { Entreprise } from "@/constants/entreprises";

export default async function ChantierDetailPage({ params }: PageProps<"/chantiers/[id]">) {
  const { id } = await params;
  const chantier = await getChantier(id);
  if (!chantier) notFound();
  const moi = await requireAcces("VUE_ENSEMBLE", chantier.entreprise as Entreprise);
  const [sousTraitants, modeleRenovation] = await Promise.all([
    getSousTraitantsNoms(chantier.entreprise as Entreprise),
    getModeleRenovationParNom(chantier.equipe),
  ]);

  const calcule = calculerChantier(chantier);
  const montantRenovationSuggere =
    modeleRenovation?.coutMoyenM2 != null ? modeleRenovation.coutMoyenM2 * calcule.surfaceM2 : null;
  const echelle = construireEchelleJoursOuvres(calcule.dateDebut, calcule.dateFinCalculee);
  const segments = construireSegments(calcule);
  const reperes = construireReperes(calcule);
  const etatInfo = ETAT_COLORS[calcule.etat];
  const retardTotal = calcule.retards.reduce((s, r) => s + r.nombreJours, 0);

  const planning = (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">Planning</h2>
        <GanttChart
          echelle={echelle}
          today={new Date()}
          rows={[{ id: calcule.id, label: calcule.nom, segments }]}
          reperes={reperes}
          titre={calcule.nom}
        />
      </section>

      <section className="flex flex-col gap-3 print:hidden">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">Alertes de livraison</h2>
        {calcule.alertes.length > 0 ? (
          <ul className="flex flex-col gap-1.5">
            {calcule.alertes.map((a) => (
              <li
                key={a.id}
                className="flex justify-between items-center border border-border rounded-md px-3 py-2 bg-surface text-sm"
              >
                <span className="flex items-center gap-2">
                  {a.declenchee && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 print:hidden" title="Déclenchée" />
                  )}
                  À {a.joursAvantLivraison} j de la livraison
                  <span className="text-muted">
                    ({format(a.dateDeclenchement, "d MMMM yyyy", { locale: fr })})
                  </span>
                  {a.declenchee && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                      Déclenchée
                    </span>
                  )}
                </span>
                <span className="print:hidden">
                  <SupprimerAlerteButton chantierId={calcule.id} alerteId={a.id} />
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">Aucune alerte configurée.</p>
        )}
        <div className="print:hidden">
          <AlerteForm chantierId={calcule.id} />
        </div>
      </section>

      <section className="flex flex-col gap-3 print:hidden">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">Dates importantes</h2>
        {calcule.datesImportantes.length > 0 ? (
          <ul className="flex flex-col gap-1.5">
            {calcule.datesImportantes.map((d) => (
              <li
                key={d.id}
                className="flex justify-between items-center border border-border rounded-md px-3 py-2 bg-surface text-sm"
              >
                <span className="flex items-center gap-2">
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: EVENEMENT_TYPE_COLORS[d.type].bg,
                      color: EVENEMENT_TYPE_COLORS[d.type].text,
                    }}
                  >
                    {libelleEvenement(d)}
                  </span>
                  {d.nom}
                </span>
                <span className="text-muted">{format(d.date, "d MMMM yyyy", { locale: fr })}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">Aucune date importante pour ce chantier.</p>
        )}
        <div className="print:hidden">
          <DateImportanteForm chantierId={calcule.id} />
        </div>
      </section>

      <section className="flex flex-col gap-3 print:hidden">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">Retards</h2>
        {calcule.retards.length > 0 ? (
          <ul className="flex flex-col gap-1.5">
            {calcule.retards.map((r) => (
              <li
                key={r.id}
                className="flex justify-between items-center border border-border rounded-md px-3 py-2 bg-surface text-sm"
              >
                <span>
                  +{r.nombreJours} j — ajouté le {format(r.dateAjout, "d MMMM yyyy", { locale: fr })}
                  {r.commentaire ? ` — ${r.commentaire}` : ""}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">Aucun retard enregistré.</p>
        )}
        <div className="print:hidden">
          <RetardForm chantierId={calcule.id} />
        </div>
      </section>

      <section className="flex flex-col gap-3 print:hidden">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">Dossier photos</h2>
        <PhotoGallery chantierId={calcule.id} photos={calcule.photos} />
        <PhotoUploadForm chantierId={calcule.id} />
      </section>
    </div>
  );

  const financesInformations = (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">Informations financières</h2>
      <FinancesForm
        chantierId={calcule.id}
        prixAchat={calcule.prixAchat}
        prixRevente={calcule.prixRevente}
        prixChantier={calcule.prixChantier}
        casesFinancieres={calcule.casesFinancieres}
        montantRenovationSuggere={montantRenovationSuggere}
        modeleRenovationNom={modeleRenovation?.nom ?? null}
        surfaceM2={calcule.surfaceM2}
      />
    </section>
  );

  const financesSousTraitant = (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">Paiements sous-traitant</h2>
      <PaiementsSousTraitantPanel chantierId={calcule.id} paiements={calcule.paiementsSousTraitant} />
    </section>
  );

  const finances = aAccesSousOnglet(moi, "CHANTIER_FINANCES") ? (
    <SousOnglets
      onglets={[
        { id: "informations", label: "Informations", content: financesInformations },
        { id: "sous-traitant", label: "Sous-traitant", content: financesSousTraitant },
      ]}
    />
  ) : undefined;

  const adresse = aAccesSousOnglet(moi, "CHANTIER_ADRESSE") ? (
    <section className="max-w-xl">
      <AdresseChantierPanel
        chantierId={calcule.id}
        adresse={calcule.adresse}
        etage={calcule.etage}
        porte={calcule.porte}
        codes={calcule.codes}
        emplacementCles={calcule.emplacementCles}
      />
    </section>
  ) : undefined;

  return (
    <div className="flex flex-col gap-8">
      <Link
        href="/chantiers"
        className="print:hidden self-start text-sm font-medium text-muted hover:text-foreground transition-colors"
      >
        ← Retour
      </Link>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold">{calcule.nom}</h1>
            <span
              className="text-xs font-medium px-2.5 py-1 rounded-full"
              style={{ backgroundColor: etatInfo.bg, color: etatInfo.text }}
            >
              {etatInfo.label}
            </span>
            {retardTotal > 0 && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200">
                +{retardTotal} j de retard
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <PrintButton />
            <SupprimerChantierButton chantierId={calcule.id} nomChantier={calcule.nom} />
          </div>
        </div>
        <p className="text-sm text-muted flex items-center gap-1.5 flex-wrap">
          {calcule.entreprise} · Équipe {calcule.equipe} · {calcule.surfaceM2} m² · du{" "}
          {format(calcule.dateDebut, "d MMMM yyyy", { locale: fr })} au{" "}
          {format(calcule.dateFinCalculee, "d MMMM yyyy", { locale: fr })} · {calcule.avancement}% d&apos;avancement ·{" "}
          <SousTraitantChantierSelect
            chantierId={calcule.id}
            sousTraitantActuel={chantier.sousTraitant}
            sousTraitants={sousTraitants}
          />
        </p>
        <AgendaSyncButtons feedPath={`/api/ics/${calcule.id}`} label="ce chantier" />
      </div>

      <ChantierOnglets
        planning={aAccesSousOnglet(moi, "CHANTIER_PLANNING") ? planning : undefined}
        finances={finances}
        adresse={adresse}
      />
    </div>
  );
}
