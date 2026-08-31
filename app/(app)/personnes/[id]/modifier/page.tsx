import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/authContext";
import { getPersonne } from "@/lib/queries";
import PersonneForm from "@/components/PersonneForm";

export default async function ModifierPersonnePage({ params }: PageProps<"/personnes/[id]/modifier">) {
  const moi = await requireAdmin();
  const { id } = await params;
  const personne = await getPersonne(id);
  if (!personne) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Modifier {personne.prenom} {personne.nom}</h1>
      <PersonneForm personneExistante={personne} moiEstAdminPrincipal={moi.estAdminPrincipal} />
    </div>
  );
}
