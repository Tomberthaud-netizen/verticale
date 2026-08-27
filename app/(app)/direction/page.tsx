import Link from "next/link";
import { requireAcces } from "@/lib/authContext";
import { getEntrepriseActive } from "@/lib/entrepriseActive";
import { getDevisAvecFactures } from "@/lib/queries";
import { calculerMontantTVA, calculerTotalHT, calculerTotalHTNet, calculerTotalTTC } from "@/lib/devis";
import { calculerEcartChiffrage, calculerResteAFacturer } from "@/lib/direction";
import { formaterMontant } from "@/lib/finances";
import SousOnglets from "@/components/SousOnglets";

function formaterPourcentage(valeur: number): string {
  return `${valeur > 0 ? "+" : ""}${valeur.toFixed(1)} %`;
}

export default async function DirectionPage() {
  await requireAcces("DIRECTION");
  const devisAvecFactures = await getDevisAvecFactures(await getEntrepriseActive());

  const devisAvecEcart = devisAvecFactures
    .map((d) => {
      const estimatifHT = calculerTotalHTNet(calculerTotalHT(d.lignes), d.remiseHT);
      const reelHT = d.factures.reduce((s, f) => s + f.montantHT, 0);
      const ecart = d.factures.length > 0 ? calculerEcartChiffrage(estimatifHT, reelHT) : null;
      return { ...d, estimatifHT, reelHT, ecart };
    })
    .filter((d) => d.factures.length > 0);

  const ecartsChiffrage = (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted">
        Écart entre le montant estimé au devis (HT) et le montant réellement facturé (HT), pour les devis ayant au
        moins une facture liée.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left text-muted border-b border-border">
              <th className="py-2 pr-2 font-medium">Devis</th>
              <th className="py-2 pr-2 font-medium text-right">Estimatif HT</th>
              <th className="py-2 pr-2 font-medium text-right">Réel HT</th>
              <th className="py-2 pr-2 font-medium text-right">Écart</th>
              <th className="py-2 pr-0 font-medium text-right">Écart %</th>
            </tr>
          </thead>
          <tbody>
            {devisAvecEcart.map((d) => (
              <tr key={d.id} className="border-b border-border">
                <td className="py-2 pr-2">
                  <Link href={`/devis/${d.id}`} className="underline">
                    {d.numero} — {d.intitule}
                  </Link>
                </td>
                <td className="py-2 pr-2 text-right tabular-nums">{formaterMontant(d.estimatifHT)}</td>
                <td className="py-2 pr-2 text-right tabular-nums">{formaterMontant(d.reelHT)}</td>
                <td
                  className={`py-2 pr-2 text-right tabular-nums ${
                    d.ecart && d.ecart.ecartMontant > 0 ? "text-red-600" : d.ecart && d.ecart.ecartMontant < 0 ? "text-emerald-600" : ""
                  }`}
                >
                  {d.ecart ? formaterMontant(d.ecart.ecartMontant) : "—"}
                </td>
                <td className="py-2 pr-0 text-right tabular-nums">
                  {d.ecart ? formaterPourcentage(d.ecart.ecartPourcentage) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {devisAvecEcart.length === 0 && (
          <p className="text-sm text-muted mt-3">
            Aucun devis facturé pour le moment — l&apos;écart apparaît dès qu&apos;une facture est liée à un devis.
          </p>
        )}
      </div>
    </div>
  );

  const carnetItems = devisAvecFactures
    .filter((d) => d.statutAffaire === "GAGNE")
    .map((d) => {
      const totalHT = calculerTotalHTNet(calculerTotalHT(d.lignes), d.remiseHT);
      const totalTTC = calculerTotalTTC(totalHT, calculerMontantTVA(totalHT, d.tauxTVA));
      const dejaFactureHT = d.factures.reduce((s, f) => s + f.montantHT, 0);
      const resteAFacturer = calculerResteAFacturer(totalHT, dejaFactureHT);
      return { ...d, totalHT, totalTTC, dejaFactureHT, resteAFacturer };
    });
  const carnetTotal = carnetItems.reduce((s, d) => s + d.resteAFacturer, 0);

  const carnetCommande = (
    <div className="flex flex-col gap-3">
      <div className="bg-surface border border-border rounded-lg p-4 max-w-xs">
        <p className="text-sm text-muted font-medium">Carnet de commande (reste à facturer HT)</p>
        <p className="text-2xl font-semibold mt-1">{formaterMontant(carnetTotal)}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left text-muted border-b border-border">
              <th className="py-2 pr-2 font-medium">Affaire gagnée</th>
              <th className="py-2 pr-2 font-medium text-right">Total HT</th>
              <th className="py-2 pr-2 font-medium text-right">Déjà facturé HT</th>
              <th className="py-2 pr-0 font-medium text-right">Reste à facturer HT</th>
            </tr>
          </thead>
          <tbody>
            {carnetItems.map((d) => (
              <tr key={d.id} className="border-b border-border">
                <td className="py-2 pr-2">
                  <Link href={`/devis/${d.id}`} className="underline">
                    {d.chantier?.nom ?? d.intitule}
                  </Link>
                </td>
                <td className="py-2 pr-2 text-right tabular-nums">{formaterMontant(d.totalHT)}</td>
                <td className="py-2 pr-2 text-right tabular-nums">{formaterMontant(d.dejaFactureHT)}</td>
                <td className="py-2 pr-0 text-right tabular-nums">{formaterMontant(d.resteAFacturer)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {carnetItems.length === 0 && (
          <p className="text-sm text-muted mt-3">
            Aucune affaire gagnée pour le moment (statut &laquo;&nbsp;Gagné&nbsp;&raquo; sur un devis).
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Direction</h1>
      <SousOnglets
        onglets={[
          { id: "ecarts", label: "Écarts de chiffrage", content: ecartsChiffrage },
          { id: "carnet", label: "Carnet de commande", content: carnetCommande },
        ]}
      />
    </div>
  );
}
