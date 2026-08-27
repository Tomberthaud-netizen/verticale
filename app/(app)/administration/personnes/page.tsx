import { requireAcces } from "@/lib/authContext";
import { getPersonnes } from "@/lib/queries";
import RetourButton from "@/components/RetourButton";
import PersonnesPanel from "@/components/admin/PersonnesPanel";

export default async function AdministrationPersonnesPage() {
  const moi = await requireAcces("ADMINISTRATION");
  const personnes = await getPersonnes();

  return (
    <div className="flex flex-col gap-6">
      <RetourButton />
      <h1 className="text-2xl font-semibold">Utilisateurs & accès</h1>
      <PersonnesPanel moi={moi} personnes={personnes} />
    </div>
  );
}
