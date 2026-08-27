import { notFound } from "next/navigation";
import { requireAcces } from "@/lib/authContext";
import { getSousTraitant, getTypesTravauxExistants } from "@/lib/queries";
import SousTraitantForm from "@/components/SousTraitantForm";
import RetourButton from "@/components/RetourButton";
import type { Entreprise } from "@/constants/entreprises";

export default async function ModifierSousTraitantPage({ params }: PageProps<"/sous-traitants/[id]/modifier">) {
  const { id } = await params;
  const sousTraitant = await getSousTraitant(id);
  if (!sousTraitant) notFound();
  await requireAcces("SOUS_TRAITANTS", sousTraitant.entreprise as Entreprise);
  const typesExistants = await getTypesTravauxExistants();

  return (
    <div className="flex flex-col gap-6">
      <RetourButton />
      <h1 className="text-2xl font-semibold">Modifier {sousTraitant.nom}</h1>
      <SousTraitantForm sousTraitantExistant={sousTraitant} typesExistants={typesExistants} />
    </div>
  );
}
