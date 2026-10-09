import { requireAcces } from "@/lib/authContext";
import { getPostesBareme } from "@/lib/queries";
import RetourButton from "@/components/RetourButton";
import BaremeEditeur from "@/components/chiffrage/BaremeEditeur";

export default async function BaremePage() {
  await requireAcces("CHIFFRAGE");
  const postes = await getPostesBareme();

  return (
    <div className="flex flex-col gap-6">
      <RetourButton />
      <div>
        <h1 className="text-2xl font-semibold">Barème de prix</h1>
        <p className="text-sm text-muted mt-1 max-w-3xl">
          Chaque poste indique sur quelle mesure d&apos;une pièce se calcule sa quantité, quelles pièces il concerne et
          son prix unitaire. Le bouton « Suggérer » propose un prix d&apos;après vos devis passés et le catalogue : à vous
          de le retenir ou non.
        </p>
      </div>
      <BaremeEditeur
        postes={postes.map((p) => ({
          id: p.id,
          lot: p.lot,
          designation: p.designation,
          unite: p.unite,
          base: p.base,
          prixUnitaire: p.prixUnitaire,
          typesPieces: p.typesPieces,
          actif: p.actif,
        }))}
      />
    </div>
  );
}
