import { requireAdmin } from "@/lib/authContext";
import PersonneForm from "@/components/PersonneForm";

export default async function NouvellePersonnePage() {
  await requireAdmin();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Nouvelle personne</h1>
      <PersonneForm />
    </div>
  );
}
