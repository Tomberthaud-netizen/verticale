import { requireAcces } from "@/lib/authContext";
import { getTypesTravauxExistants } from "@/lib/queries";
import SousTraitantForm from "@/components/SousTraitantForm";
import RetourButton from "@/components/RetourButton";

export default async function NouveauSousTraitantPage() {
  await requireAcces("SOUS_TRAITANTS");
  const typesExistants = await getTypesTravauxExistants();

  return (
    <div className="flex flex-col gap-6">
      <RetourButton />
      <h1 className="text-2xl font-semibold">Nouveau sous-traitant</h1>
      <SousTraitantForm typesExistants={typesExistants} />
    </div>
  );
}
