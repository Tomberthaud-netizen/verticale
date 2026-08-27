import Link from "next/link";
import { getIndicesBT } from "@/lib/queries";
import IndiceBTForm from "@/components/IndiceBTForm";
import SupprimerIndiceBTButton from "@/components/SupprimerIndiceBTButton";
import { requireAcces } from "@/lib/authContext";

export default async function IndiceBTPage() {
  await requireAcces("DEVIS");
  const indices = await getIndicesBT();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/devis" className="text-sm text-muted hover:underline">
          ← Devis
        </Link>
        <h1 className="text-2xl font-semibold mt-1">Indice BT01</h1>
        <p className="text-sm text-muted mt-1 max-w-2xl">
          Indice bâtiment tous corps d&apos;état (base 2010, source INSEE — série 001710986) utilisé pour
          actualiser les prix unitaires suggérés depuis d&apos;anciens devis. Ajoutez ou corrigez une période
          ci-dessous ; l&apos;actualisation utilise la période exacte du devis source, ou à défaut la période
          connue la plus proche.
        </p>
      </div>

      <IndiceBTForm />

      <div className="overflow-x-auto max-w-md">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left text-muted border-b border-border">
              <th className="py-2 pr-2 font-medium">Période</th>
              <th className="py-2 pr-2 font-medium text-right">Valeur</th>
              <th className="py-2 pr-0 font-medium" />
            </tr>
          </thead>
          <tbody>
            {indices.map((indice) => (
              <tr key={indice.id} className="border-b border-border">
                <td className="py-2 pr-2">{indice.periode}</td>
                <td className="py-2 pr-2 text-right tabular-nums">{indice.valeur}</td>
                <td className="py-2 pr-0 text-right">
                  <SupprimerIndiceBTButton id={indice.id} periode={indice.periode} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {indices.length === 0 && <p className="text-sm text-muted mt-2">Aucun indice enregistré.</p>}
      </div>
    </div>
  );
}
