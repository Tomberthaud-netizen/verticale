import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  getBonsCommandeDuDevis,
  getChantiersNoms,
  getDevis,
  getFacturesDuDevis,
  getPersonnesNoms,
  getSousTraitantsNoms,
} from "@/lib/queries";
import {
  calculerMontantTVA,
  calculerTotalHT,
  calculerTotalHTNet,
  calculerTotalLigne,
  calculerTotalLigneTTC,
  calculerTotalTTC,
} from "@/lib/devis";
import { formaterMontantPrecis } from "@/lib/finances";
import SupprimerDevisButton from "@/components/SupprimerDevisButton";
import LierChantierForm from "@/components/LierChantierForm";
import StatutAffaireSelect from "@/components/StatutAffaireSelect";
import SuiviAffaireForm from "@/components/SuiviAffaireForm";
import ChronologieDevis from "@/components/ChronologieDevis";
import DevisValidationActions from "@/components/DevisValidationActions";
import PdfQuickLook from "@/components/PdfQuickLook";
import PlanningDevisForm from "@/components/PlanningDevisForm";
import RetourButton from "@/components/RetourButton";
import SousOnglets from "@/components/SousOnglets";
import CoutsDevisForm from "@/components/CoutsDevisForm";
import BonsCommandePanel from "@/components/BonsCommandePanel";
import FacturesDevisPanel from "@/components/FacturesDevisPanel";
import AdressePopup from "@/components/AdressePopup";
import { requireAcces } from "@/lib/authContext";
import type { Entreprise } from "@/constants/entreprises";

export default async function DevisDetailPage({ params }: PageProps<"/devis/[id]">) {
  const { id } = await params;
  const devis = await getDevis(id);
  if (!devis) notFound();
  const personne = await requireAcces("DEVIS", devis.entreprise as Entreprise);
  const [chantiers, personnes, sousTraitants, bonsCommande, facturesDuDevis] = await Promise.all([
    getChantiersNoms(devis.entreprise as Entreprise),
    getPersonnesNoms(),
    getSousTraitantsNoms(devis.entreprise as Entreprise),
    getBonsCommandeDuDevis(devis.id),
    getFacturesDuDevis(devis.id),
  ]);

  const sousTotalHT = calculerTotalHT(devis.lignes);
  const totalHT = calculerTotalHTNet(sousTotalHT, devis.remiseHT);
  const montantTVA = calculerMontantTVA(totalHT, devis.tauxTVA);
  const totalTTC = calculerTotalTTC(totalHT, montantTVA);

  const devisOnglet = (
    <div className="flex flex-col gap-6">
      <section className="text-sm">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-1">Chantier</h2>
        <LierChantierForm devisId={devis.id} chantiers={chantiers} chantierActuel={devis.chantier} />
      </section>

      {devis.valide && !devis.chantier && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">Planning prévisionnel</h2>
          <p className="text-xs text-muted -mt-2">
            Devis validé sans chantier lié : renseignez une date de début et un délai pour le faire apparaître sur
            le Calendrier Global.
          </p>
          <PlanningDevisForm
            devisId={devis.id}
            dateDebutPrevisionnelle={devis.dateDebutPrevisionnelle}
            dureeJoursOuvres={devis.dureeJoursOuvres}
          />
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">Suivi de l&apos;affaire</h2>
        <SuiviAffaireForm
          devisId={devis.id}
          responsableId={devis.responsableId}
          prochaineActionDate={devis.prochaineActionDate}
          prochaineActionNote={devis.prochaineActionNote}
          personnes={personnes}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">Chronologie</h2>
        <ChronologieDevis devisId={devis.id} evenements={devis.evenements} />
      </section>

      {(devis.clientNom || devis.clientAdresse || devis.clientEmail || devis.clientTelephone) && (
        <section className="text-sm">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-1">Client</h2>
          <p>{devis.clientNom}</p>
          <p className="text-muted">{devis.clientAdresse}</p>
          {devis.clientEmail && <p className="text-muted">{devis.clientEmail}</p>}
          {devis.clientTelephone && <p className="text-muted">{devis.clientTelephone}</p>}
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">Lignes de travaux</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left text-muted border-b border-border">
                <th className="py-2 pr-2 font-medium">Désignation</th>
                <th className="py-2 pr-2 font-medium">Détail</th>
                <th className="py-2 pr-2 font-medium">Unité</th>
                <th className="py-2 pr-2 font-medium text-right">Quantité</th>
                <th className="py-2 pr-2 font-medium text-right">PU</th>
                <th className={`py-2 font-medium text-right ${devis.colonneTTC ? "pr-2" : "pr-0"}`}>Total HT</th>
                {devis.colonneTTC && <th className="py-2 pr-0 font-medium text-right">Total TTC</th>}
              </tr>
            </thead>
            <tbody>
              {devis.lignes.map((ligne) => (
                <tr key={ligne.id} className="border-b border-border">
                  <td className="py-2 pr-2">{ligne.designation}</td>
                  <td className="py-2 pr-2 text-muted whitespace-pre-wrap">{ligne.detail ?? "—"}</td>
                  <td className="py-2 pr-2 text-muted">{ligne.unite ?? "—"}</td>
                  <td className="py-2 pr-2 text-right tabular-nums">{ligne.quantite}</td>
                  <td className="py-2 pr-2 text-right tabular-nums">{formaterMontantPrecis(ligne.prixUnitaire)}</td>
                  <td className={`py-2 text-right tabular-nums ${devis.colonneTTC ? "pr-2" : "pr-0"}`}>
                    {formaterMontantPrecis(calculerTotalLigne(ligne))}
                  </td>
                  {devis.colonneTTC && (
                    <td className="py-2 pr-0 text-right tabular-nums">
                      {formaterMontantPrecis(calculerTotalLigneTTC(ligne, devis.tauxTVA))}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex flex-wrap gap-4 max-w-xl self-end">
        {devis.remiseHT > 0 && (
          <>
            <div className="bg-surface border border-border rounded-lg p-4 flex-1 min-w-[140px]">
              <p className="text-sm text-muted font-medium">Sous-total HT</p>
              <p className="text-xl font-semibold mt-1">{formaterMontantPrecis(sousTotalHT)}</p>
            </div>
            <div className="bg-surface border border-border rounded-lg p-4 flex-1 min-w-[140px]">
              <p className="text-sm text-muted font-medium">Remise commerciale</p>
              <p className="text-xl font-semibold mt-1 text-red-600">-{formaterMontantPrecis(devis.remiseHT)}</p>
            </div>
          </>
        )}
        <div className="bg-surface border border-border rounded-lg p-4 flex-1 min-w-[140px]">
          <p className="text-sm text-muted font-medium">Total HT</p>
          <p className="text-xl font-semibold mt-1">{formaterMontantPrecis(totalHT)}</p>
        </div>
        <div className="bg-surface border border-border rounded-lg p-4 flex-1 min-w-[140px]">
          <p className="text-sm text-muted font-medium">TVA ({devis.tauxTVA}%)</p>
          <p className="text-xl font-semibold mt-1">{formaterMontantPrecis(montantTVA)}</p>
        </div>
        <div className="bg-surface border border-border rounded-lg p-4 flex-1 min-w-[140px]">
          <p className="text-sm text-muted font-medium">Total TTC</p>
          <p className="text-xl font-semibold mt-1">{formaterMontantPrecis(totalTTC)}</p>
        </div>
      </div>

      {devis.notes && (
        <section className="text-sm">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-1">Notes</h2>
          <p className="whitespace-pre-wrap text-muted">{devis.notes}</p>
        </section>
      )}

      <FacturesDevisPanel
        facturesPreparees={facturesDuDevis.facturesPreparees.map((b) => ({
          id: b.id,
          montantHT: b.montantHT,
          notes: b.notes,
          sousTraitantNom: b.paiement.sousTraitant.nom,
          dateAcompte: b.paiement.dateAjout,
        }))}
        factures={facturesDuDevis.factures}
      />

      <BonsCommandePanel
        devisId={devis.id}
        sousTraitants={sousTraitants}
        lignesDevis={devis.lignes.map((l) => ({ quantite: l.quantite, prixUnitaire: l.prixUnitaire }))}
        bons={bonsCommande.map((b) => ({
          id: b.id,
          numero: b.numero,
          sousTraitantNom: b.sousTraitant.nom,
          diviseur: b.diviseur,
          dateBon: b.dateBon,
          lignes: b.lignes,
        }))}
      />

      <DevisValidationActions devisId={devis.id} valide={devis.valide} envoiMail={{ clientEmail: devis.clientEmail }} />
    </div>
  );

  const coutsOnglet = (
    <CoutsDevisForm
      devisId={devis.id}
      coutMateriauxHT={devis.coutMateriauxHT}
      coutHonorairesHT={devis.coutHonorairesHT}
      totalHT={totalHT}
    />
  );

  const adresseAffichee = devis.chantier?.adresse || devis.clientAdresse;
  const adresseOnglet = (
    <section className="flex flex-col gap-2 max-w-xl text-sm">
      {adresseAffichee ? (
        <>
          <AdressePopup adresse={adresseAffichee} />
          {devis.chantier && (
            <p className="text-xs text-muted">
              Adresse du chantier lié —{" "}
              <Link href={`/chantiers/${devis.chantier.id}`} className="underline">
                {devis.chantier.nom}
              </Link>
              .
            </p>
          )}
        </>
      ) : (
        <p className="text-muted">Aucune adresse renseignée.</p>
      )}
    </section>
  );

  return (
    <div className="flex flex-col gap-6">
      <RetourButton />
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-semibold">{devis.intitule}</h1>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-surface border border-border text-muted">
              {devis.entreprise}
            </span>
            <StatutAffaireSelect devisId={devis.id} statut={devis.statutAffaire} />
          </div>
          <p className="text-sm text-muted mt-1">
            {devis.numero} · {format(devis.dateDevis, "d MMMM yyyy", { locale: fr })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PdfQuickLook href={`/api/devis/${devis.id}/pdf`} fileName={`${devis.numero}.pdf`} />
          {!devis.valide && (
            <Link
              href={`/devis/${devis.id}/modifier`}
              className="shrink-0 rounded-md border border-border text-sm font-medium px-3 py-1.5 hover:bg-surface transition-colors"
            >
              Modifier
            </Link>
          )}
          {(!devis.valide || personne.estAdminPrincipal) && (
            <SupprimerDevisButton devisId={devis.id} intituleDevis={devis.intitule} valide={devis.valide} />
          )}
        </div>
      </div>

      <SousOnglets
        onglets={[
          { id: "devis", label: "Devis", content: devisOnglet },
          { id: "couts", label: "Coûts", content: coutsOnglet },
          { id: "adresse", label: "Adresse", content: adresseOnglet },
        ]}
      />
    </div>
  );
}
