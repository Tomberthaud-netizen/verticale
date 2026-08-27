import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { requireAcces } from "@/lib/authContext";
import { getEntrepriseActive } from "@/lib/entrepriseActive";
import { getChantiers, getDevisValides, getFactures } from "@/lib/queries";
import { calculerChantier } from "@/lib/chantier";
import { calculerMontantTVA, calculerTotalHT, calculerTotalHTNet, calculerTotalTTC } from "@/lib/devis";
import {
  calculerBeneficeReel,
  calculerMontantPaye,
  calculerStatutPaiement,
  trouverDateEncaissementComplet,
} from "@/lib/factures";
import { calculerMargePourcentage, estEcheancePaiementDepassee, formaterMontant } from "@/lib/finances";
import SousOnglets from "@/components/SousOnglets";
import BoutonPaye from "@/components/BoutonPaye";
import DateLimitePaiementInput from "@/components/DateLimitePaiementInput";
import CarteDetail from "@/components/CarteDetail";

export default async function FinancePage() {
  await requireAcces("FINANCE");
  const entreprise = await getEntrepriseActive();
  const [chantiers, factures, devisValides] = await Promise.all([
    getChantiers(entreprise),
    getFactures(entreprise),
    getDevisValides(entreprise),
  ]);

  const chantiersCalcules = chantiers.map(calculerChantier);

  const devisValidesCalcules = devisValides.map((d) => ({
    ...d,
    montantHT: calculerTotalHTNet(calculerTotalHT(d.lignes), d.remiseHT),
  }));
  const chantiersEncaissables = chantiersCalcules.filter((c) => c.prixRevente != null);

  const facturesCalculees = factures.map((f) => {
    const montantPaye = calculerMontantPaye(f.paiements);
    const montantTVA = calculerMontantTVA(f.montantHT, f.tauxTVA);
    const montantTTC = calculerTotalTTC(f.montantHT, montantTVA);
    const statutPaiement = calculerStatutPaiement(f.statut, montantTTC, montantPaye, f.dateEcheance);
    const dateEncaissement = trouverDateEncaissementComplet(f.paiements, montantTTC);
    const beneficeReel = calculerBeneficeReel(f.montantHT, f.coutRealisationHT);
    return { ...f, montantPaye, montantTTC, statutPaiement, dateEncaissement, beneficeReel };
  });

  const facturesActives = facturesCalculees.filter((f) => f.statut !== "ANNULEE");
  const caDevisEncaisses = devisValidesCalcules.filter((d) => d.paye).reduce((s, d) => s + d.montantHT, 0);
  const caChantiersEncaisses = chantiersEncaissables
    .filter((c) => c.paye)
    .reduce((s, c) => s + (c.prixRevente ?? 0), 0);
  const ca = facturesActives.reduce((s, f) => s + f.montantHT, 0) + caDevisEncaisses + caChantiersEncaisses;
  const beneficePrevisionnel = chantiersCalcules.reduce((s, c) => s + (c.beneficePrevisionnel ?? 0), 0);
  const beneficeReelTotal = facturesActives.reduce((s, f) => s + (f.beneficeReel ?? 0), 0);
  const coutsEngages =
    chantiersCalcules.reduce((s, c) => s + (c.coutReel ?? 0), 0) +
    facturesActives.reduce((s, f) => s + (f.coutRealisationHT ?? 0), 0);
  const margePourcentage = calculerMargePourcentage(beneficeReelTotal, ca);

  const devisEnRetardPaiement = devisValidesCalcules.filter((d) =>
    estEcheancePaiementDepassee(d.dateLimitePaiement, d.paye)
  );
  const chantiersEnRetardPaiement = chantiersEncaissables.filter((c) =>
    estEcheancePaiementDepassee(c.dateLimitePaiement, c.paye)
  );

  const coutsEngagesChantiers = chantiersCalcules.filter((c) => c.coutReel != null);
  const coutsEngagesFactures = facturesActives.filter((f) => f.coutRealisationHT != null);
  const beneficePrevisionnelChantiers = chantiersCalcules.filter((c) => c.beneficePrevisionnel != null);
  const devisEncaisses = devisValidesCalcules.filter((d) => d.paye);
  const chantiersEncaisses = chantiersEncaissables.filter((c) => c.paye);

  const caDetail = (
    <div className="flex flex-col gap-4">
      <section>
        <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Factures</h3>
        {facturesActives.length > 0 ? (
          <table className="w-full border-collapse">
            <tbody>
              {facturesActives.map((f) => (
                <tr key={f.id} className="border-b border-border">
                  <td className="py-1.5 pr-2">
                    <Link href={`/finance/factures/${f.id}`} className="underline">
                      {f.numero}
                    </Link>
                    <span className="text-muted">
                      {" "}
                      — {f.chantier?.nom ?? f.devis?.intitule ?? f.clientNom ?? "Sans nom"}
                    </span>
                  </td>
                  <td className="py-1.5 pl-2 text-right tabular-nums shrink-0">{formaterMontant(f.montantHT)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-muted">Aucune facture active.</p>
        )}
      </section>
      <section>
        <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Devis validés encaissés</h3>
        {devisEncaisses.length > 0 ? (
          <table className="w-full border-collapse">
            <tbody>
              {devisEncaisses.map((d) => (
                <tr key={d.id} className="border-b border-border">
                  <td className="py-1.5 pr-2">
                    <Link href={`/devis/${d.id}`} className="underline">
                      {d.numero}
                    </Link>
                    <span className="text-muted"> — {d.intitule}</span>
                  </td>
                  <td className="py-1.5 pl-2 text-right tabular-nums shrink-0">{formaterMontant(d.montantHT)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-muted">Aucun devis encaissé.</p>
        )}
      </section>
      <section>
        <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
          Chantiers (achat/revente) encaissés
        </h3>
        {chantiersEncaisses.length > 0 ? (
          <table className="w-full border-collapse">
            <tbody>
              {chantiersEncaisses.map((c) => (
                <tr key={c.id} className="border-b border-border">
                  <td className="py-1.5 pr-2">
                    <Link href={`/chantiers/${c.id}`} className="underline">
                      {c.nom}
                    </Link>
                  </td>
                  <td className="py-1.5 pl-2 text-right tabular-nums shrink-0">{formaterMontant(c.prixRevente)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-muted">Aucun chantier encaissé.</p>
        )}
      </section>
      <div className="flex justify-between items-center pt-2 border-t border-border font-semibold">
        <span>Total CA (HT)</span>
        <span className="tabular-nums">{formaterMontant(ca)}</span>
      </div>
    </div>
  );

  const beneficePrevisionnelDetail = (
    <div className="flex flex-col gap-2">
      {beneficePrevisionnelChantiers.length > 0 ? (
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-left text-muted border-b border-border">
              <th className="py-1.5 pr-2 font-medium">Chantier</th>
              <th className="py-1.5 pr-2 font-medium text-right">Prix revente</th>
              <th className="py-1.5 pr-2 font-medium text-right">Coût réel</th>
              <th className="py-1.5 pr-0 font-medium text-right">Bénéfice</th>
            </tr>
          </thead>
          <tbody>
            {beneficePrevisionnelChantiers.map((c) => (
              <tr key={c.id} className="border-b border-border">
                <td className="py-1.5 pr-2">
                  <Link href={`/chantiers/${c.id}`} className="underline">
                    {c.nom}
                  </Link>
                </td>
                <td className="py-1.5 pr-2 text-right tabular-nums">{formaterMontant(c.prixRevente)}</td>
                <td className="py-1.5 pr-2 text-right tabular-nums">{formaterMontant(c.coutReel)}</td>
                <td
                  className={`py-1.5 pr-0 text-right tabular-nums ${
                    (c.beneficePrevisionnel ?? 0) < 0 ? "text-red-600" : ""
                  }`}
                >
                  {formaterMontant(c.beneficePrevisionnel)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-muted">Aucun chantier avec prix d&apos;achat et de revente renseignés.</p>
      )}
      <div className="flex justify-between items-center pt-2 border-t border-border font-semibold">
        <span>Total</span>
        <span className="tabular-nums">{formaterMontant(beneficePrevisionnel)}</span>
      </div>
    </div>
  );

  const beneficeReelDetail = (
    <div className="flex flex-col gap-2">
      {facturesActives.length > 0 ? (
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-left text-muted border-b border-border">
              <th className="py-1.5 pr-2 font-medium">Facture</th>
              <th className="py-1.5 pr-2 font-medium text-right">Vendu HT</th>
              <th className="py-1.5 pr-2 font-medium text-right">Coût réal.</th>
              <th className="py-1.5 pr-0 font-medium text-right">Bénéfice</th>
            </tr>
          </thead>
          <tbody>
            {facturesActives.map((f) => (
              <tr key={f.id} className="border-b border-border">
                <td className="py-1.5 pr-2">
                  <Link href={`/finance/factures/${f.id}`} className="underline">
                    {f.numero}
                  </Link>
                  <span className="text-muted">
                    {" "}
                    — {f.chantier?.nom ?? f.devis?.intitule ?? f.clientNom ?? "Sans nom"}
                  </span>
                </td>
                <td className="py-1.5 pr-2 text-right tabular-nums">{formaterMontant(f.montantHT)}</td>
                <td className="py-1.5 pr-2 text-right tabular-nums">{formaterMontant(f.coutRealisationHT)}</td>
                <td
                  className={`py-1.5 pr-0 text-right tabular-nums ${
                    (f.beneficeReel ?? 0) < 0 ? "text-red-600" : ""
                  }`}
                >
                  {formaterMontant(f.beneficeReel)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-muted">Aucune facture active.</p>
      )}
      <div className="flex justify-between items-center pt-2 border-t border-border font-semibold">
        <span>Total (factures avec coût renseigné)</span>
        <span className={`tabular-nums ${beneficeReelTotal < 0 ? "text-red-600" : ""}`}>
          {formaterMontant(beneficeReelTotal)}
        </span>
      </div>
    </div>
  );

  const margeDetail = (
    <div className="flex flex-col gap-3">
      <p className="text-muted">Marge réalisée = Bénéfice réel ÷ CA (HT) × 100</p>
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between">
          <span>Bénéfice réel</span>
          <span className={`tabular-nums ${beneficeReelTotal < 0 ? "text-red-600" : ""}`}>
            {formaterMontant(beneficeReelTotal)}
          </span>
        </div>
        <div className="flex justify-between">
          <span>CA (HT)</span>
          <span className="tabular-nums">{formaterMontant(ca)}</span>
        </div>
      </div>
      <div className="flex justify-between items-center pt-2 border-t border-border font-semibold">
        <span>Marge réalisée</span>
        <span className={`tabular-nums ${margePourcentage != null && margePourcentage < 0 ? "text-red-600" : ""}`}>
          {margePourcentage != null ? `${margePourcentage.toFixed(1)} %` : "—"}
        </span>
      </div>
    </div>
  );

  const coutsDetail = (
    <div className="flex flex-col gap-4">
      <section>
        <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Chantiers — coût réel</h3>
        {coutsEngagesChantiers.length > 0 ? (
          <table className="w-full border-collapse">
            <tbody>
              {coutsEngagesChantiers.map((c) => (
                <tr key={c.id} className="border-b border-border">
                  <td className="py-1.5 pr-2">
                    <Link href={`/chantiers/${c.id}`} className="underline">
                      {c.nom}
                    </Link>
                  </td>
                  <td className="py-1.5 pl-2 text-right tabular-nums shrink-0">{formaterMontant(c.coutReel)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-muted">Aucun chantier avec coût renseigné.</p>
        )}
      </section>
      <section>
        <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
          Factures — coût de réalisation
        </h3>
        {coutsEngagesFactures.length > 0 ? (
          <table className="w-full border-collapse">
            <tbody>
              {coutsEngagesFactures.map((f) => (
                <tr key={f.id} className="border-b border-border">
                  <td className="py-1.5 pr-2">
                    <Link href={`/finance/factures/${f.id}`} className="underline">
                      {f.numero}
                    </Link>
                    <span className="text-muted">
                      {" "}
                      — {f.chantier?.nom ?? f.devis?.intitule ?? f.clientNom ?? "Sans nom"}
                    </span>
                  </td>
                  <td className="py-1.5 pl-2 text-right tabular-nums shrink-0">
                    {formaterMontant(f.coutRealisationHT)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-muted">Aucune facture avec coût de réalisation renseigné.</p>
        )}
      </section>
      <div className="flex justify-between items-center pt-2 border-t border-border font-semibold">
        <span>Total</span>
        <span className="tabular-nums">{formaterMontant(coutsEngages)}</span>
      </div>
    </div>
  );

  const vueEnsemble = (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-4">
        <CarteDetail titre="CA (HT)" valeur={formaterMontant(ca)} detail={caDetail} />
        <CarteDetail
          titre="Bénéfice prévisionnel"
          valeur={formaterMontant(beneficePrevisionnel)}
          sousTitre="Chantiers (achat/revente renseignés)"
          detail={beneficePrevisionnelDetail}
        />
        <CarteDetail
          titre="Bénéfice réel"
          valeur={formaterMontant(beneficeReelTotal)}
          valeurClassName={beneficeReelTotal < 0 ? "text-red-600" : ""}
          sousTitre="Factures avec coût de réalisation renseigné"
          detail={beneficeReelDetail}
        />
        <CarteDetail
          titre="Marge réalisée"
          valeur={margePourcentage != null ? `${margePourcentage.toFixed(1)} %` : "—"}
          valeurClassName={margePourcentage != null && margePourcentage < 0 ? "text-red-600" : ""}
          sousTitre="Bénéfice réel / CA"
          detail={margeDetail}
        />
        <CarteDetail titre="Coûts engagés" valeur={formaterMontant(coutsEngages)} detail={coutsDetail} />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">
          Alertes — devis et chantiers non encaissés (date limite dépassée)
        </h2>
        {devisEnRetardPaiement.length > 0 || chantiersEnRetardPaiement.length > 0 ? (
          <ul className="flex flex-col gap-1.5">
            {devisEnRetardPaiement.map((d) => (
              <li
                key={d.id}
                className="flex justify-between items-center border border-red-200 bg-red-50 rounded-md px-3 py-2 text-sm"
              >
                <Link href={`/devis/${d.id}`} className="underline">
                  {d.numero} — {d.intitule}
                </Link>
                <span className="text-red-700">
                  Échéance le {format(d.dateLimitePaiement!, "d MMM yyyy", { locale: fr })} ·{" "}
                  {formaterMontant(d.montantHT)} HT non encaissé
                </span>
              </li>
            ))}
            {chantiersEnRetardPaiement.map((c) => (
              <li
                key={c.id}
                className="flex justify-between items-center border border-red-200 bg-red-50 rounded-md px-3 py-2 text-sm"
              >
                <Link href={`/chantiers/${c.id}`} className="underline">
                  {c.nom}
                </Link>
                <span className="text-red-700">
                  Échéance le {format(c.dateLimitePaiement!, "d MMM yyyy", { locale: fr })} ·{" "}
                  {formaterMontant(c.prixRevente)} non encaissé
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">Aucun devis ou chantier en retard de paiement.</p>
        )}
      </section>
    </div>
  );

  const enCoursOnglet = (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">Devis validés</h2>
        {devisValidesCalcules.length > 0 ? (
          <div className="flex flex-col gap-2">
            {devisValidesCalcules.map((d) => (
              <div
                key={d.id}
                className="flex flex-wrap items-center justify-between gap-3 bg-surface border border-border rounded-lg p-3"
              >
                <div className="min-w-0">
                  <Link href={`/devis/${d.id}`} className="font-medium underline">
                    {d.intitule}
                  </Link>
                  <p className="text-sm text-muted">
                    {d.numero} · {d.chantier?.nom ?? d.clientNom ?? "Sans chantier"} ·{" "}
                    {formaterMontant(d.montantHT)} HT
                  </p>
                </div>
                <div className="flex items-end gap-2">
                  <DateLimitePaiementInput cible="devis" id={d.id} dateLimitePaiement={d.dateLimitePaiement} />
                  <BoutonPaye cible="devis" id={d.id} paye={d.paye} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">Aucun devis validé pour le moment.</p>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">Chantiers (achat/revente)</h2>
        {chantiersEncaissables.length > 0 ? (
          <div className="flex flex-col gap-2">
            {chantiersEncaissables.map((c) => (
              <div
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-3 bg-surface border border-border rounded-lg p-3"
              >
                <div className="min-w-0">
                  <Link href={`/chantiers/${c.id}`} className="font-medium underline">
                    {c.nom}
                  </Link>
                  <p className="text-sm text-muted">Prix de revente : {formaterMontant(c.prixRevente)}</p>
                </div>
                <div className="flex items-end gap-2">
                  <DateLimitePaiementInput cible="chantier" id={c.id} dateLimitePaiement={c.dateLimitePaiement} />
                  <BoutonPaye cible="chantier" id={c.id} paye={c.paye} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">Aucun chantier avec un prix de revente renseigné.</p>
        )}
      </section>
    </div>
  );

  const paiementsOnglet = (
    <div className="flex flex-col gap-3">
      {facturesCalculees.flatMap((f) => f.paiements.map((p) => ({ ...p, facture: f }))).length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left text-muted border-b border-border">
                <th className="py-2 pr-2 font-medium">Facture</th>
                <th className="py-2 pr-2 font-medium text-right">Montant</th>
                <th className="py-2 pr-2 font-medium">Date</th>
                <th className="py-2 pr-0 font-medium">Moyen</th>
              </tr>
            </thead>
            <tbody>
              {facturesCalculees
                .flatMap((f) => f.paiements.map((p) => ({ ...p, facture: f })))
                .sort((a, b) => b.datePaiement.getTime() - a.datePaiement.getTime())
                .map((p) => (
                  <tr key={p.id} className="border-b border-border">
                    <td className="py-2 pr-2">
                      <Link href={`/finance/factures/${p.facture.id}`} className="underline">
                        {p.facture.numero}
                      </Link>
                    </td>
                    <td className="py-2 pr-2 text-right tabular-nums">{formaterMontant(p.montant)}</td>
                    <td className="py-2 pr-2">{format(p.datePaiement, "d MMM yyyy", { locale: fr })}</td>
                    <td className="py-2 pr-0 text-muted">{p.moyen ?? "—"}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-muted">Aucun paiement enregistré. Ajoutez-en depuis la fiche d&apos;une facture.</p>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-semibold">Finance</h1>
        <div className="flex items-center gap-2">
          <a
            href="/api/finance/export"
            className="shrink-0 rounded-md border border-border text-sm font-medium px-3 py-1.5 hover:bg-surface transition-colors"
          >
            Exporter en PDF
          </a>
        </div>
      </div>
      <SousOnglets
        onglets={[
          { id: "vue-ensemble", label: "Vue d'ensemble", content: vueEnsemble },
          { id: "en-cours", label: "En cours", content: enCoursOnglet },
          { id: "paiements", label: "Paiements", content: paiementsOnglet },
        ]}
      />
    </div>
  );
}
