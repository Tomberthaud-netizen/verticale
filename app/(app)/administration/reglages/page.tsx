import { requireAdmin } from "@/lib/authContext";
import { getCouleurPrincipale, getLibellesEtOrdresOnglets } from "@/lib/queries";
import RetourButton from "@/components/RetourButton";
import ReglagesPanel from "@/components/admin/ReglagesPanel";

export default async function AdministrationReglagesPage() {
  await requireAdmin();
  const [couleurPrincipale, { libelles, ordres }] = await Promise.all([
    getCouleurPrincipale(),
    getLibellesEtOrdresOnglets(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <RetourButton />
      <h1 className="text-2xl font-semibold">Réglages du site</h1>
      <ReglagesPanel couleurPrincipale={couleurPrincipale} libelles={libelles} ordres={ordres} />
    </div>
  );
}
