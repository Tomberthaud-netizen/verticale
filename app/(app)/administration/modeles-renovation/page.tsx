import { requireAdmin } from "@/lib/authContext";
import { getModelesRenovation } from "@/lib/queries";
import RetourButton from "@/components/RetourButton";
import ModeleRenovationRow from "@/components/admin/ModeleRenovationRow";
import AjouterModeleRenovationForm from "@/components/admin/AjouterModeleRenovationForm";

export default async function ModelesRenovationPage() {
  await requireAdmin();
  const modeles = await getModelesRenovation();

  return (
    <div className="flex flex-col gap-6">
      <RetourButton />
      <h1 className="text-2xl font-semibold">Modèles de rénovation</h1>
      <p className="text-sm text-muted">
        Le coût moyen au m² de chaque modèle sert à proposer automatiquement un montant de
        rénovation sur l&apos;onglet Finances d&apos;un chantier, à partir de sa surface et du
        modèle choisi à sa création.
      </p>
      {modeles.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left text-muted border-b border-border">
                <th className="py-2 pr-2 font-medium">Modèle de rénovation</th>
                <th className="py-2 pr-2 font-medium">Coût moyen au m²</th>
                <th className="py-2 pr-0 font-medium" />
              </tr>
            </thead>
            <tbody>
              {modeles.map((m) => (
                <ModeleRenovationRow key={m.id} item={m} />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-muted">Aucun modèle de rénovation pour le moment.</p>
      )}
      <AjouterModeleRenovationForm />
    </div>
  );
}
