import { notFound } from "next/navigation";
import { requireAcces } from "@/lib/authContext";
import { getFournisseur, getTypesProduitExistants } from "@/lib/queries";
import FournisseurForm from "@/components/FournisseurForm";
import RetourButton from "@/components/RetourButton";
import type { Entreprise } from "@/constants/entreprises";

export default async function ModifierFournisseurPage({ params }: PageProps<"/fournisseurs/[id]/modifier">) {
  const { id } = await params;
  const fournisseur = await getFournisseur(id);
  if (!fournisseur) notFound();
  await requireAcces("FOURNISSEURS", fournisseur.entreprise as Entreprise);
  const typesExistants = await getTypesProduitExistants();

  return (
    <div className="flex flex-col gap-6">
      <RetourButton />
      <h1 className="text-2xl font-semibold">Modifier {fournisseur.nom}</h1>
      <FournisseurForm fournisseurExistant={fournisseur} typesExistants={typesExistants} />
    </div>
  );
}
