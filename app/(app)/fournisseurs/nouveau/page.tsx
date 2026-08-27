import { requireAcces } from "@/lib/authContext";
import { getTypesProduitExistants } from "@/lib/queries";
import FournisseurForm from "@/components/FournisseurForm";
import RetourButton from "@/components/RetourButton";

export default async function NouveauFournisseurPage() {
  await requireAcces("FOURNISSEURS");
  const typesExistants = await getTypesProduitExistants();

  return (
    <div className="flex flex-col gap-6">
      <RetourButton />
      <h1 className="text-2xl font-semibold">Nouveau fournisseur</h1>
      <FournisseurForm typesExistants={typesExistants} />
    </div>
  );
}
