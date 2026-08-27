import { requireAdmin } from "@/lib/authContext";
import { getEntreprisesInfo } from "@/lib/queries";
import RetourButton from "@/components/RetourButton";
import InformationsSocietePanel from "@/components/admin/InformationsSocietePanel";

export default async function AdministrationInformationsSocietePage() {
  await requireAdmin();
  const entreprises = await getEntreprisesInfo();

  return (
    <div className="flex flex-col gap-6">
      <RetourButton />
      <h1 className="text-2xl font-semibold">Informations société</h1>
      <InformationsSocietePanel entreprises={entreprises} />
    </div>
  );
}
