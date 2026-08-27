import { notFound, redirect } from "next/navigation";
import DevisForm from "@/components/DevisForm";
import { getDesignationsExistantes, getDevis, getPersonnesNoms } from "@/lib/queries";
import { requireAcces } from "@/lib/authContext";
import RetourButton from "@/components/RetourButton";
import type { Entreprise } from "@/constants/entreprises";

export default async function ModifierDevisPage({ params }: PageProps<"/devis/[id]/modifier">) {
  const { id } = await params;
  const devis = await getDevis(id);
  if (!devis) notFound();
  await requireAcces("DEVIS", devis.entreprise as Entreprise);
  if (devis.valide) redirect(`/devis/${id}`);
  const [designationsExistantes, personnes] = await Promise.all([getDesignationsExistantes(), getPersonnesNoms()]);

  return (
    <div className="flex flex-col gap-6">
      <RetourButton />
      <h1 className="text-2xl font-semibold">Modifier le devis</h1>
      <DevisForm designationsExistantes={designationsExistantes} devisExistant={devis} personnes={personnes} />
    </div>
  );
}
