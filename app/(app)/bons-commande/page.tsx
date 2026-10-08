import { aAcces, requireAcces } from "@/lib/authContext";
import { getEntrepriseActive } from "@/lib/entrepriseActive";
import { getBonsCommande } from "@/lib/queries";
import { calculerTotalHTBonCommande } from "@/lib/bonCommande";
import BonsCommandeListe from "@/components/BonsCommandeListe";

export default async function BonsCommandePage() {
  const entreprise = await getEntrepriseActive();
  const personne = await requireAcces("CHANTIERS", entreprise);
  const bons = await getBonsCommande(entreprise);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Bons de commande</h1>
        <p className="text-sm text-muted mt-1">
          Émis au nom de {entreprise}. Un bon est créé automatiquement quand vous saisissez un acompte
          d&apos;un sous-traitant sur un chantier (ou depuis la fiche d&apos;un devis).
        </p>
      </div>
      <BonsCommandeListe
        peutFacturer={aAcces(personne, "FINANCE", entreprise)}
        bons={bons.map((b) => ({
          id: b.id,
          numero: b.numero,
          intitule: b.intitule,
          dateBon: b.dateBon,
          envoyeLe: b.envoyeLe,
          sousTraitantNom: b.sousTraitant.nom,
          sousTraitantEmail: b.sousTraitant.email,
          totalHT: calculerTotalHTBonCommande(b.lignes),
          lignes: b.lignes.map((l) => ({
            designation: l.designation,
            detail: l.detail,
            unite: l.unite,
            quantite: l.quantite,
            prixUnitaire: l.prixUnitaire,
          })),
          notes: b.notes,
          chantier: b.chantier,
          devis: b.devis,
          facture: b.facture,
        }))}
      />
    </div>
  );
}
