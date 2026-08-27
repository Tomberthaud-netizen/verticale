import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { requireAcces } from "@/lib/authContext";
import { getFacture } from "@/lib/queries";
import type { Entreprise } from "@/constants/entreprises";
import { calculerMontantTVA, calculerTotalTTC } from "@/lib/devis";
import {
  calculerBeneficeReel,
  calculerMontantPaye,
  calculerStatutPaiement,
  trouverDateEncaissementComplet,
} from "@/lib/factures";
import { formaterMontant } from "@/lib/finances";
import StatutPaiementBadge from "@/components/StatutPaiementBadge";
import PaiementForm from "@/components/PaiementForm";
import SupprimerPaiementButton from "@/components/SupprimerPaiementButton";
import GererFactureButtons from "@/components/GererFactureButtons";

export default async function FactureDetailPage({ params }: PageProps<"/finance/factures/[id]">) {
  const { id } = await params;
  const facture = await getFacture(id);
  if (!facture) notFound();
  await requireAcces("FINANCE", facture.entreprise as Entreprise);

  const montantPaye = calculerMontantPaye(facture.paiements);
  const montantTVA = calculerMontantTVA(facture.montantHT, facture.tauxTVA);
  const montantTTC = calculerTotalTTC(facture.montantHT, montantTVA);
  const statutPaiement = calculerStatutPaiement(facture.statut, montantTTC, montantPaye, facture.dateEcheance);
  const dateEncaissement = trouverDateEncaissementComplet(facture.paiements, montantTTC);
  const beneficeReel = calculerBeneficeReel(facture.montantHT, facture.coutRealisationHT);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-semibold">{facture.numero}</h1>
            <StatutPaiementBadge statut={statutPaiement} />
          </div>
          <p className="text-sm text-muted mt-1">
            {facture.entreprise} · {format(facture.dateFacture, "d MMMM yyyy", { locale: fr })}
            {facture.chantier && (
              <>
                {" "}
                · Chantier{" "}
                <Link href={`/chantiers/${facture.chantier.id}`} className="underline">
                  {facture.chantier.nom}
                </Link>
              </>
            )}
            {facture.devis && (
              <>
                {" "}
                · Devis{" "}
                <Link href={`/devis/${facture.devis.id}`} className="underline">
                  {facture.devis.intitule}
                </Link>
              </>
            )}
          </p>
        </div>
        <GererFactureButtons factureId={facture.id} statut={facture.statut} />
      </div>

      {(facture.clientNom || facture.clientAdresse) && (
        <section className="text-sm">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-1">Client</h2>
          <p>{facture.clientNom}</p>
          <p className="text-muted">{facture.clientAdresse}</p>
        </section>
      )}

      <div className="flex flex-wrap gap-4">
        <div className="bg-surface border border-border rounded-lg p-4 flex-1 min-w-[140px]">
          <p className="text-sm text-muted font-medium">Vendu HT</p>
          <p className="text-xl font-semibold mt-1">{formaterMontant(facture.montantHT)}</p>
        </div>
        <div className="bg-surface border border-border rounded-lg p-4 flex-1 min-w-[140px]">
          <p className="text-sm text-muted font-medium">TVA ({facture.tauxTVA}%)</p>
          <p className="text-xl font-semibold mt-1">{formaterMontant(montantTVA)}</p>
        </div>
        <div className="bg-surface border border-border rounded-lg p-4 flex-1 min-w-[140px]">
          <p className="text-sm text-muted font-medium">Total TTC</p>
          <p className="text-xl font-semibold mt-1">{formaterMontant(montantTTC)}</p>
        </div>
        <div className="bg-surface border border-border rounded-lg p-4 flex-1 min-w-[140px]">
          <p className="text-sm text-muted font-medium">Coût de réalisation HT</p>
          <p className="text-xl font-semibold mt-1">
            {facture.coutRealisationHT != null ? formaterMontant(facture.coutRealisationHT) : "—"}
          </p>
        </div>
        <div className="bg-surface border border-border rounded-lg p-4 flex-1 min-w-[140px]">
          <p className="text-sm text-muted font-medium">Bénéfice réel</p>
          <p className={`text-xl font-semibold mt-1 ${beneficeReel != null && beneficeReel < 0 ? "text-red-600" : ""}`}>
            {beneficeReel != null ? formaterMontant(beneficeReel) : "—"}
          </p>
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">
          Paiements — {formaterMontant(montantPaye)} encaissé sur {formaterMontant(montantTTC)}
          {dateEncaissement && <> · soldée le {format(dateEncaissement, "d MMMM yyyy", { locale: fr })}</>}
        </h2>
        {facture.paiements.length > 0 ? (
          <ul className="flex flex-col gap-1.5">
            {facture.paiements.map((p) => (
              <li
                key={p.id}
                className="flex justify-between items-center border border-border rounded-md px-3 py-2 bg-surface text-sm"
              >
                <span>
                  {formaterMontant(p.montant)} le {format(p.datePaiement, "d MMMM yyyy", { locale: fr })}
                  {p.moyen && ` — ${p.moyen}`}
                </span>
                <SupprimerPaiementButton factureId={facture.id} paiementId={p.id} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">Aucun paiement enregistré.</p>
        )}
        <PaiementForm factureId={facture.id} />
      </section>

      {facture.notes && (
        <section className="text-sm">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-1">Notes</h2>
          <p className="whitespace-pre-wrap text-muted">{facture.notes}</p>
        </section>
      )}
    </div>
  );
}
