import DevisForm from "@/components/DevisForm";
import { getChantiersNoms, getDesignationsExistantes, getPersonnesNoms } from "@/lib/queries";
import { requireAcces } from "@/lib/authContext";
import { getEntrepriseActive } from "@/lib/entrepriseActive";
import RetourButton from "@/components/RetourButton";

export default async function NouveauDevisPage({ searchParams }: PageProps<"/devis/nouveau">) {
  await requireAcces("DEVIS");
  const { chantierId } = await searchParams;
  const entrepriseActive = await getEntrepriseActive();
  const [designationsExistantes, chantiers, personnes] = await Promise.all([
    getDesignationsExistantes(),
    getChantiersNoms(entrepriseActive),
    getPersonnesNoms(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <RetourButton />
      <h1 className="text-2xl font-semibold">Nouveau devis</h1>
      <DevisForm
        designationsExistantes={designationsExistantes}
        chantiers={chantiers}
        chantierIdInitial={typeof chantierId === "string" ? chantierId : undefined}
        personnes={personnes}
        entrepriseActive={entrepriseActive}
      />
    </div>
  );
}
