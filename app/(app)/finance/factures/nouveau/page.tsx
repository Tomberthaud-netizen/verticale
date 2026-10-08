import { requireAcces } from "@/lib/authContext";
import { getEntrepriseActive } from "@/lib/entrepriseActive";
import { getChantiersPourFacture, getDevisPourFacture } from "@/lib/queries";
import FactureForm from "@/components/FactureForm";

export default async function NouvelleFacturePage() {
  await requireAcces("FINANCE");
  const entrepriseActive = await getEntrepriseActive();
  const [devisDisponibles, chantiers] = await Promise.all([
    getDevisPourFacture(entrepriseActive),
    getChantiersPourFacture(entrepriseActive),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Nouvelle facture</h1>
      <FactureForm devisDisponibles={devisDisponibles} chantiers={chantiers} entrepriseActive={entrepriseActive} />
    </div>
  );
}
