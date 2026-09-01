import ChantierForm from "@/components/ChantierForm";
import { requireAcces } from "@/lib/authContext";
import { getEntrepriseActive } from "@/lib/entrepriseActive";
import { getDureesTypesTravaux, getModelesRenovation, getSousTraitantsNoms } from "@/lib/queries";

export default async function NouveauChantierPage() {
  await requireAcces("VUE_ENSEMBLE");
  const entrepriseActive = await getEntrepriseActive();
  const [sousTraitants, dureesTypesTravaux, modelesRenovation] = await Promise.all([
    getSousTraitantsNoms(entrepriseActive),
    getDureesTypesTravaux(),
    getModelesRenovation(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Nouveau chantier</h1>
      <ChantierForm
        sousTraitants={sousTraitants}
        entrepriseActive={entrepriseActive}
        dureesTypesTravaux={dureesTypesTravaux}
        modelesRenovation={modelesRenovation}
      />
    </div>
  );
}
