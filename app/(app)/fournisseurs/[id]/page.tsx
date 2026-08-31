import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAcces } from "@/lib/authContext";
import { getFournisseur, getPrixReferenceParLot } from "@/lib/queries";
import { formaterMontant } from "@/lib/finances";
import { normaliserUrlExterne } from "@/lib/url";
import ToggleActifFournisseurButton from "@/components/ToggleActifFournisseurButton";
import SupprimerFournisseurButton from "@/components/SupprimerFournisseurButton";
import RetourButton from "@/components/RetourButton";
import ProduitsFournisseurPanel from "@/components/fournisseur/ProduitsFournisseurPanel";
import type { Entreprise } from "@/constants/entreprises";

export default async function FournisseurDetailPage({ params }: PageProps<"/fournisseurs/[id]">) {
  const { id } = await params;
  const fournisseur = await getFournisseur(id);
  if (!fournisseur) notFound();
  await requireAcces("FOURNISSEURS", fournisseur.entreprise as Entreprise);

  const listesParType = await Promise.all(fournisseur.typesProduit.map((t) => getPrixReferenceParLot(t.type)));
  const vus = new Set<string>();
  const prixReference = listesParType.flat().filter((p) => {
    if (vus.has(p.id)) return false;
    vus.add(p.id);
    return true;
  });

  return (
    <div className="flex flex-col gap-6">
      <RetourButton />
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-semibold">{fournisseur.nom}</h1>
            <ToggleActifFournisseurButton fournisseurId={fournisseur.id} actif={fournisseur.actif} />
          </div>
          <p className="text-sm text-muted mt-1 flex items-center gap-1.5 flex-wrap">
            {fournisseur.typesProduit.length > 0 ? (
              fournisseur.typesProduit.map((t) => (
                <span
                  key={t.id}
                  className="text-xs font-medium px-2 py-0.5 rounded-full bg-background border border-border"
                >
                  {t.type}
                </span>
              ))
            ) : (
              <span>Type non précisé</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/fournisseurs/${fournisseur.id}/modifier`}
            className="shrink-0 rounded-md border border-border text-sm font-medium px-3 py-1.5 hover:bg-surface transition-colors"
          >
            Modifier
          </Link>
          <SupprimerFournisseurButton fournisseurId={fournisseur.id} nom={fournisseur.nom} />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <section className="text-sm flex flex-col gap-1">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-1">Contact</h2>
          <p>{[fournisseur.contactPrenom, fournisseur.contactNom].filter(Boolean).join(" ") || "—"}</p>
          {fournisseur.telephone && <p className="text-muted">{fournisseur.telephone}</p>}
          {fournisseur.email && <p className="text-muted">{fournisseur.email}</p>}
          {fournisseur.siteWeb && (
            <a href={normaliserUrlExterne(fournisseur.siteWeb)} target="_blank" rel="noreferrer" className="underline">
              {fournisseur.siteWeb}
            </a>
          )}
        </section>

        <section className="text-sm flex flex-col gap-1">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-1">Adresse</h2>
          <p>{fournisseur.adresse || "—"}</p>
          <p className="text-muted">
            {[fournisseur.codePostal, fournisseur.ville].filter(Boolean).join(" ")}
            {fournisseur.pays && <> · {fournisseur.pays}</>}
          </p>
          {fournisseur.siret && <p className="text-muted">SIRET {fournisseur.siret}</p>}
        </section>

        <section className="text-sm flex flex-col gap-1">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-1">Conditions</h2>
          <p>{fournisseur.conditionPaiement || "Non précisées"}</p>
        </section>

        {fournisseur.notes && (
          <section className="text-sm flex flex-col gap-1">
            <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-1">Notes</h2>
            <p className="whitespace-pre-wrap text-muted">{fournisseur.notes}</p>
          </section>
        )}
      </div>

      <ProduitsFournisseurPanel fournisseurId={fournisseur.id} siteWeb={fournisseur.siteWeb} produits={fournisseur.produits} />

      {fournisseur.typesProduit.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">
            Prix de référence — {fournisseur.typesProduit.map((t) => t.type).join(", ")}
          </h2>
          <p className="text-xs text-muted -mt-2">
            Issus du catalogue de prix (devis historiques), pas nécessairement de ce fournisseur précis — donné à
            titre indicatif pour ces types de produit.
          </p>
          {prixReference.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="text-left text-muted border-b border-border">
                    <th className="py-2 pr-2 font-medium">Désignation</th>
                    <th className="py-2 pr-2 font-medium">Unité</th>
                    <th className="py-2 pr-0 font-medium text-right">Prix unitaire HT</th>
                  </tr>
                </thead>
                <tbody>
                  {prixReference.map((p) => (
                    <tr key={p.id} className="border-b border-border">
                      <td className="py-2 pr-2">{p.designation}</td>
                      <td className="py-2 pr-2 text-muted">{p.unite ?? "—"}</td>
                      <td className="py-2 pr-0 text-right tabular-nums">{formaterMontant(p.prixUnitaire)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted">Aucun prix de référence pour ces types de produit.</p>
          )}
        </section>
      )}
    </div>
  );
}
