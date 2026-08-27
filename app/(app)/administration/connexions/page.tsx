import { requireAdmin } from "@/lib/authContext";
import { getConnexionsActives } from "@/lib/queries";
import RetourButton from "@/components/RetourButton";
import ConnexionsPanel from "@/components/admin/ConnexionsPanel";

export default async function AdministrationConnexionsPage() {
  await requireAdmin();
  const connexions = await getConnexionsActives();

  return (
    <div className="flex flex-col gap-6">
      <RetourButton />
      <h1 className="text-2xl font-semibold">Connexions</h1>
      <ConnexionsPanel connexions={connexions} />
    </div>
  );
}
