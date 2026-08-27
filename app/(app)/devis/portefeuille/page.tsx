import Link from "next/link";
import { getDevisListe } from "@/lib/queries";
import { calculerTotalHT, calculerTotalHTNet } from "@/lib/devis";
import { calculerMontantEnJeu } from "@/lib/affaires";
import { formaterMontant } from "@/lib/finances";
import { requireAcces } from "@/lib/authContext";
import { getEntrepriseActive } from "@/lib/entrepriseActive";
import { STATUTS_AFFAIRE, STATUTS_EN_JEU, STATUT_AFFAIRE_INFO } from "@/constants/affaires";
import StatutAffaireBadge from "@/components/StatutAffaireBadge";

export default async function PortefeuillePage() {
  await requireAcces("DEVIS");
  const devisListe = await getDevisListe(await getEntrepriseActive());

  const devisAvecTotal = devisListe.map((devis) => ({
    ...devis,
    totalHT: calculerTotalHTNet(calculerTotalHT(devis.lignes), devis.remiseHT),
  }));

  const montantEnJeu = calculerMontantEnJeu(
    devisAvecTotal
      .filter((d) => STATUTS_EN_JEU.includes(d.statutAffaire))
      .map((d) => ({ montant: d.totalHT }))
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <Link href="/devis" className="text-sm text-muted hover:underline">
            ← Devis
          </Link>
          <h1 className="text-2xl font-semibold mt-1">Portefeuille</h1>
        </div>
        <div className="bg-surface border border-border rounded-lg px-4 py-3">
          <p className="text-sm text-muted font-medium">Montant en jeu (HT)</p>
          <p className="text-xl font-semibold mt-0.5">{formaterMontant(montantEnJeu)}</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 items-start">
        {STATUTS_AFFAIRE.map((statut) => {
          const items = devisAvecTotal.filter((d) => d.statutAffaire === statut);
          const total = items.reduce((s, d) => s + d.totalHT, 0);
          return (
            <div key={statut} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <StatutAffaireBadge statut={statut} />
                <span className="text-xs text-muted">{items.length}</span>
              </div>
              <p className="text-xs text-muted -mt-1">{formaterMontant(total)}</p>
              <div className="flex flex-col gap-2">
                {items.map((devis) => (
                  <Link
                    key={devis.id}
                    href={`/devis/${devis.id}`}
                    className="bg-surface border border-border rounded-lg p-3 text-sm hover:border-foreground/30 transition-colors flex flex-col gap-1"
                  >
                    <span className="font-medium truncate">{devis.intitule}</span>
                    <span className="text-xs text-muted">{devis.numero}</span>
                    {devis.chantier && (
                      <span className="text-xs text-emerald-700 truncate">{devis.chantier.nom}</span>
                    )}
                    <span className="text-sm font-semibold tabular-nums mt-1">
                      {formaterMontant(devis.totalHT)} <span className="text-xs text-muted font-normal">HT</span>
                    </span>
                    {devis.responsable && (
                      <span className="text-xs text-muted">
                        {devis.responsable.prenom} {devis.responsable.nom}
                      </span>
                    )}
                  </Link>
                ))}
                {items.length === 0 && (
                  <p className="text-xs text-muted italic">Aucune affaire {STATUT_AFFAIRE_INFO[statut].label.toLowerCase()}.</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
